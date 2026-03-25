// Fix ALL pages 8-21 by wiring table rows to filledData
// The rows use `.map((row, idx) => ...)` patterns with row.ref
// The cells show hardcoded '-' for N and N-1 values
// 
// This script uses regex to find ALL patterns of the form:
// [whitespace]>-</[tag]>
// inside row-map renders that have a `row.ref` available

const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

// Find all .map blocks that render rows and replace their dash cells
// The pattern: JSX div with font-mono and a literal dash
// The context must be inside a .map((row, idx) => or .map((row) => 

// Strategy: find all Nx and N-1x cells that have hardcoded "-"
// These appear as 2 consecutive divs with the SAME classname and "-" content
// within a .map(...) block that has `row.ref`

// The pages 8-21 tables use:
// <div className="w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[11px]">-</div>
// <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px]">-</div>

// Let's look at what's around the D 9 ref in page 8
const refD9 = content.indexOf("ref: 'D 9'");
const afterD9 = content.substring(refD9, refD9 + 800);
console.log('After D9 ref context:', JSON.stringify(afterD9.substring(100, 400)));

// Find the actual cell pattern
const cellPattern21 = `w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[11px]">-</div>`;
const cellPatternFlex1 = `flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px]">-</div>`;

const cellCount21 = (content.match(new RegExp(cellPattern21.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
const cellCountF1 = (content.match(new RegExp(cellPatternFlex1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
console.log('w-[21%] dash cells:', cellCount21);
console.log('flex-1 dash cells:', cellCountF1);

if (cellCount21 > 0) {
    // Replace N column cells (w-21%)
    content = content.split(cellPattern21).join(
        `w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[11px]">{filledData?.[row.ref.replace(' ','')+\'_n\'] || \'-\'}</div>`
    );
    console.log('✅ Replaced N-column cells:', cellCount21);
}

if (cellCountF1 > 0) {
    // Replace N-1 column cells (flex-1)
    content = content.split(cellPatternFlex1).join(
        `flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px]">{filledData?.[row.ref.replace(' ','')+\'_n1\'] || \'-\'}</div>`
    );
    console.log('✅ Replaced N-1 column cells:', cellCountF1);
}

// Now handle special non-row-map pages:
// Page 13: Related Party has 107 dashes - these are individual fields (rp_*)
// Page 14: Asset Register individual fields
// Page 18: Minimum Tax / VAT individual fields
// Page 19: VAT fields
// Page 21: Declaration fields

// For Page 13 Related Party - already wired via rp_* keys in backend? Check remaining
// For pages with other patterns - check what structure they use

// Final count
const pageNums = [8,9,10,11,12,13,14,15,16,17,18,19,20,21];
pageNums.forEach(pg => {
    const pgIdx = content.indexOf(`activeWorkspacePage === ${pg} &&`);
    if (pgIdx < 0) return;
    const nextPg = pageNums[pageNums.indexOf(pg)+1];
    const nextIdx = nextPg ? content.indexOf(`activeWorkspacePage === ${nextPg} &&`) : content.length;
    const sec = content.substring(pgIdx, nextIdx);
    const dashesLeft = (sec.match(/>-<\/div>/g) || []).length;
    console.log(`Page ${pg}: ${dashesLeft} dashes remaining`);
});

fs.writeFileSync(clientPath, content, 'utf8');
console.log('\nSaved!');
