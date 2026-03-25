// Find the remaining E42_n ref in pages 11-12
const fs = require('fs');
const c = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');
const p11 = c.indexOf('activeWorkspacePage === 11 &&');
const p13 = c.indexOf('activeWorkspacePage === 13 &&');
const sec = c.substring(p11, p13);
let di = 0;
while (true) {
    const idx = sec.indexOf("'E42_n'", di);
    if (idx < 0) break;
    console.log('Found:', JSON.stringify(sec.substring(idx-80, idx+50)));
    di = idx+1;
}
