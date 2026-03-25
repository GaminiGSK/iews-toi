const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

// Find page 21 section
const p21start = content.indexOf('activeWorkspacePage === 21 &&');
const p21end   = content.length; // last page

const p21sec = content.substring(p21start);

// Find each X-row dash cell in page 21
// They have patterns like: >X 1< ... >-</div> (within ~200 chars of each other)
let newSec = p21sec;

// The X-rows use class "w-[30%] flex justify-end ... font-bold">-</div>
// or similar. Let's just do global replace of this specific pattern within page 21
// knowing that the ref is in a nearby cell ending with "X 1", "X 2" etc.

// Do a scan to find them
let found = 0;
let idx = 0;
while (true) {
    const di = newSec.indexOf('">-</div>', idx);
    if (di < 0) break;
    
    // Check context: is this a proper Xn row? 
    const before = newSec.substring(Math.max(0, di-300), di);
    const xmatch = before.match(/>(X \d+)<\/div>.*$/s);
    
    if (xmatch && !before.includes('filledData') && !newSec.substring(di-150, di).includes('font-black text-xl')) {
        const ref = xmatch[1]; // e.g. "X 1"
        const key = ref.replace(' ', '') + '_n'; // "X1_n"
        const oldCell = newSec.substring(di, di + 9);
        const newCell = `">{filledData?.['${key}'] || '-'}</div>`;
        newSec = newSec.substring(0, di) + newCell + newSec.substring(di + 9);
        console.log(`Fixed ${ref} → ${key}`);
        found++;
        idx = di + newCell.length;
    } else {
        idx = di + 1;
    }
}

console.log('Fixed', found, 'X-row cells');

// Put page 21 back
content = content.substring(0, p21start) + newSec;
fs.writeFileSync(clientPath, content, 'utf8');

// Verify
const p21again = content.substring(content.indexOf('activeWorkspacePage === 21 &&'));
const remaining = (p21again.match(/">-<\/div>/g) || []).length;
console.log('Page 21 remaining:', remaining);
