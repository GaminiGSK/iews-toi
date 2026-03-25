// Comprehensive fix for ALL pages 8-21
// Wire all row-based dash cells to filledData
const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

let totalReplaced = 0;

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN 1: Inside .map() blocks - single-amount column (E, F, G rows)
// Pattern: flex-1 ... font-mono text-[10px] bg-white">-</div>
// Used by pages 9, 10, 11, 12
// ─────────────────────────────────────────────────────────────────────────────
const p1_old = `font-mono text-[10px] bg-white">-</div>\r\n                     </div>\r\n                   ))}\r\n`;
const p1_new = `font-mono text-[10px] bg-white">{filledData?.[row.ref.replace(' ','')+\'_n\'] || \'-\'}</div>\r\n                     </div>\r\n                   ))}\r\n`;
let c1 = 0;
while (content.includes(p1_old)) { content = content.replace(p1_old, p1_new); c1++; }
console.log('Pattern 1 (single amount, 10px bg-white):', c1, 'replaced');
totalReplaced += c1;

// Same but with different ending (some blocks end without blank line)
const p1b_old = `font-mono text-[10px] bg-white">-</div>\r\n                  </div>\r\n                ))}\r\n`;
const p1b_new = `font-mono text-[10px] bg-white">{filledData?.[row.ref.replace(' ','')+\'_n\'] || \'-\'}</div>\r\n                  </div>\r\n                ))}\r\n`;
let c1b = 0;
while (content.includes(p1b_old)) { content = content.replace(p1b_old, p1b_new); c1b++; }
console.log('Pattern 1b:', c1b);
totalReplaced += c1b;

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN 2: E1 standalone row (page 9) - individual div, not in map
// <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px] bg-white">-</div>
// ─────────────────────────────────────────────────────────────────────────────
const p2_old = `flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px] bg-white">-</div>`;
const p2_new = `flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px] bg-white">{filledData?.['B46_n'] || \'-\'}</div>`;
let c2 = 0;
while (content.includes(p2_old)) { content = content.replace(p2_old, p2_new); c2++; }
console.log('Pattern 2 (E1 standalone):', c2);
totalReplaced += c2;

// ─────────────────────────────────────────────────────────────────────────────
// Count remaining per page
// ─────────────────────────────────────────────────────────────────────────────
const pageNums = [8,9,10,11,12,13,14,15,16,17,18,19,20,21];
pageNums.forEach((pg, i) => {
    const idx = content.indexOf(`activeWorkspacePage === ${pg} &&`);
    if (idx < 0) return;
    const nextPg = pageNums[i+1];
    const nextIdx = nextPg ? content.indexOf(`activeWorkspacePage === ${nextPg} &&`) : content.length;
    const sec = content.substring(idx, nextIdx);
    const left = (sec.match(/>-<\/div>/g) || []).length;
    if (left > 0) console.log(`  Page ${pg}: ${left} dashes still remaining`);
});

fs.writeFileSync(clientPath, content, 'utf8');
console.log(`\nTotal replaced: ${totalReplaced}. Saved!`);
