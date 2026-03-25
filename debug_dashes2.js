const fs = require('fs');
const c = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

// For each page, collect all unique dash cell patterns  
[9,10,11,12,13,14,15,16,18,19,21].forEach(pg => {
    const idx = c.indexOf(`activeWorkspacePage === ${pg} &&`);
    if (idx < 0) return;
    const pageEnd = c.indexOf('activeWorkspacePage ===', idx + 50) || c.length;
    const sec = c.substring(idx, pageEnd);
    
    // Collect all unique patterns containing >-<
    const patterns = new Set();
    let di = sec.indexOf('>-<');
    while (di >= 0) {
        const ctx = sec.substring(di - 80, di + 20);
        if (!ctx.includes('text-xl leading-none') && !ctx.includes('>-</span>')) {
            // Get the className portion for the cell
            const classStart = ctx.lastIndexOf('className="');
            const classPart = classStart >= 0 ? ctx.substring(classStart, classStart + 80) : '?';
            patterns.add(classPart.substring(0, 60));
        }
        di = sec.indexOf('>-<', di + 1);
    }
    if (patterns.size > 0) {
        console.log(`\nP${pg} unique dash cell className starts:`);
        [...patterns].forEach(p => console.log('  ', JSON.stringify(p)));
    } else {
        console.log(`P${pg}: no data dashes`);
    }
});
