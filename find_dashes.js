const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

// Find the BS dash cells - they appear after specific row map patterns
// Let's search for the specific pattern around "3/16" and "4/16" markers

// Strategy: find the exact byte sequences around the "-" cells in the BS tables
// The cells look like: ">-</div>" in the context of BS rows

// Find all locations of the dash pattern in font-mono contexts
const pattern = /font-mono text-\[10px\]">\-<\/div>/g;
let match;
const locations = [];
while ((match = pattern.exec(content)) !== null) {
    locations.push(match.index);
}
console.log('Found dash locations:', locations.length);

// Get context around each location
for (const loc of locations) {
    const ctx = content.substring(loc - 20, loc + 80);
    console.log(`  At ${loc}: ...${ctx}...`);
}
