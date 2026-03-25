const fs = require('fs');
const c = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

// For each page, find the FIRST dash cell context
[9,10,11,12,13,14,15,16,18,19,21].forEach(pg => {
    const idx = c.indexOf(`activeWorkspacePage === ${pg} &&`);
    if (idx < 0) { console.log(`P${pg}: NOT FOUND`); return; }
    // Search further into the page
    const pageEnd = c.indexOf('activeWorkspacePage ===', idx + 50) || c.length;
    const sec = c.substring(idx, pageEnd);
    
    // Find all occurrences of >-< to catch dash patterns
    let di = sec.indexOf('>-<');
    let found = 0;
    while (di >= 0 && found < 3) {
        // skip TIN separator (those look like ">-<" with span)
        const ctx = sec.substring(di - 60, di + 100);
        if (!ctx.includes('text-xl leading-none')) { // not the TIN hyphen
            console.log(`\nP${pg} at offset ${di}:`);
            console.log(JSON.stringify(ctx));
            found++;
        }
        di = sec.indexOf('>-<', di + 1);
    }
    if (found === 0) console.log(`P${pg}: no non-TIN dash found`);
});
