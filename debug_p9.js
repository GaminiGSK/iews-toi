const fs = require('fs');
const c = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

// Find the first remaining dash in page 9
const p9s = c.indexOf('activeWorkspacePage === 9 &&');
const p9e = c.indexOf('activeWorkspacePage === 10 &&');
const sec = c.substring(p9s, p9e);

// Find first dash cell
const di = sec.indexOf('>-<');
if (di < 0) { console.log('No dash found'); process.exit(0); }

// Get context and show exact ending after it
const end = sec.substring(di, di + 300);
console.log('After dash:', JSON.stringify(end));
console.log('\nBytes:', [...end.substring(0,60)].map(ch => ch.charCodeAt(0).toString(16).padStart(2,'0')).join(' '));
