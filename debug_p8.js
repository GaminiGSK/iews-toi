const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

// Page 8 specific pattern (D-rows, text-[11px], 2 cells per row, ends with ))}\n                </div>)
// Lines 2373 + 2374:
const p8pair = `>\-</div>\r\n                        <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[11px]">-</div>\r\n                     </div>\r\n                   ))}\r\n                </div>`;
console.log('p8 found:', content.includes(p8pair));

// Let me check exact bytes around line 2373
const p8start = content.indexOf("activeWorkspacePage === 8 &&");
const p8sect  = content.substring(p8start, p8start + 5000);
const dashIdx = p8sect.indexOf('>-<');
console.log('dash at', dashIdx);
if (dashIdx >= 0) {
    const ctx = p8sect.substring(dashIdx - 60, dashIdx + 200);
    console.log('Context:', JSON.stringify(ctx));
}
