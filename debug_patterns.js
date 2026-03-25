const fs = require('fs');
const c = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

// Collect ALL unique "context after dash" patterns across all pages
const pages = [9,10,11,12,13,14,15,16,18,19,21];
const allPatterns = new Map();

pages.forEach(pg => {
    const pgS = c.indexOf(`activeWorkspacePage === ${pg} &&`);
    const nextPg = pages[pages.indexOf(pg)+1];
    const pgE = nextPg ? c.indexOf(`activeWorkspacePage === ${nextPg} &&`) : c.length;
    const sec = c.substring(pgS, pgE);
    
    let di = 0;
    while (true) {
        const idx = sec.indexOf('">-</div>', di);
        if (idx < 0) break;
        // Grab 150 chars after the ">-</div>" to identify the ending pattern
        const after = sec.substring(idx + 8, idx + 180);
        const key = JSON.stringify(after.substring(0,80));
        if (!allPatterns.has(key)) {
            allPatterns.set(key, { pg, offset: idx, before: JSON.stringify(sec.substring(idx-60, idx+9)) });
        }
        di = idx + 1;
    }
});

console.log('Unique patterns:', allPatterns.size);
for (const [k, v] of allPatterns) {
    console.log(`\nP${v.pg}:`,v.before);
    console.log('After:', k);
}
