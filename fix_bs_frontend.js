const fs = require('fs');

const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

// ─── PAGE 3: A0-A27 (Assets) ───
// The rows are rendered in a .map() and the cells are hardcoded dashes.
// We need to change:
//   <div className="w-[21%] border-r ...">-</div>
//   <div className="flex-1 ...">-</div>
// To read from filledData using the row's ref (e.g. 'A 22' -> 'A22_n')
//
// The key is row.ref.replace(' ', '') + '_n' for current year
// and row.ref.replace(' ', '') + '_n1' for prior year

// Helper to make the key: 'A 22' -> 'A22'
// We'll use a JSX expression that does: filledData?.[row.ref.replace(' ','')+'_n'] || '-'

// Page 3 - Asset rows (A0-A27)
// Find the map block for Page 3 and change the two "-" cells
const page3OldCells = `                        <div className="w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px]">-</div>
                        <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>
                     </div>
                   ))}
                </div>

               {/* Page Number absolute bottom right text */}
                <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                    <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                    <div className="flex flex-col items-center pl-1">
                       <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                       <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                    </div>
                    <span className="text-[19px] leading-none italic font-black translate-y-[1px]">3/16</span>`;

const page3NewCells = `                        <div className="w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n'] || '-'}</div>
                        <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n1'] || '-'}</div>
                     </div>
                   ))}
                </div>

               {/* Page Number absolute bottom right text */}
                <div className="w-full flex justify-end font-bold pt-2 gap-[6px] items-center text-black">
                    <svg width="6" height="10" viewBox="0 0 10 16" fill="black"><path d="M0 0 L10 8 L0 16 Z" /></svg>
                    <div className="flex flex-col items-center pl-1">
                       <span style={{ fontFamily: '"Kantumruy Pro", sans-serif'}} className="leading-none text-[12px] translate-y-[2px]">ទំព័រទី</span>
                       <span className="text-[9px] leading-none text-black tracking-widest uppercase mt-0">Page</span>
                    </div>
                    <span className="text-[19px] leading-none italic font-black translate-y-[1px]">3/16</span>`;

if (content.includes(page3OldCells)) {
    content = content.replace(page3OldCells, page3NewCells);
    console.log('✅ Page 3 cells fixed!');
} else {
    console.log('❌ Page 3 pattern not found, trying manual search...');
    const dashIdx = content.indexOf('font-mono text-[10px]">-</div>\n                        <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>\n                     </div>\n                   ))}\n                </div>\n\n               {/* Page Number');
    if (dashIdx >= 0) {
        console.log('Found at char:', dashIdx);
        console.log('Context:', content.substring(dashIdx - 50, dashIdx + 300));
    }
}

// Page 4 - Liability/Equity rows (A28-A52)
// Same pattern but the map ends with "3/16" vs "4/16"
const page4OldCells = `                        <div className="w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px]">-</div>
                        <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">-</div>
                     </div>
                   ))}
                </div>`;

const page4NewCells = `                        <div className="w-[21%] border-r border-black flex items-center justify-end shrink-0 py-[2px] px-2 font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n'] || '-'}</div>
                        <div className="flex-1 flex items-center justify-end py-[2px] px-2 font-mono text-[10px]">{filledData?.[row.ref.replace(' ','')+'_n1'] || '-'}</div>
                     </div>
                   ))}
                </div>`;

// Count remaining occurrences of page4OldCells after page 3 fix
const afterPage3 = content.indexOf('3/16');
const remaining = content.indexOf(page4OldCells, afterPage3);
if (remaining >= 0) {
    content = content.substring(0, remaining) + page4NewCells + content.substring(remaining + page4OldCells.length);
    console.log('✅ Page 4 cells fixed!');
} else {
    console.log('❌ Page 4 pattern not found');
}

fs.writeFileSync(clientPath, content, 'utf8');
console.log('Frontend written!');
console.log('Verifying - searching for remaining hardcoded "-" in BS rows...');
// Check no more raw "-" in the bs rows area
const checkIdx  = content.indexOf('font-mono text-[10px]">-</div>');
console.log(checkIdx >= 0 ? '⚠️  Still has hardcoded dashes at char: ' + checkIdx : '✅ No more hardcoded dashes found');
