const fs = require('fs');
const c = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

// Find all dashes in page 9 - ANY pattern including div-closing ones
const p9s = c.indexOf('activeWorkspacePage === 9 &&');
const p9e = c.indexOf('activeWorkspacePage === 10 &&');
const sec = c.substring(p9s, p9e);

// Try also to look for "bg-white">-</div> specifically
let di = 0;
let found = 0;
while (true) {
    const idx = sec.indexOf('">-</div>', di);
    if (idx < 0) break;
    console.log(`\nDiv-dash #${++found} at offset ${idx}:`);
    console.log(JSON.stringify(sec.substring(idx - 80, idx + 80)));
    di = idx + 1;
}
console.log('\nTotal div-dashes:', found);
