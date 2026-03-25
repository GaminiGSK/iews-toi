const fs = require('fs');
const c = fs.readFileSync('server/routes/company.js', 'utf8');

// Find duplicate keys in the formData object
// Look for any key that appears more than once
const formDataStart = c.indexOf("const formData = {");
const formDataEnd   = c.indexOf("};", formDataStart);
const formDataSec = c.substring(formDataStart, formDataEnd);

const keyPattern = /^\s+([A-Za-z0-9_]+)\s*:/gm;
const keyCounts = {};
let m;
while ((m = keyPattern.exec(formDataSec)) !== null) {
    const key = m[1];
    keyCounts[key] = (keyCounts[key] || 0) + 1;
}

const dups = Object.entries(keyCounts).filter(([k,v]) => v > 1);
if (dups.length === 0) {
    console.log('No duplicate keys in formData object (first occurrence only)');
} else {
    console.log('Duplicates:');
    dups.forEach(([k,v]) => console.log(`  ${k}: ${v} times`));
}

// Also check for spread operator duplicates
const spreadCount = (formDataSec.match(/\.\.\.\(\(\)/g)||[]).length;
console.log('Spread blocks:', spreadCount);
