const cheerio = require('cheerio');
const html = `<tr><td bgcolor="#E6E6FA">21IPE312P</td><td bgcolor="#E6E6FA">Theory</td><td><table cellspacing="1" cellpadding="1" border="2" style="font-size"><tbody><tr><td bgcolor="#E6E6FA"><font size="1.5"><strong>FP-I/10.00</strong><br>6.00</font></td><td bgcolor="#E6E6FA"><font size="1.5"><strong>PBL-I/20.00</strong><br>18.00</font></td><td bgcolor="#E6E6FA"><font size="1.5"><strong>PBL-II/20.00</strong><br>20.00</font></td></tr></tbody></table></td></tr>`;
const $ = cheerio.load(html);
const courseMap = { '21IPE312P': 'Test Course' };
const marksMap = new Map();

$("tr").each((_, tr) => {
    const tds = $(tr).find("td, th");
    console.log("tds.length =", tds.length);
    if (tds.length === 0) return;
    const codeText = tds.eq(0).text().replace(/\u00a0/g, ' ').replace(/Regular/gi, "").trim();
    const courseCodeClean = codeText.toUpperCase().replace(/[\n\r*]/g, '').trim();

    if (tds.length >= 3 && tds.length <= 6) {
        const nestedTables = tds.eq(2).find("table");
        if (nestedTables.length > 0) {
            const graph = [];
            let overallScored = 0;
            let overallTotal = 0;

            nestedTables.find("td").each((_, testCell) => {
                const rawHtml = $(testCell).html() || '';
                const spacedHtml = rawHtml.replace(/<br\s*\/?>/gi, ' ');
                const fullText = cheerio.load(spacedHtml).text().replace(/\s+/g, ' ').trim();
                console.log("fullText:", fullText);
                
                const parts = fullText.split('/');
                console.log("parts:", parts);
                
                if (parts.length >= 2) {
                    const testTitle = parts[0].trim();
                    const rightSide = parts.slice(1).join('/').trim().split(/\s+/);
                    console.log("rightSide:", rightSide);
                    
                    if (rightSide.length >= 2) {
                        const total = parseFloat(rightSide[0]) || 0;
                        const rawScored = rightSide[1].toUpperCase();
                        
                        let scored = 0;
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

            const resolvedName = courseMap[courseCodeClean] || tds.eq(1).text().trim();
            if (resolvedName) {
                const uniqueName = resolvedName.toLowerCase().trim();
                marksMap.set(uniqueName, { total: overallTotal, graph });
            }
        }
    }
});

console.log(Array.from(marksMap.values()));
