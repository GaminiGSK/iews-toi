const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

// Debug: look at exactly what appears after "font-mono text-[10px]">"
const p3start = content.indexOf("{ ref: 'A 0'");
const p3end   = content.indexOf("3/16</span>", p3start) + 20;
const p3section = content.substring(p3start, p3end);

// Find the exact byte sequence
const idx = p3section.indexOf('font-mono text-[10px]"');
if (idx >= 0) {
    const chunk = p3section.substring(idx, idx + 200);
    const hexDump = Buffer.from(chunk).toString('hex');
    console.log('Bytes at dash cell:');
    console.log(chunk);
    console.log('HEX:', hexDump.substring(0, 80));
}
