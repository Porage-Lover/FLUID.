const cheerio = require('cheerio');
const html = `<table><tr><td bgcolor="#E6E6FA">21MAB204T</td><td bgcolor="#E6E6FA">Theory</td><td><table cellspacing="1" cellpadding="1" border="2" style="font-size"><tbody><tr><td bgcolor="#E6E6FA"><font size="1.5"><strong>FT-III/15.00</strong><br>11.10</font></td><td bgcolor="#E6E6FA"><font size="1.5"><strong>FT-II/15.00</strong><br>14.10</font></td><td bgcolor="#E6E6FA"><font size="1.5"><strong>FT-I/5.00</strong><br>5.00</font></td></tr></tbody></table></td></tr></table>`;
const $ = cheerio.load(html);
const courseMap = { '21MAB204T': 'Probability and Queueing Theory' };
const marksMap = new Map();

$("tr").each((_, tr) => {
    const tds = $(tr).find("td, th");
    if (tds.length === 0) return;
    const codeText = tds.eq(0).text().replace(/\u00a0/g, ' ').replace(/Regular/gi, "").trim();
    if (!codeText || codeText.toLowerCase().includes("course code")) return;
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
                
                const parts = fullText.split('/');
                if (parts.length >= 2) {
                    const testTitle = parts[0].trim();
                    const rightSide = parts.slice(1).join('/').trim().split(/\s+/);
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
console.log(Array.from(marksMap.values())[0]);
