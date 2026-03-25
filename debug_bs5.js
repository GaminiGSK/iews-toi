const fs = require('fs');
const content = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');
const p3start = content.indexOf("{ ref: 'A 0'");
const p3section = content.substring(p3start, p3start + 6000);

// Find all dash occurrences
let idx = -1;
let count = 0;
while ((idx = p3section.indexOf('">-</div>', idx + 1)) !== -1) {
    count++;
    console.log(`Dash #${count} at offset ${idx}:`);
    const after = p3section.substring(idx + 9, idx + 120);
    console.log(JSON.stringify(after));
    if (count >= 4) break;
}
