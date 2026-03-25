const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

// Exact pair pattern from debug analysis:
// N cell:   ...font-mono text-[10px]">-</div>\r\n                       <div className="flex-1...
// N-1 cell: ...font-mono text-[10px]">-</div>\r\n                    </div>\r\n                  ))}\r\n               </div>

// Full pair (from w-[21%] through the end of the map block):
const oldN  = `font-mono text-[10px]">-</div>\r\n                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>\r\n                    </div>\r\n                  ))}\r\n               </div>`;

const newN  = `font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n'] || '-'}</div>\r\n                       <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n1'] || '-'}</div>\r\n                    </div>\r\n                  ))}\r\n               </div>`;

// Count occurrences
let count = 0;
let testContent = content;
while (testContent.includes(oldN)) {
    testContent = testContent.replace(oldN, '---REPLACED---');
    count++;
}
console.log('Occurrences found:', count);

// Replace the FIRST 2 (page 3 and 4)
for (let i = 0; i < 2; i++) {
    const idx = content.indexOf(oldN);
    if (idx < 0) { console.log(`No more at iteration ${i}`); break; }
    content = content.substring(0, idx) + newN + content.substring(idx + oldN.length);
    console.log(`Replaced occurrence ${i+1}`);
}

fs.writeFileSync(clientPath, content, 'utf8');
console.log('Saved!');

// Verify
const p3s = content.indexOf("{ ref: 'A 0'");
const p3e = content.indexOf("3/16</span>", p3s) + 20;
const p3section = content.substring(p3s, p3e);
console.log('Page 3 _n key:', p3section.includes("+'_n']"));
console.log('Page 3 raw dash:', p3section.includes('">-</div>'));

const p4s = content.indexOf("{ ref: 'A 28'");
const p4e = content.indexOf("4/16</span>", p4s) + 20;
const p4section = content.substring(p4s, p4e);
console.log('Page 4 _n key:', p4section.includes("+'_n']"));
console.log('Page 4 raw dash:', p4section.includes('">-</div>'));
