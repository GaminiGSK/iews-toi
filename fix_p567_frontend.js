const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

// We need to find and replace the 3 pairs for pages 5, 6, 7
// Each page has the same dash pattern but ends with different page marker

// The ending sequences verified from the codebase:
// Page 5: ends around "5/16"
// Page 6: ends around "6/16"  
// Page 7: ends around "7/16"

// Same pair pattern as pages 3 & 4
const dashPair = 'font-mono text-[10px]">-</div>\r\n                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>\r\n                    </div>\r\n                  ))}\r\n               </div>';

// Replacement: use row.ref converted to key (e.g. 'B 0' -> 'B0_n', 'C 20' -> 'C20_n')
const pairReplacement = 'font-mono text-[10px]">{filledData?.[row.ref.replace(\' \',\'\')+\'_n\'] || \'-\'}</div>\r\n                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">{filledData?.[row.ref.replace(\' \',\'\')+\'_n1\'] || \'-\'}</div>\r\n                    </div>\r\n                  ))}\r\n               </div>';

// Count occurrences
let total = 0;
let test = content;
while (test.includes(dashPair)) { test = test.replace(dashPair, 'X'); total++; }
console.log('Remaining dash pairs:', total);

// The pairs at pages 3 & 4 are already replaced.
// We now need to replace the next 3 occurrences (pages 5, 6, 7)
let replaced = 0;
for (let i = 0; i < 3; i++) {
    const idx = content.indexOf(dashPair);
    if (idx < 0) { console.log(`No more at i=${i}`); break; }
    content = content.substring(0, idx) + pairReplacement + content.substring(idx + dashPair.length);
    replaced++;
}
console.log('Replaced', replaced, 'pairs');

// Also fix page 7 (C-rows) - it may have different ending (no blank line before </div>)
// Let's check how page 7 ends
const p7start = content.indexOf("{ ref: 'C 1'");
const p7end = content.indexOf("7/16</span>", p7start) + 20;
const p7section = content.substring(p7start, p7end);
const p7hasDash = p7section.includes('">-</div>');
console.log('Page 7 has raw dashes:', p7hasDash);

if (p7hasDash) {
    // Find the exact pair for page 7 
    const dashIdx = p7section.indexOf('">-</div>');
    const after = p7section.substring(dashIdx + 9, dashIdx + 300);
    console.log('After dash:', JSON.stringify(after));
}

fs.writeFileSync(clientPath, content, 'utf8');
console.log('Saved!');

// Verify
['5/16', '6/16', '7/16'].forEach(pg => {
    const startKey = pg === '5/16' ? "{ ref: 'B 0'" : pg === '6/16' ? "{ ref: 'B 25'" : "{ ref: 'C 1'";
    const s = content.indexOf(startKey);
    const e = content.indexOf(pg+'</span>', s) + 20;
    const section = content.substring(s, e);
    console.log(`Page ${pg}: has _n key=${section.includes("+'_n']")} | raw dash=${section.includes('">-</div>')}`);
});
