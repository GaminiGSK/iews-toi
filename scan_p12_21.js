// Deep scan of pages 12-21 to find all field types and structures
const fs = require('fs');
const c = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

const pages = [11,12,13,14,15,16,17,18,19,20,21];
const pageLine = {};
pages.forEach(pg => {
    const idx = c.indexOf(`activeWorkspacePage === ${pg} &&`);
    pageLine[pg] = { start: idx };
});
// Add end markers
pages.forEach((pg, i) => {
    const next = pages[i+1];
    pageLine[pg].end = next ? pageLine[next].start : c.length;
});

pages.forEach(pg => {
    const sec = c.substring(pageLine[pg].start, pageLine[pg].end);
    
    // What keys does this page READ from filledData?
    const readKeys = [...new Set((sec.match(/filledData\??\.([\w]+)|filledData\?\.\['([^']+)'\]|filledData\?\.\[row\./g) || [])
        .map(m => m.replace('filledData?.','').replace('filledData.',''))
        .filter(k => k && !k.startsWith('[row'))
    )];
    
    // How many row.ref-based map blocks?
    const mapRefs = (sec.match(/row\.ref\./g) || []).length;
    
    // Any hardcoded ref strings like >H 1<, >I 1< etc?
    const refs = [...new Set((sec.match(/>([A-Z] ?\d+)<\/div>/g) || []).map(m => m.replace('>','').replace('</div>','')))];
    
    // Any conditional/inline literal values?
    const literals = (sec.match(/>\{[^}]+\}<\/div>/g) || []).length;
    
    console.log(`\n=== Page ${pg} ===`);
    console.log('filledData reads:', readKeys.slice(0,12).join(', ') || 'NONE');
    console.log('Row-ref map blocks:', mapRefs);
    console.log('Standalone refs found:', refs.slice(0,10).join(', ') || 'none');
    console.log('Dynamic cells:', literals);
    
    // Find the page title/section name
    const titleMatch = sec.match(/TOI 01 \/ ([XVI]+)/);
    console.log('Section:', titleMatch?.[0] || '?');
});
