const fs = require('fs');
const c = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

// Find all dashes in page 9
const p9s = c.indexOf('activeWorkspacePage === 9 &&');
const p9e = c.indexOf('activeWorkspacePage === 10 &&');
const sec = c.substring(p9s, p9e);

let di = 0;
let found = 0;
while (true) {
    const idx = sec.indexOf('>-<', di);
    if (idx < 0) break;
    const ctx = sec.substring(idx - 80, idx + 150);
    const isData = !ctx.includes('text-xl leading-none') && !ctx.includes('</span>') && ctx.includes('div');
    console.log(`\nDash #${++found} at offset ${idx} [isData=${isData}]:`);
    console.log(JSON.stringify(ctx.substring(30, 120)));
    di = idx + 1;
}
