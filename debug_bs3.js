// Show the raw JSON.stringify of the exact pair area
const fs = require('fs');
const content = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');
const p3start = content.indexOf("{ ref: 'A 0'");
const p3section = content.substring(p3start, p3start + 5000);
// Find the first "-</div>" occurrence
const dashIdx = p3section.indexOf('">-</div>');
if (dashIdx >= 0) {
    // Show 10 chars before and 300 chars after as JSON (escaped)
    const chunk = p3section.substring(dashIdx - 10, dashIdx + 320);
    console.log(JSON.stringify(chunk));
}
