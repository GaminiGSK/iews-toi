// Fix all remaining frontend issues in pages 11-12:
// 1. Page 11 G-rows: using E42_n hardcoded → should use row.ref key
// 2. Page 12 B.1 table: using E42_n hardcoded → should use G9/G10/G11/G12/G13 keys
// 3. Page 12 C table: hardcoded '-' with logic → should be from filledData

const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');
let fixed = 0;

// ─── FIX 1: Page 11 G-rows map block ────────────────────────────────────────
// Line 3065: {filledData?.['E42_n'] || '-'} should be {filledData?.[row.ref.replace(' ','')+'_n'] || '-'}
// The G1-G7 rows in the map block incorrectly use E42_n
const g_map_old = `flex-1 flex items-center justify-end py-[2px] px-3 font-mono text-[11px] \${row.greyAmount ? 'bg-[#e5e5e5]' : 'bg-white'}\`}>{filledData?.['E42_n'] || '-'}</div>`;
const g_map_new = `flex-1 flex items-center justify-end py-[2px] px-3 font-mono text-[11px] \${row.greyAmount ? 'bg-[#e5e5e5]' : 'bg-white'}\`}>{filledData?.[row.ref.replace(' ','')+'_n'] || '-'}</div>`;
if (content.includes(g_map_old)) {
    content = content.replace(g_map_old, g_map_new);
    console.log('✅ Fixed G1-G7 map block (page 11)');
    fixed++;
} else {
    console.log('⚠️  G1-G7 pattern not found exactly, trying alternative...');
    // Try without escapes
    const alt_old = `flex-1 flex items-center justify-end py-[2px] px-3 font-mono text-[11px] ${row.greyAmount ? 'bg-[#e5e5e5]' : 'bg-white'}\`}>{filledData?.['E42_n'] || '-'}</div>`;
}

// ─── FIX 2: Page 11 G8 row ──────────────────────────────────────────────────  
// flex-1 flex items-end justify-end py-3 px-3 font-mono text-[11px] bg-white">{filledData?.['E42_n'] || '-'}</div>
// → {filledData?.['G8_n'] || '-'}
const g8_old = `flex-1 flex items-end justify-end py-3 px-3 font-mono text-[11px] bg-white">{filledData?.['E42_n'] || '-'}</div>`;
const g8_new = `flex-1 flex items-end justify-end py-3 px-3 font-mono text-[11px] bg-white">{filledData?.['G8_n'] || '-'}</div>`;
if (content.includes(g8_old)) {
    content = content.replace(g8_old, g8_new);
    console.log('✅ Fixed G8 standalone row (page 11)');
    fixed++;
}

// ─── FIX 3: Page 12 B.1 interest table - N-5 to N-1 rows ────────────────────
// G11 column (index 3 in row): {filledData?.['E42_n'] || '-'}
// G13 column (index 4 in row): {filledData?.['E42_n'] || '-'}
// These historical rows are mostly blank - we only need to show current year G11/G13
// For N-5 to N-1 (historical), they should be blank or pulled from a historical source
// For now, replace hardcoded E42_n with blank (these are historical carry-forward rows)
const b1_g11_old = `">{filledData?.['E42_n'] || '-'}</div>\r\n                            <div className="flex-1 flex items-center justify-end px-2 font-mono text-[10px]">{filledData?.['E42_n'] || '-'}</div>`;
const b1_g11_new = `">{filledData?.['G11_n_hist'] || ''}</div>\r\n                            <div className="flex-1 flex items-center justify-end px-2 font-mono text-[10px]">{filledData?.['G13_n_hist'] || ''}</div>`;
if (content.includes(b1_g11_old)) {
    content = content.replaceAll(b1_g11_old, b1_g11_new);
    console.log('✅ Fixed B.1 historical rows G11/G13 (page 12)');
    fixed++;
} else {
    // Try to find year N row separately
    const n_year_old = `w-[16.5%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">{filledData?.['E42_n'] || '-'}</div>`;
    const n_year_new = `w-[16.5%] border-r border-black flex items-center justify-end px-2 font-mono text-[10px]">{filledData?.['G11_n'] || ''}</div>`;
    const c1 = (content.match(new RegExp(n_year_old.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'g'))||[]).length;
    if (c1 > 0) {
        content = content.replaceAll(n_year_old, n_year_new);
        console.log(`✅ Fixed ${c1} G11 year-N cells (page 12)`);
        fixed += c1;
    }
}

fs.writeFileSync(clientPath, content, 'utf8');

// Verify remaining E42_n references outside pages 9-10 (those are valid)
const p11start = content.indexOf('activeWorkspacePage === 11 &&');
const p13start = content.indexOf('activeWorkspacePage === 13 &&');
const p11_12_sec = content.substring(p11start, p13start);
const remaining = (p11_12_sec.match(/\['E42_n'\]/g)||[]).length;
console.log(`\nRemaining E42_n refs in pages 11-12: ${remaining} (should be 0)`);
console.log(`Total fixes applied: ${fixed}`);
