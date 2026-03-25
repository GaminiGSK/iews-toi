const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

// The same dash pair pattern used by pages 5/6/7 — row.ref based
// For pages 8-21 the rows end differently - let's find exact pair types per page

// Page 8: D1-D9 rows — ending in "}})\n                </div>" style
// All row-based tables that haven't been wired yet.
// Strategy: look for the pair "font-mono text-[11px]\">-</div>" 
// (pages 8+ use text-[11px] vs pages 3-7 which use text-[10px])

const pair11 = '">-</div>\r\n                        <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px]">-</div>\r\n                     </div>\r\n                   ))}\r\n                </div>';

const repl11 = '">{filledData?.[row.ref.replace(\' \',\'\')+\'_n\'] || \'-\'}</div>\r\n                        <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px]">{filledData?.[row.ref.replace(\' \',\'\')+\'_n1\'] || \'-\'}</div>\r\n                     </div>\r\n                   ))}\r\n                </div>';

// Count occurrences first
let test = content;
let count11 = 0;
while (test.includes(pair11)) { test = test.replace(pair11, 'X'); count11++; }
console.log('Pair (11px) count:', count11);

// Replace all occurrences
let replaced = 0;
while (content.includes(pair11)) {
    content = content.replace(pair11, repl11);
    replaced++;
}
console.log('Replaced (11px):', replaced);

// Also check for other separator patterns used in pages 9-21
// Page 9 E-rows, page 10 F-rows, etc. - might use different spacing
// Also check for the tos_* monthly table rows (special structure)
// And for specific single-field rows like e1_amount, e2_amount, etc.

// Check for remaining dashes inside pages 8-21
const pageStarts = [];
['8','9','10','11','12','13','14','15','16','17','18','19','20','21'].forEach(pg => {
    const idx = content.indexOf(`activeWorkspacePage === ${pg} &&`);
    if (idx >= 0) pageStarts.push({ pg, idx });
});
pageStarts.sort((a,b) => a.idx - b.idx);

pageStarts.forEach((ps, i) => {
    const end = pageStarts[i+1]?.idx || content.length;
    const section = content.substring(ps.idx, end);
    const dashesLeft = (section.match(/>\-<\/div>/g) || []).length;
    console.log(`Page ${ps.pg}: ${dashesLeft} raw dashes remaining`);
});

fs.writeFileSync(clientPath, content, 'utf8');
console.log('\nSaved!');
