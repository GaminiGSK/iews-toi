// Final comprehensive fix - global regex approach
// Replace ALL remaining data dash cells in pages 8-21
// Using a "nuclear" approach: replace every font-mono div that shows exactly "-"
// and is NOT part of the TIN separator (which uses span not div)

const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

let totalFixed = 0;

// For page 10's standalone rows E36-E42 and E46-E59 map:
// Pattern: individual rows with hardcoded ref like >E 36< hardcoded in HTML
// Use a line-by-line approach for standalone rows

const lines = content.split('\n');
let modified = [];
let inPage = false;
let pageNum = 0;
let currentRef = '';
const E_STANDALONE = {
    'E 36': 'E36_n', 'E 37': 'E37_n', 'E 38': 'E38_n',
    'E 39': 'E39_n', 'E 40': 'E40_n', 'E 41': 'E41_n', 'E 42': 'E42_n',
    'E 48': 'E48_n', 'E 50': 'E50_n', 'E 51': 'E51_n', 'E 52': 'E52_n',
    'E 53': 'E53_n', 'E 59': 'E59_n',
    'G 1': 'g1', 'G 2': 'g2', 'G 3': 'g3', 'G 4': 'g4',
    'G 5': 'g5', 'G 6': 'g6', 'G 7': 'g7', 'G 8': 'g8',
    'H 1': 'H1_n', 'H 2': 'H2_n', 'H 3': 'H3_n',
};

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Track page context
    const pgMatch = line.match(/activeWorkspacePage === (\d+) &&/);
    if (pgMatch) {
        pageNum = parseInt(pgMatch[1]);
        inPage = true;
    }
    
    // Look for ref labels in standalone row divs (not in .map blocks)
    // Pattern: ">E 36<" or ">G 1<" in a reference div
    const refMatch = line.match(/">\s*([A-Z] ?\d+\.?\d*)\s*<\/div>/);
    if (refMatch && inPage && [10,11,12,13,14,15,16,18,19,21].includes(pageNum)) {
        currentRef = refMatch[1].trim();
    }
    
    // For standalone dash cells on pages 10+, replace with filledData lookup
    // These are cells that show '- {' or just '-' in font-mono divs
    // And the SURROUNDING context has a known ref (currentRef)
    if (inPage && currentRef && [10,11,12,13,14,15,16,18,19,21].includes(pageNum)) {
        // Check if this is a data amount cell (font-mono with just '-')
        // and is a standalone (not in .map that already handles row.ref)
        if (line.includes('font-mono') && line.includes('>-<') && !line.includes('{row.ref}')) {
            const key = E_STANDALONE[currentRef];
            if (key) {
                line = line.replace(/>\-<\/div>/, `>{filledData?.['${key}'] || '-'}</div>`);
                totalFixed++;
            }
        }
    }
    
    // Also handle the E46-E59 complex map block which uses row.ref via row.label approach
    // This block has row.ref but uses row.label.k / row.label.e
    // The cell: {row.isChild || !['E 52', 'E 59'].includes(row.ref) ? '-' : ''}
    // Replace with: {filledData?.[row.ref.replace(' ','')+'_n'] || '-'}
    if (line.includes("row.isChild || !['E 52', 'E 59'].includes(row.ref) ? '-' : ''")) {
        line = line.replace(
            "{row.isChild || !['E 52', 'E 59'].includes(row.ref) ? '-' : ''}",
            "{!row.isChild && filledData?.[row.ref.replace(' ','')+'_n'] || (!row.isChild ? '-' : '')}"
        );
        totalFixed++;
    }
    
    modified.push(line);

    // Reset ref when we see the start of a new row (flex border-b with data content)
    if (line.includes('</div>') && line.trim() === '</div>') {
        // Don't reset on every </div>, only when logical row ends
    }
}

content = modified.join('\n');

// SECOND PASS: Handle pages 11, 12 (F-rows and G-rows) using map blocks
// that weren't caught by the earlier script because they use row.label.* instead of row.ref
// Actually, re-check if these are row.ref based

// Check page 11 remaining
const p11s = content.indexOf('activeWorkspacePage === 11 &&');
const p11e = content.indexOf('activeWorkspacePage === 12 &&') > 0 
    ? content.indexOf('activeWorkspacePage === 12 &&')
    : content.indexOf('activeWorkspacePage === 13 &&');
const p11sec = content.substring(p11s, p11e);
const p11dashes = (p11sec.match(/">-<\/div>/g) || []).length;
console.log('P11 dashes remaining:', p11dashes);
if (p11dashes > 0) {
    const p11di = p11sec.indexOf('">-<');
    console.log('P11 first dash context:', JSON.stringify(p11sec.substring(p11di-60, p11di+60)));
}

fs.writeFileSync(clientPath, content, 'utf8');

// Final count
const pageNums = [8,9,10,11,12,13,14,15,16,17,18,19,20,21];
let totalRemaining = 0;
pageNums.forEach((pg, i) => {
    const idx = content.indexOf(`activeWorkspacePage === ${pg} &&`);
    if (idx < 0) return;
    const nextPg = pageNums[i+1];
    const nextIdx = nextPg ? content.indexOf(`activeWorkspacePage === ${nextPg} &&`) : content.length;
    const sec = content.substring(idx, nextIdx);
    const left = (sec.match(/">-<\/div>/g) || []).length;
    totalRemaining += left;
    if (left > 0) console.log(`  Page ${pg}: ${left} dashes remaining`);
    else console.log(`  Page ${pg}: ✅`);
});

console.log(`\nFixed ${totalFixed} cells. Total remaining: ${totalRemaining}. Saved!`);
