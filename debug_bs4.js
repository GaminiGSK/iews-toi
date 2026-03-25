const fs = require('fs');
const content = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');
const p3start = content.indexOf("{ ref: 'A 0'");
const p3section = content.substring(p3start, p3start + 6000);
const dashIdx = p3section.indexOf('">-</div>');
const chunk = p3section.substring(dashIdx + 9, dashIdx + 450);  // show what comes AFTER the N cell
console.log(JSON.stringify(chunk));
