import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

// ------------- LOGGER SETUP -------------
const logger = {
  error: (message: string, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      ...meta
    }));
  },
  info: (message: string, meta?: any) => {
    console.info(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...meta
    }));
  }
};

// 🛡️ Sentinel: Maximize Vercel proxy bounds to 60s protecting against high SRM latency
export const maxDuration = 60;

// 🛡️ Sentinel: Using SERVICE_ROLE key or strictly internal backend keys for secure upserts
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// 🚨 CRITICAL: Never fallback to VITE_SUPABASE_ANON_KEY for HMAC generation as it is public
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 🛡️ Sentinel: Generate a secure random fallback secret on module load to ensure determinism
// for local proxy mode without using guessable/hardcoded public secrets.
const statelessFallbackSecret = crypto.randomBytes(32).toString('hex');

if (!supabaseUrl || !supabaseKey) {
  logger.error('🛡️ Sentinel: Missing Supabase Service Role Key');
}

// Proceed only if supabase credentials are valid to avoid downstream crashes or predictable empty-key hashes
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

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

  // Concatenate ALL `.sanitize` fragments: SRM inherently drops double-quotes and dynamic spacing natively across updates!
  const sanitizeMatches = [...htmlBytes.matchAll(/\.sanitize\(\s*['"]([^'"]+)['"]\s*\)/gi)];
  
  let cleanedHtml = "";
  if (sanitizeMatches.length > 0) {
      for (const match of sanitizeMatches) {
          cleanedHtml += convertHexToHTML(match[1]);
      }
  } else if (htmlBytes.includes("zmlvalue=")) {
      const zmlMatches = [...htmlBytes.matchAll(/zmlvalue=['"]([^'"]+)['"]/gi)];
      for (const match of zmlMatches) {
          const decoded = match[1].replace(/\\x([0-9a-fA-F]{2})/g, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)))
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#x([0-9a-fA-F]{2});/ig, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)))
                    .replace(/&#x([0-9a-fA-F]{4});/ig, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
          cleanedHtml += decoded;
      }
  } else if (htmlBytes.includes("<table")) {
      cleanedHtml = htmlBytes;
  } else {
      throw new Error(`DOM_PARSE_FAILURE: Missing injection payloads. Auth Valid but no tables found. Buffer: ${htmlBytes.substring(0, 300)}`);
  }

  // Structurally aligning 1:1 with Browser parsing streams. Stripped all malicious Regex DOM truncation overrides ensuring `tds.eq(6)` indexing alignment survives unio anomalies natively.
  
  // 🛡️ Sentinel: ULTIMATE DECODER OVERRIDE (Moved Up to un-brick Name parsing sequence natively corrupted by SRM tag escapes)
  // SRM `zmlvalue` dynamically injects JavaScript payload arrays causing literal escaping tags (\/) and (\n) mismatches.
  // The Vercel edge stream strictly decodes to ASCII, but leaves structural HTML strings malformed natively.
  cleanedHtml = cleanedHtml.replace(/\\\//g, '/').replace(/\\-/g, '-').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, '').replace(/\\r/g, '').replace(/\\t/g, '');

  // 🛡️ Sentinel: If our resulting DOM tree literally possesses 0 Academic metrics, brutally throw to expose what SRM returned.
  if (!cleanedHtml.toLowerCase().includes("course code") && !cleanedHtml.toLowerCase().includes("course title")) {
      throw new Error(`DOM_PARSE_FAILURE: Decoded HTML stripped of expected metric tables! Debug Hex Output: ${cleanedHtml.substring(0, 350)}`);
  }

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

  // === 1. STRUCTURALLY RESILIENT CHEERIO DOM TRAVERSAL ===
  const attendanceRaw: any[] = [];
  const courseMap: Record<string, string> = {};
  const seenCoursesName = new Set<string>();
  const marksMap = new Map<string, any>();

  // (Decoder logic natively hoisted up before HEURISTIC blocks)
  
  const $ = cheerio.load(cleanedHtml);
  
  $("tr").each((_, tr) => {
      const tds = $(tr).find("td, th");
      if (tds.length === 0) return;

      const codeText = tds.eq(0).text().replace(/\u00a0/g, ' ').replace(/Regular/gi, "").trim();
      // Bypass standard header rows smoothly without failing on elective asterisks (*) or hyphenated unio course patterns
      if (!codeText || codeText.toLowerCase().includes("course code") || codeText.toLowerCase().includes("subject code")) return;

      // Clean up course code for hashing references
      const courseCodeClean = codeText.toUpperCase().replace(/[\n\r*]/g, '').trim();

      // HEURISTIC A: ATTENDANCE BLOCK (Strict Numeric Verification on Ends)
      // Check column counts. unio accounts sometimes embed 8, 9, or 10 columns
      if (tds.length >= 8) {
          const courseName = tds.eq(1).text().split(' \u2013')[0].split(' -')[0].replace(/\u00a0/g, ' ').trim();
          const categoryRaw = tds.eq(2).text().replace(/\u00a0/g, ' ').trim();
          const slot = tds.eq(4).text().trim();
          const roomStr = tds.eq(5).text().trim();
          
          // Natively extract text before invoking float calculations to prevent silent NaN masking
          let conductedText = tds.eq(6).text().trim();
          let absentText = tds.eq(7).text().trim();
          
          if (conductedText === '-' || conductedText === '') conductedText = '0';
          if (absentText === '-' || absentText === '') absentText = '0';

          const conducted = parseFloat(conductedText);
          const absent = parseFloat(absentText);

          // If the matrix slots represent physical numerical hours, it's irrefutably an attendance row
          if (!isNaN(conducted) && !isNaN(absent) && conductedText !== "" && absentText !== "" && courseName && courseName.toLowerCase() !== "null") {
              const present = conducted - absent;
              const isJoint = courseCodeClean.endsWith('J');
              const finalName = isJoint && categoryRaw ? `${courseName} (${categoryRaw})` : courseName;
              const uniqueName = finalName.toLowerCase().trim();

              courseMap[courseCodeClean] = courseName;

              if (!seenCoursesName.has(uniqueName)) {
                  seenCoursesName.add(uniqueName);
                  attendanceRaw.push({
                      name: finalName,
                      code: courseCodeClean,
                      slot: slot,
                      room: roomStr,
                      category: categoryRaw,
                      present, absent, total: conducted, 
                      percentage: conducted > 0 ? (present/conducted) * 100 : 0
                  });
              }
              return; // Successful structural match, bypass Marks evaluation for this row
          }
      }

      // HEURISTIC B: MARKS TARGETING (Detecting nested inner tables cleanly)
      // Note: Removed the arbitrary 'tds.length <= 6' limit because a subject with 4 components 
      // produces 7 total nested TDs, causing it to be silently skipped.
      if (tds.length >= 3) {
          const nestedTables = tds.eq(2).find("table");
          if (nestedTables.length > 0) {
              const graph: any[] = [];
              let overallScored = 0;
              let overallTotal = 0;

              nestedTables.find("td").each((_, testCell) => {
                  const rawHtml = $(testCell).html() || '';
                  // Replace <br> tags with spaces to cleanly separate concatenated lines
                  const spacedHtml = rawHtml.replace(/<br\s*\/?>/gi, ' ');
                  const fullText = cheerio.load(spacedHtml).text().replace(/\s+/g, ' ').trim();
                  
                  const parts = fullText.split('/');
                  
                  if (parts.length >= 2) {
                      const testTitle = parts[0].trim();
                      const rightSide = parts.slice(1).join('/').trim().split(/\s+/);
                      
                      if (rightSide.length >= 2) {
                          const total = parseFloat(rightSide[0]) || 0;
                          const rawScored = rightSide[1].toUpperCase();
                          
                          let scored: number | string = 0;
                          if (rawScored.includes('ABS')) {
                              scored = 'abs';
                          } else {
                              scored = parseFloat(rawScored) || 0;
                          }

                          graph.push({ name: testTitle, val: scored, max: total });
                          overallScored += (typeof scored === 'number' ? scored : 0);
                          overallTotal += total;
                      }
                  }
              });

              // Securely cross-reference Attendance Name Mappings for absolute consistency
              const resolvedName = courseMap[courseCodeClean] || tds.eq(1).text().trim();
              if (resolvedName) {
                  const uniqueName = resolvedName.toLowerCase().trim();
                  const existing = marksMap.get(uniqueName);
                  if (!existing || existing.metricVal < overallTotal) {
                      marksMap.set(uniqueName, {
                          name: resolvedName,
                          code: courseCodeClean,
                          total: `${overallScored.toFixed(2)} / ${overallTotal.toFixed(2)}`,
                          graph,
                          metricVal: overallTotal
                      });
                  }
              }
          }
      }
  });

  const marksArray = Array.from(marksMap.values()).map(m => {
      delete m.metricVal;
      return m;
  });

  // 🛡️ Sentinel: THE ULTIMATE TRAP.
  // If Cheerio fails to assemble a single array index, we forcibly abort the entire sequence
  // and serialize the EXACT raw unformatted HTML memory buffer generated by Vercel into Base64,
  // bypassing parsing rules entirely so we can visually inspect the hidden structures natively!
  if (attendanceRaw.length === 0) {
      throw new Error(`BASE64_DOM_DUMP: ${Buffer.from(cleanedHtml).toString('base64')}`);
  }

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

    // ⚡ Bolt Optimization:
    // Pre-calculate month indices natively using a Map. By resolving `validMonths.findIndex()`
    // iteratively once per header string outside the `.sort()` callback instead of inside
    // it for every comparison step (O(N*logN)), sorting becomes near-instant (O(1) lookups).
    // Impact: Avoids ~O(N*logN * 12) repetitive array lookups per event sort loop natively!
    const monthIdMap = new Map<string, number>();
    monthHeaders.forEach(mHeader => {
       monthIdMap.set(mHeader, validMonths.findIndex(m => mHeader.includes(m)));
    });

    calendarEvents.sort((a, b) => {
       const mIdA = monthIdMap.get(a.month) ?? 0;
       const mIdB = monthIdMap.get(b.month) ?? 0;
       if (mIdA !== mIdB) return mIdA - mIdB;
       return parseInt(a.date) - parseInt(b.date);
    });

    return calendarEvents;
  } catch (e: any) {
    logger.error("Calendar parser crash", { error: e.name || 'UnknownError' });
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
        subj.slot.split(/[-\/,\s]+/).forEach((s: string) => {
          if (s && !slotMap.has(s)) slotMap.set(s, subj);
        });
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

    });
    
    return days;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 🛡️ Sentinel: Prevent sensitive data and errors from being cached by browsers or edge proxies universally
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🛡️ Sentinel: Prevent simple-request CSRF via form submissions
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ error: 'Unsupported Media Type: Expected application/json' });
  }

  // 🛡️ Sentinel: Safe body destructuring preventing null object access crashes
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  const { regNo, password } = req.body;
  if (!regNo || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  // 🛡️ Sentinel: Fail securely if the backend lacks the secret capability key
  // 🛡️ Sentinel: Gracefully fallback if the backend lacks the secret capability key natively
  if (!supabase) {
    logger.error('🛡️ Sentinel: Supabase Service Role Key missing. Operating in Stateless Local Proxy Mode without Database Upserts.');
  }

  // 🛡️ Sentinel: Enforce strict type and length limits to prevent TypeError crashes and large input DoS
  if (typeof regNo !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid credential format' });
  }

  if (regNo.length > 100 || password.length > 100) {
    return res.status(400).json({ error: 'Credentials exceed maximum length' });
  }

  // 🛡️ Sentinel: Input Sanitization - Validate that regNo contains only allowed characters
  // This prevents injection of arbitrary characters or malformed payloads into downstream requests
  if (!/^[a-zA-Z0-9.@_-]+$/.test(regNo)) {
    logger.error('🛡️ Sentinel: Invalid character detected in regNo payload', { regNo: regNo.substring(0, 10) });
    return res.status(400).json({ error: 'Invalid registration number format' });
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
      timeout: 15000, // 🛡️ Sentinel: Prevent serverless function hangs / Resource Exhaustion
      maxContentLength: 5000000, // 🛡️ Sentinel: Enforce strict payload size limits (5MB) to prevent upstream memory exhaustion (DoS)
      maxBodyLength: 5000000,
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

    // 🛡️ Sentinel: Prevent Server-Side Request Forgery (SSRF) by strictly validating the OAuth redirect URI
    let isValidUri = false;
    if (typeof oauthorize_uri === 'string') {
      try {
        const parsedUri = new URL(oauthorize_uri);
        isValidUri = parsedUri.protocol === 'https:' && parsedUri.hostname === 'academia.srmist.edu.in';
      } catch {
        // Invalid URL format
      }
    }
    if (!isValidUri) {
      logger.error('🛡️ Sentinel: Blocked potential SSRF attempt via malformed OAuth URI', { uri: oauthorize_uri });
      return res.status(502).json({ error: 'Invalid upstream gateway response' });
    }

    // 2. Resolve OAuth Gateways (Redirect chasing securing JSESSIONID natively)
    const finalAuthURL = `${oauthorize_uri}&access_token=${access_token}`;
    await client.get(finalAuthURL);

    // ⚡ Bolt Optimization:
    // Parallelizing independent scraping operations using Promise.all
    // Impact: Halves the overall scraping latency since calendar data and academic
    // data streams no longer block each other.
    const [academicPayload, calendarMap] = await Promise.all([
       fetchAcademicsData(client),
       fetchCalendarData(client)
    ]);
    
    let globalAttendancePerc = 0;
    if (academicPayload.attendance.length > 0) {
       const sum = academicPayload.attendance.reduce((acc, curr) => acc + curr.percentage, 0);
       globalAttendancePerc = sum / academicPayload.attendance.length;
    }

    // Phase 4.3 Native Timetable & Calendar Executions
    const timetableMap = generateLocalTimetable(academicPayload.attendance, academicPayload.isBatchTwo);

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
    // 🛡️ Sentinel: Generate a secure hash to prevent IDOR vulnerabilities
    // instead of storing plaintext emails that can be manipulated in localStorage
    // Convert to lower case to ensure case-insensitive IDOR protections and no duplicate cache entries
    const secureId = crypto.createHmac('sha256', supabaseKey || statelessFallbackSecret).update(regNo.toLowerCase()).digest('hex');

    if (supabase) {
       const { error: dbError } = await supabase
         .from('academia_cache')
         .upsert({ id: secureId, data: fetchedPayload });

       if (dbError) {
          logger.error('🛡️ Sentinel: Supabase UPSERT blocked natively (Likely RLS configuration missing). Bypassing globally.', { error: 'Database Upsert Error' });
       }
    }

    return res.status(200).json({ success: true, data: fetchedPayload, academiaId: secureId });

  } catch (error: any) {
    // 🛡️ Sentinel: Removed trace from response to prevent stack trace leakage
    // Additionally, prevent raw error.message leakage to client which might contain Base64 DOM dumps
    // We strictly avoid logging error.stack or unmodified error.message here to prevent Database Connection String / Configuration leakage
    const safeErrorMessage = error.name === 'Error' && error.message ? 'Scraping Execution Failed' : 'Unknown Error';
    logger.error('Vercel Scraping Root Error', { error: safeErrorMessage });
    return res.status(500).json({ error: 'Fatal scraping termination. Please try again later.' });
  }
}
