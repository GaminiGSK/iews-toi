const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

// The exact old pattern (verified from debug_bs2.js output)
// Both N and N-1 dash cells appear in sequence. Replace the PAIR for each map.
// Page 3 has 23-space indent for flex-1. Page 4 has same.

// The pair pattern (CRLF):
const oldPair = 'font-mono text-[10px]">-</div>\r\n                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>\r\n                    </div>\r\n                   ))}\r\n               </div>';

const newPair = 'font-mono text-[10px]">{filledData?.[row.ref.replace(\' \',\'\')+\'_n\'] || \'-\'}</div>\r\n                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">{filledData?.[row.ref.replace(\' \',\'\')+\'_n1\'] || \'-\'}</div>\r\n                    </div>\r\n                   ))}\r\n               </div>';

const count = (content.match(new RegExp(oldPair.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\r/g, '\\r').replace(/\n/g, '\\n'), 'g')) || []).length;
console.log('Occurrences of old pair:', count);

if (count > 0) {
    // Replace first 2 occurrences (page 3 and page 4)
    let replaced = 0;
    let result = content;
    for (let i = 0; i < 2; i++) {
        const idx = result.indexOf(oldPair);
        if (idx < 0) break;
        result = result.substring(0, idx) + newPair + result.substring(idx + oldPair.length);
        replaced++;
    }
    content = result;
    console.log('Replaced', replaced, 'occurrences');
} else {
    console.log('Pattern not found! Trying alternative with different indent...');
    // Try with 24 spaces for flex-1 line
    const oldPair2 = 'font-mono text-[10px]">-</div>\r\n                        <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>\r\n                     </div>\r\n                   ))}\r\n                </div>';
    const count2 = (content.split(oldPair2)).length - 1;
    console.log('Alt occurrences:', count2);
    if (count2 > 0) {
        const newPair2 = 'font-mono text-[10px]">{filledData?.[row.ref.replace(\' \',\'\')+\'_n\'] || \'-\'}</div>\r\n                        <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">{filledData?.[row.ref.replace(\' \',\'\')+\'_n1\'] || \'-\'}</div>\r\n                     </div>\r\n                   ))}\r\n                </div>';
        let replaced = 0;
        let result = content;
        for (let i = 0; i < 2; i++) {
            const idx = result.indexOf(oldPair2);
            if (idx < 0) break;
            result = result.substring(0, idx) + newPair2 + result.substring(idx + oldPair2.length);
            replaced++;
        }
        content = result;
        console.log('Replaced alt', replaced, 'occurrences');
    }
}

fs.writeFileSync(clientPath, content, 'utf8');

// Verify
const p3start = content.indexOf("{ ref: 'A 0'");
const p3end   = content.indexOf("3/16</span>", p3start) + 20;
const p3section = content.substring(p3start, p3end);
console.log('Page 3 has _n key:', p3section.includes("+'_n']"));
console.log('Page 3 still raw dashes:', p3section.includes('text-[10px]">-</div>'));

const p4start = content.indexOf("{ ref: 'A 28'");
const p4end   = content.indexOf("4/16</span>", p4start) + 20;
const p4section = content.substring(p4start, p4end);
console.log('Page 4 has _n key:', p4section.includes("+'_n']"));
console.log('Page 4 still raw dashes:', p4section.includes('text-[10px]">-</div>'));
