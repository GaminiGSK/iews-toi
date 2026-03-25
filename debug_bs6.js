const fs = require('fs');
const content = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');
const p3start = content.indexOf("{ ref: 'A 0'");
const p3section = content.substring(p3start, p3start + 6000);

// Pattern for N-1 dash ending
const dash2idx = 4418;
const after = p3section.substring(dash2idx + 9, dash2idx + 250);
console.log('After N-1 dash:');
console.log(JSON.stringify(after));
