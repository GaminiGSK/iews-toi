const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

const p3start = content.indexOf("{ ref: 'A 0'");
const p3end   = content.indexOf("3/16</span>", p3start) + 20;
const p3section = content.substring(p3start, p3end);

// Find the first "font-mono text-[10px]" and show its exact surroundings
const idx = p3section.indexOf('font-mono text-[10px]"');
console.log('Found at p3section index:', idx);

// Show 15 chars before and 150 chars after
const chunk = p3section.substring(Math.max(0, idx - 15), idx + 250);
// Show as escaped string
console.log(JSON.stringify(chunk));
