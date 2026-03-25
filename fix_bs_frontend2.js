const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

// Page 3 "A 0" to "A 27" rows - find both dash cells in that map and replace them
// Page 4 "A 28" to "A 52" rows - find both dash cells in that map and replace them

// The A-rows are in a .map() loop. The row.ref is available in scope.
// We need to replace ALL occurrences of the dash pair INSIDE these two specific map blocks.

// Find the boundaries of each BS map block
// Page 3 starts at "{ ref: 'A 0'," and ends at "A 27", ... ].map(...) block
// Page 4 starts at "{ ref: 'A 28'," and ends at "A 52" block

const page3MapStart = content.indexOf("{ ref: 'A 0'");
const page3MapEnd   = content.indexOf("3/16</span>", page3MapStart) + 20;
const page4MapStart = content.indexOf("{ ref: 'A 28'");
const page4MapEnd   = content.indexOf("4/16</span>", page4MapStart) + 20;

console.log('Page 3 map:', page3MapStart, '→', page3MapEnd);
console.log('Page 4 map:', page4MapStart, '→', page4MapEnd);

// Replace function: target only content in range [start, end]
function replaceInRange(text, start, end, oldStr, newStr) {
    const before = text.substring(0, start);
    const target = text.substring(start, end);
    const after  = text.substring(end);
    const replaced = target.split(oldStr).join(newStr);
    return before + replaced + after;
}

// The N column dash (w-[21%] border-r)
const dashN  = `font-mono text-[10px]">-</div>`;
const newN   = `font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n'] || '-'}</div>`;

// The N-1 column dash (flex-1)
const dashN1 = `font-mono text-[10px]">-</div>\r\n                     </div>\r\n                   ))}`;
const newN1  = `font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n1'] || '-'}</div>\r\n                     </div>\r\n                   ))}`;

// Also try \n only version
const dashN1_lf = `font-mono text-[10px]">-</div>\n                     </div>\n                   ))}`;
const newN1_lf  = `font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n1'] || '-'}</div>\n                     </div>\n                   ))}`;

// Check which line ending is used
const hasCRLF = content.includes('\r\n');
console.log('File uses CRLF:', hasCRLF);

const le = hasCRLF ? '\r\n' : '\n';

// For Page 3:
// Replace N column first
content = replaceInRange(content, page3MapStart, page3MapEnd,
    `font-mono text-[10px]">-</div>${le}                        <div className="flex-1`,
    `font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n'] || '-'}</div>${le}                        <div className="flex-1`
);

// Recalculate positions after replacement
const p3ms2 = content.indexOf("{ ref: 'A 0'");
const p3me2 = content.indexOf("3/16</span>", p3ms2) + 20;

// Replace N-1 column (the final "-" cell in the pair, before </div>))
content = replaceInRange(content, p3ms2, p3me2,
    `font-mono text-[10px]">-</div>${le}                     </div>${le}                   ))}`,
    `font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n1'] || '-'}</div>${le}                     </div>${le}                   ))}`
);

console.log('Page 3 done');

// For Page 4:
const p4ms = content.indexOf("{ ref: 'A 28'");
const p4me = content.indexOf("4/16</span>", p4ms) + 20;

content = replaceInRange(content, p4ms, p4me,
    `font-mono text-[10px]">-</div>${le}                        <div className="flex-1`,
    `font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n'] || '-'}</div>${le}                        <div className="flex-1`
);

const p4ms2 = content.indexOf("{ ref: 'A 28'");
const p4me2 = content.indexOf("4/16</span>", p4ms2) + 20;

content = replaceInRange(content, p4ms2, p4me2,
    `font-mono text-[10px]">-</div>${le}                     </div>${le}                   ))}`,
    `font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n1'] || '-'}</div>${le}                     </div>${le}                   ))}`
);

console.log('Page 4 done');

fs.writeFileSync(clientPath, content, 'utf8');
console.log('Saved!');

// Verify - check if page 3 and 4 still have raw dashes in BS context
const p3check = content.indexOf("{ ref: 'A 0'");
const p3checkEnd = content.indexOf("3/16</span>", p3check) + 20;
const p3section = content.substring(p3check, p3checkEnd);
const stillHasRaw3 = p3section.includes('font-mono text-[10px]">-</div>');
console.log('Page 3 still has raw dashes:', stillHasRaw3);

const p4check = content.indexOf("{ ref: 'A 28'");
const p4checkEnd = content.indexOf("4/16</span>", p4check) + 20;
const p4section = content.substring(p4check, p4checkEnd);
const stillHasRaw4 = p4section.includes('font-mono text-[10px]">-</div>');
console.log('Page 4 still has raw dashes:', stillHasRaw4);
