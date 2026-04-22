const cheerio = require('cheerio');
const rawHtml = '<font size="1.5"><strong>FP-I/10.00</strong><br>6.00</font>';
const spacedHtml = rawHtml.replace(/<br\s*\/?>/gi, ' ');
const fullText = cheerio.load(spacedHtml).text().replace(/\s+/g, ' ').trim();
const fullText2 = cheerio.load(spacedHtml).root().text().replace(/\s+/g, ' ').trim();

console.log("fullText:", fullText);
console.log("fullText2:", fullText2);
