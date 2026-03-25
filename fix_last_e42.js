const fs = require('fs');
let c = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

// Find specifically the E42_n ref within pages 11-12 context 
const p11s = c.indexOf('activeWorkspacePage === 11 &&');
const p13s = c.indexOf('activeWorkspacePage === 13 &&');

let found = false;
let di = p11s;
while (di < p13s) {
    const idx = c.indexOf("'E42_n'", di);
    if (idx < 0 || idx > p13s) break;
    
    console.log('Found at', idx, ':', JSON.stringify(c.substring(idx-60, idx+60)));
    // Replace this specific occurrence
    c = c.substring(0, idx) + "'G13_n'" + c.substring(idx + "'E42_n'".length);
    found = true;
    di = idx + 1;
}

if (found) {
    fs.writeFileSync('client/src/pages/ToiAcar.jsx', c, 'utf8');
    console.log('Saved');
} else {
    console.log('No E42_n found in pages 11-12 range');
}
