const fs = require('fs');
const cheerio = require('cheerio');

let cleanedHtml = fs.readFileSync('decoded.html', 'utf8');

// Unescape SRM payload JSON literals
cleanedHtml = cleanedHtml.replace(/\\\//g, '/').replace(/\\-/g, '-').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, '').replace(/\\r/g, '').replace(/\\t/g, '');

const $ = cheerio.load(cleanedHtml);
const attendanceRaw = [];

$("tr").each((i, tr) => {
  const tds = $(tr).find("td, th");
  //console.log(`[Row ${i}] tds length: ${tds.length}`);
  if (tds.length === 0) return;

  let codeText = tds.eq(0).text().replace(/\u00a0/g, ' ').replace(/Regular/gi, "").trim();
  const courseCodeClean = codeText.toUpperCase().replace(/[\n\r\*]/g, '').trim();

  //console.log(`[Row ${i}] codeText: "${codeText}" | courseCodeClean: "${courseCodeClean}"`);

  if (!codeText || codeText.toLowerCase().includes("course code") || codeText.toLowerCase().includes("information for") || codeText === '') {
     //console.log(`[Row ${i}] SKIPPING because codeText failed bounds.`);
     return;
  }

  if (tds.length >= 8) {
      const courseName = tds.eq(1).text().replace(/\u00a0/g, ' ').trim();
      const category = tds.eq(2).text().replace(/\u00a0/g, ' ').trim();
      let conductedText = tds.eq(6).text().trim();
      let absentText = tds.eq(7).text().trim();

      const conducted = parseFloat(conductedText);
      const absent = parseFloat(absentText);

      console.log(`Row ${i} PASSED bounds - Name=${courseName}, Conducted=${conducted}, Absent=${absent}`);
      
      attendanceRaw.push({
          name: courseName,
          code: courseCodeClean
      });
  } else {
     //console.log(`[Row ${i}] SKIPPING because tds.length (${tds.length}) < 8`);
  }
});

console.log("Attendance len:", attendanceRaw.length);
