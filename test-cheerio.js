const cheerio = require('cheerio');
const html = `<tr><td bgcolor="#E6E6FA">21IPE312P</td><td bgcolor="#E6E6FA">Theory</td><td><table cellspacing="1" cellpadding="1" border="2" style="font-size"><tbody><tr><td bgcolor="#E6E6FA"><font size="1.5"><strong>FP-I/10.00</strong><br>6.00</font></td><td bgcolor="#E6E6FA"><font size="1.5"><strong>PBL-I/20.00</strong><br>18.00</font></td><td bgcolor="#E6E6FA"><font size="1.5"><strong>PBL-II/20.00</strong><br>20.00</font></td></tr></tbody></table></td></tr><tr><td bgcolor="#E6E6FA">21MAB204T</td><td bgcolor="#E6E6FA">Theory</td><td><table cellspacing="1" cellpadding="1" border="2" style="font-size"><tbody><tr><td bgcolor="#E6E6FA"><font size="1.5"><strong>FT-III/15.00</strong><br>11.10</font></td><td bgcolor="#E6E6FA"><font size="1.5"><strong>FT-II/15.00</strong><br>14.10</font></td><td bgcolor="#E6E6FA"><font size="1.5"><strong>FT-I/5.00</strong><br>5.00</font></td></tr></tbody></table></td></tr><tr><td bgcolor="#E6E6FA">21CSC204J</td><td bgcolor="#E6E6FA">Theory</td><td><table cellspacing="1" cellpadding="1" border="2" style="font-size"><tbody><tr><td bgcolor="#E6E6FA"><font size="1.5"><strong>FJ-I/15.00</strong><br>10.68</font></td><td bgcolor="#E6E6FA"><font size="1.5"><strong>FJ-II/15.00</strong><br>13.25</font></td><td bgcolor="#E6E6FA"><font size="1.5"><strong>FJ-III/15.00</strong><br><font color="red">Abs</font></font></td><td bgcolor="#E6E6FA"><font size="1.5"><strong>LLJ-I/7.00</strong><br>5.40</font></td></tr></tbody></table></td></tr>`;
const $ = cheerio.load(html);
const results = [];
$("table").find("td").each((_, td) => {
    const rawHtml = $(td).html() || '';
    const spacedHtml = rawHtml.replace(/<br\s*\/?>/gi, ' ');
    const fullText = cheerio.load(spacedHtml).text().replace(/\s+/g, ' ').trim();
    
    const parts = fullText.split('/');
    if (parts.length >= 2) {
        const testTitle = parts[0].trim();
        const rightSide = parts.slice(1).join('/').trim().split(/\s+/);
        
        let scored = '0';
        let total = '0';
        if (rightSide.length >= 2) {
            total = parseFloat(rightSide[0]) || 0;
            const rawScored = rightSide[1].toUpperCase();
            if (rawScored.includes('ABS')) {
                scored = 'abs';
            } else {
                scored = parseFloat(rawScored) || 0;
            }
        }
        results.push({ name: testTitle, total, scored });
    }
});
console.log(results);
