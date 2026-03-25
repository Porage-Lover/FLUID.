import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

// 🛡️ Sentinel: Using SERVICE_ROLE key for secure backend upserts (bypassing RLS)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('🛡️ Sentinel: Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ------------- SCRAPER UTILS -------------
function convertHexToHTML(hexString: string): string {
  if (!hexString) return '';
  return hexString.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

// ------------- CORE ACADEMIA PARSERS -------------
async function fetchAcademicsData(client: any): Promise<{ attendance: any[], marks: any[], studentName: string, isBatchTwo: boolean }> {
  const resp = await client.get('https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Attendance', {
    headers: { 'Accept': '*/*', 'X-Requested-With': 'XMLHttpRequest' }
  });

  const htmlBytes = resp.data;
  if (!htmlBytes || typeof htmlBytes !== 'string') {
    throw new Error(`Invalid response type received from SRM. Expected HTML string.`);
  }

  const parts = htmlBytes.split(".sanitize('");
  if (parts.length < 2) {
    throw new Error(`DOM_PARSE_FAILURE: Missing '.sanitize' injection payload. Valid Auth but blocked routing? Buffer Preview: ${htmlBytes.substring(0, 400)}`);
  }

  const hexString = parts[1].split("')")[0];
  let cleanedHtml = convertHexToHTML(hexString);
  cleanedHtml = cleanedHtml.replace(/<td {2}bgcolor='#E6E6FA' style='text-align:center'> - <\/td>/g, "");

  // === 0. USER IDENTITY BOUNDS ===
  let studentName = "";
  let isBatchTwo = false;
  
  const nameIdx = cleanedHtml.indexOf('Name:');
  if (nameIdx !== -1) {
     const nameStr = cleanedHtml.substring(nameIdx, nameIdx + 200);
     const m = nameStr.match(/<strong>(.*?)<\/strong>/i);
     if (m) studentName = m[1].replace(/<[^>]+>/g, '').trim();
  }

  const batchIdx = cleanedHtml.indexOf('Batch');
  if (batchIdx !== -1) {
     const batchStr = cleanedHtml.substring(batchIdx, batchIdx + 100);
     const match = batchStr.match(/<strong>(.*?)<\/strong>/i);
     if (match) isBatchTwo = match[1].includes('2');
     else isBatchTwo = batchStr.includes('2');
  }

  // === 1. ATTENDANCE BOUNDS ===
  const attendanceRaw: any[] = [];
  const courseMap: Record<string, string> = {};
  const seenCoursesName = new Set<string>();
  
  const attParts = cleanedHtml.split('<table style="font-size :16px;" border="1" align="center" cellpadding="1" cellspacing="1" bgcolor="#FAFAD2">');
  if (attParts.length > 1) {
     const attTableHtml = attParts[1].split('</table>')[0];
     const $att = cheerio.load('<table>' + attTableHtml + '</table>');
     
     $att("tr").each((_, tr) => {
        const tds = $att(tr).find("td");
        if (tds.length >= 8) {
           const codeText = tds.eq(0).text().trim();
           const courseCodeRaw = codeText.replace(/Regular/gi, "").trim();
           
           // Isolate genuine course codes: strictly 5-15 alphanumeric characters (NO spaces, brackets, or dots)
           const isCourseCode = /^[A-Z0-9]{5,15}$/i.test(courseCodeRaw);
           
           if (codeText !== "Course Code" && isCourseCode) {
              const courseName = tds.eq(1).text().split(' \u2013')[0].trim();
              const categoryRaw = tds.eq(2).text().trim();
              const slot = tds.eq(4).text().trim();
              const roomStr = tds.eq(5).text().trim();
              const conducted = parseFloat(tds.eq(6).text()) || 0;
              const absent = parseFloat(tds.eq(7).text()) || 0;
              const present = conducted - absent;
              
              if (courseName.toLowerCase() !== "null") {
                 const uniqueCode = courseCodeRaw.toUpperCase();
                 const category = tds.eq(2).text().trim();
                 const isJoint = uniqueCode.endsWith('J');
                 const finalName = isJoint && category ? `${courseName} (${category})` : courseName;
                 const uniqueName = finalName.toLowerCase().trim();
                 
                 // Bind ALL codes to map for the trailing marks resolver regardless of dupes.
                 // We crucially pass strictly the RAW original name so Marks unified overwrites trigger cleanly.
                 courseMap[uniqueCode] = courseName;
                 
                 if (!seenCoursesName.has(uniqueName)) {
                    seenCoursesName.add(uniqueName);
                    attendanceRaw.push({
                      name: finalName,
                      code: uniqueCode,
                      slot: slot,
                      room: roomStr,
                      category: categoryRaw,
                      present, absent, total: conducted, 
                      percentage: conducted > 0 ? (present/conducted) * 100 : 0
                    });
                 }
              }
           }
        }
     });
  }

  // === 2. MARKS BOUNDS ===
  const marksMap = new Map<string, any>();
  let mTableStr = cleanedHtml;
  // Bypassing SRM nested garbage HTML recursively
  mTableStr = mTableStr.replace(/<table style="font-size" :6;="" border="2" cellpadding="1" cellspacing="1"><tbody><tr><td>/g, "");
  mTableStr = mTableStr.replace(/<\/td><\/tr>/g, "");
  
  const rowsTables = mTableStr.split('</table></td>');
  
  for (const tableRowHtml of rowsTables) {
    if (!tableRowHtml.trim()) continue;
    
    // We expect internal parse structures to hold valid nodes
    const $markRow = cheerio.load(tableRowHtml);
    $markRow("tr").each((_, tr) => {
       const cells = $markRow(tr).find("td");
       if (cells.length < 3) return;

         const courseCodeRaw = cells.eq(0).text().replace(/Regular/gi, "").trim();
         const courseCode = courseCodeRaw.toUpperCase();
         
         // Validation: Ignore completely blank artifacts passing as rows
         if (!/^[A-Z0-9]{5,15}$/i.test(courseCode)) return;

         const graph: any[] = [];
         let overallScored = 0;
         let overallTotal = 0;

         cells.eq(2).find("table td").each((_, testCell) => {
           const testText = $markRow(testCell).text().trim().split(".00");
           if (testText.length >= 2) {
             const testNameParts = testText[0].split("/");
             const testTitle = testNameParts[0];
             const total = parseFloat(testNameParts[1]) || 0;
             const scored = parseFloat(testText[1]) || 0;

             graph.push({ name: testTitle, val: scored });
             overallScored += scored;
             overallTotal += total;
           }
         });

         const resolvedName = courseMap[courseCode];
         if (resolvedName) {
           const uniqueName = resolvedName.toLowerCase().trim();
           const existing = marksMap.get(uniqueName);
           // Deduplicate overriding empty nodes with populated node metrics collapsing Practical/Theory layers
           if (!existing || existing.metricVal < overallTotal) {
             marksMap.set(uniqueName, {
               name: resolvedName,
               code: courseCode,
               total: `${overallScored.toFixed(2)} / ${overallTotal.toFixed(2)}`,
               graph,
               metricVal: overallTotal
             });
           }
         }
      });
    }

  const marksArray = Array.from(marksMap.values()).map(m => {
    delete m.metricVal;
    return m;
  });

  return { attendance: attendanceRaw, marks: marksArray, studentName, isBatchTwo };
}

// ------------- CALENDAR & TIMETABLE PARSERS -------------
async function fetchCalendarData(client: any): Promise<any[]> {
  try {
    const d = new Date();
    const currentMonth = d.getMonth() + 1;
    const currentYearStr = d.getFullYear().toString();
    const prevYearStr = (d.getFullYear() - 1).toString();
    const nextYearStr = (d.getFullYear() + 1).toString();

    let academicYearStr = '';
    let term = '';

    if (currentMonth >= 7) {
       term = 'ODD';
       academicYearStr = `${currentYearStr}_${nextYearStr.slice(-2)}`;
    } else {
       term = 'EVEN';
       academicYearStr = `${prevYearStr}_${currentYearStr.slice(-2)}`;
    }

    const plannerEndpoint = `https://academia.srmist.edu.in/srm_university/academia-academic-services/page/Academic_Planner_${academicYearStr}_${term}`;

    // Force inject client-side cookie bypasses natively dropped by OAuth
    client.defaults.jar.setCookieSync('ZCNEWUIPUBLICPORTAL=true; path=/', 'https://academia.srmist.edu.in');
    client.defaults.jar.setCookieSync('cli_rgn=IN; path=/', 'https://academia.srmist.edu.in');

    const resp = await client.get(plannerEndpoint, {
      headers: { 'Accept': '*/*', 'X-Requested-With': 'XMLHttpRequest' }
    });
    
    let htmlText = '';
    if (resp.data.includes('<table bgcolor=')) {
      htmlText = resp.data;
    } else {
      const parts = resp.data.split('zmlvalue="');
      if (parts.length > 1) {
        // Safe quote termination boundary decoding extracting explicit Hex and generic HTML mappings
        const decoded = parts[1].split('"')[0];
        htmlText = decoded.replace(/\\x([0-9a-fA-F]{2})/g, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)))
                          .replace(/&lt;/g, '<')
                          .replace(/&gt;/g, '>')
                          .replace(/&amp;/g, '&')
                          .replace(/&quot;/g, '"')
                          .replace(/&#x([0-9a-fA-F]{2});/ig, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)))
                          .replace(/&#x([0-9a-fA-F]{4});/ig, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
      } else return [];
    }
    
    const $cal = cheerio.load(htmlText);
    const calendarEvents: any[] = [];
    const monthHeaders: string[] = [];
    const validMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    $cal("th").each((_, th) => {
       const text = $cal(th).text().trim();
       if (validMonths.some(m => text.includes(m))) monthHeaders.push(text);
    });
    
    $cal("table tr").each((_, tr) => {
       const tds = $cal(tr).find("td");
       monthHeaders.forEach((month, i) => {
          const pad = i * 5;
          const date = tds.eq(pad).text().trim();
          const day = tds.eq(pad + 1).text().trim();
          const event = tds.eq(pad + 2).text().trim();
          const dayOrder = tds.eq(pad + 3).text().trim();
          
          if (date && date.trim() !== '') {
             if (dayOrder && dayOrder !== "-") {
                calendarEvents.push({ date, day, title: 'Day Order ' + dayOrder, tag: 'Academic', type: 'working', month });
             } else {
                let titleStr = event.trim();
                if (!titleStr) {
                   const isWeekend = day.toLowerCase().includes('sat') || day.toLowerCase().includes('sun');
                   titleStr = isWeekend ? 'Weekend - Holiday' : 'Holiday';
                }
                calendarEvents.push({ date, day, title: titleStr, tag: 'Off Day', type: 'holiday', month });
             }
          }
       });
    });

    calendarEvents.sort((a, b) => {
       const mIdA = validMonths.findIndex(m => a.month.includes(m));
       const mIdB = validMonths.findIndex(m => b.month.includes(m));
       if (mIdA !== mIdB) return mIdA - mIdB;
       return parseInt(a.date) - parseInt(b.date);
    });

    return calendarEvents;
  } catch (e) {
    console.error("Calendar parser crash:", e);
    return [];
  }
}

// Generate pure O(N) matrix Timetable mapping leveraging predefined course batches natively.
function generateLocalTimetable(attendanceData: any[], isBatchTwo: boolean) {
    const days: any = { "1": [], "2": [], "3": [], "4": [], "5": [] };

    // Pre-process attendanceData into a slot map for O(1) lookup
    const slotMap = new Map<string, any>();
    attendanceData.forEach(subj => {
      if (subj.slot) {
        if (subj.slot.includes('-')) {
          subj.slot.split('-').forEach((s: string) => {
            if (!slotMap.has(s)) slotMap.set(s, subj);
          });
        } else {
          if (!slotMap.has(subj.slot)) slotMap.set(subj.slot, subj);
        }
      }
    });

    const batch1Raw = [
      ["A", "A", "F", "F", "G", "P6", "P7", "P8", "P9", "P10"],
      ["P11", "P12", "P13", "P14", "P15", "B", "B", "G", "G", "A"],
      ["C", "C", "A", "D", "B", "P26", "P27", "P28", "P29", "P30"],
      ["P31", "P32", "P33", "P34", "P35", "D", "D", "B", "E", "C"],
      ["E", "E", "C", "F", "D", "P46", "P47", "P48", "P49", "P50"]
    ];
    
    // Quick time string mapping assuming 8AM root shift natively expanded terminating precisely at 4:50
    const tms = ["08:00 AM", "08:50 AM", "09:40 AM", "10:45 AM", "11:35 AM", "12:30 PM", "01:20 PM", "02:15 PM", "03:10 PM", "04:00 PM", "04:50 PM"];
    
    const activeBatch = isBatchTwo ? [
      ["P1", "P2", "P3", "P4", "P5", "A", "A", "F", "F", "G"],
      ["B", "B", "G", "G", "A", "P16", "P17", "P18", "P19", "P20"],
      ["P21", "P22", "P23", "P24", "P25", "C", "C", "A", "D", "B"],
      ["D", "D", "B", "E", "C", "P36", "P37", "P38", "P39", "P40"],
      ["P41", "P42", "P43", "P44", "P45", "E", "E", "C", "F", "D"]
    ] : batch1Raw;

    // Loop through the days
    activeBatch.forEach((daySlots, dayIndex) => {
       const dayNumber = (dayIndex + 1).toString();
       
       daySlots.forEach((slotRef, slotIdx) => {
           // Search through attendance data for someone enrolled in this specific slot
           const matchingSubject = slotMap.get(slotRef);
           
           if (matchingSubject) {
              const etIdx = slotIdx + 1 < tms.length ? slotIdx + 1 : slotIdx;
              days[dayNumber].push({
                 code: matchingSubject.code,
                 name: matchingSubject.name,
                 room: "Campus",
                 type: slotRef.startsWith("P") ? "Practical" : "Theory",
                 st: tms[slotIdx],
                 et: tms[etIdx]
              });
           }
       });

       // Force Custom User Timetable Injections natively filling API voids
       if (dayNumber === '4') {
          const dbmsId = attendanceData.find(s => s.name?.toLowerCase().includes('database management systems'));
          if (dbmsId) {
             days['4'] = days['4'].filter((c: any) => !(c.st === '08:00 AM' || c.st === '08:50 AM'));
             days['4'].unshift(
                { code: dbmsId.code, name: dbmsId.name, room: 'LAB', type: 'Practical', st: '08:00 AM', et: '08:50 AM' },
                { code: dbmsId.code, name: dbmsId.name, room: 'LAB', type: 'Practical', st: '08:50 AM', et: '09:40 AM' }
             );
          }
       }

       if (dayNumber === '5') {
          const daaId = attendanceData.find(s => s.name?.toLowerCase().includes('design and analysis') && (s.category?.toLowerCase() === 'practical' || s.name?.toLowerCase().includes('practical')));
          if (daaId) {
             days['5'] = days['5'].filter((c: any) => !(c.st === '08:00 AM' || c.st === '08:50 AM'));
             days['5'].unshift(
                { code: daaId.code, name: daaId.name, room: daaId.room || 'LAB', type: 'Practical', st: '08:00 AM', et: '08:50 AM' },
                { code: daaId.code, name: daaId.name, room: daaId.room || 'LAB', type: 'Practical', st: '08:50 AM', et: '09:40 AM' }
             );
          }
       }
    });
    
    return days;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🛡️ Sentinel: Safe body destructuring preventing null object access crashes
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  const { regNo, password } = req.body;
  if (!regNo || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  // 🛡️ Sentinel: Enforce strict type and length limits to prevent TypeError crashes and large input DoS
  if (typeof regNo !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid credential format' });
  }

  if (regNo.length > 100 || password.length > 100) {
    return res.status(400).json({ error: 'Credentials exceed maximum length' });
  }

  // Build the live SRM username format natively
  const fullUsername = regNo.includes('@') ? regNo : `${regNo}@srmist.edu.in`;

  try {
    const jar = new CookieJar();
    // Vercel Serverless Axios engine natively supporting tough-cookie persistence sweeps
    const client = wrapper(axios.create({ 
      jar, 
      withCredentials: true,
      maxRedirects: 10,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }));

    // 1. Authenticate against Academia (Portal Signin)
    const loginPayload = new URLSearchParams({
      username: fullUsername,
      password: password,
      client_portal: 'true',
      portal: '10002227248',
      servicename: 'ZohoCreator',
      serviceurl: 'https://academia.srmist.edu.in/',
      is_ajax: 'true',
      grant_type: 'password',
      service_language: 'en'
    });

    const signinResp = await client.post('https://academia.srmist.edu.in/accounts/signin.ac', loginPayload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://academia.srmist.edu.in',
        'Referer': 'https://academia.srmist.edu.in/'
      }
    });

    // Determine payload bounds
    const data = signinResp.data;
    if (data?.error?.msg || typeof data === 'string' && data.toLowerCase().includes('concurrent')) {
      return res.status(401).json({ error: data?.error?.msg || 'Concurrent session limit reached. Terminate past sessions.' });
    }

    if (data?.status === 'fail') {
      return res.status(401).json({ error: data?.message || 'Authentication Failed.' });
    }

    const { access_token, oauthorize_uri } = data?.data || {};
    if (!access_token || !oauthorize_uri) {
      return res.status(401).json({ error: 'Missing OAuth tokens inside valid payload.' });
    }

    // 2. Resolve OAuth Gateways (Redirect chasing securing JSESSIONID natively)
    const finalAuthURL = `${oauthorize_uri}&access_token=${access_token}`;
    await client.get(finalAuthURL);

    // 3. Initiate Native Cheerio Structural Fetching Algorithms
    const academicPayload = await fetchAcademicsData(client);
    
    let globalAttendancePerc = 0;
    if (academicPayload.attendance.length > 0) {
       const sum = academicPayload.attendance.reduce((acc, curr) => acc + curr.percentage, 0);
       globalAttendancePerc = sum / academicPayload.attendance.length;
    }

    // Phase 4.3 Native Timetable & Calendar Executions
    const timetableMap = generateLocalTimetable(academicPayload.attendance, academicPayload.isBatchTwo);
    const calendarMap = await fetchCalendarData(client);

    let globalMarksScored = 0;
    let globalMarksTotal = 0;
    academicPayload.marks.forEach(m => {
       const [scoredStr, totalStr] = m.total.split(' / ');
       globalMarksScored += parseFloat(scoredStr) || 0;
       globalMarksTotal += parseFloat(totalStr) || 0;
    });

    const fetchedPayload = {
      user: { 
        name: academicPayload.studentName || fullUsername.split('@')[0].toUpperCase(), 
        overallAttendance: parseFloat(globalAttendancePerc.toFixed(2)), 
        overallMarks: `${globalMarksScored.toFixed(2)} / ${globalMarksTotal.toFixed(2)}`
      },
      attendance: academicPayload.attendance,
      timetable: timetableMap,
      marks: academicPayload.marks,
      calendar: calendarMap 
    };

    // 4. UPSERT securely into Supabase `academia_cache`
    const { error: dbError } = await supabase
      .from('academia_cache')
      .upsert({ id: regNo, data: fetchedPayload });

    if (dbError) throw dbError;

    return res.status(200).json({ success: true, data: fetchedPayload });

  } catch (error: any) {
    // 🛡️ Sentinel: Removed trace from response to prevent stack trace leakage
    console.error('Vercel Scraping Root Error Stack:', error.stack || error.message);
    return res.status(500).json({ error: 'Failed to negotiate authentication sequence with SRM.' });
  }
}
