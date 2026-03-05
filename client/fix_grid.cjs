const fs = require('fs');
let code = fs.readFileSync('src/pages/LiveTaxWorkspace.jsx', 'utf8');

const sIdx = code.indexOf('{activePage === 9 && (');
const eIdx = code.indexOf('{activePage === 11 && (', sIdx);

if (sIdx === -1 || eIdx === -1) {
    console.error("Bounds not found");
    process.exit(1);
}

let section = code.substring(sIdx, eIdx);

// Fix the py-3 py-2 mistake
section = section.replace(/py-3 py-2/g, 'py-3');

// Fix column widths
// 1. the text column
// we will target the w-[60%] and make it w-[75%]
section = section.replace(/w-\[60\%\]/g, 'w-[75%]');

// 2. the input column width. Right now it uses flex-1 which expands heavily.
// Also update right padding so it matches the left side.
section = section.replace(/className="flex-1 flex items-center justify-end px-6 font-black/g, 'className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 font-black');
section = section.replace(/className="flex-1 flex items-center justify-end px-6 text-/g, 'className="w-[15%] min-w-[120px] flex items-center justify-end px-4 md:px-6 text-');

// For totals columns: e.g. "w-[70%]"
section = section.replace(/w-\[70\%\]/g, 'w-[85%]');

// page 10 has min-h-[4rem]
section = section.replace(/min-h-\[4rem\]/g, 'h-auto py-3');
section = section.replace(/min-h-\[3\.5rem\]/g, 'h-auto py-3');

// We should also allow the text in page 9 and 10 to wrap properly.
// The text spans:
section = section.replace(/className="font-bold text-xs leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}/g, 'className="font-bold text-xs leading-relaxed mb-1 break-words whitespace-normal" style={{ fontFamily: \'"Kantumruy Pro", sans-serif\' }}');
section = section.replace(/className="font-bold text-xs leading-tight mb-1 text-white"/g, 'className="font-bold text-xs leading-relaxed mb-1 text-white break-words whitespace-normal"');

section = section.replace(/className="text-\[10px\] font-bold text-emerald-400 uppercase leading-tight"/g, 'className="text-[10px] font-bold text-emerald-400 uppercase leading-relaxed break-words whitespace-normal"');
section = section.replace(/className="text-\[10px\] font-bold text-slate-400 uppercase leading-tight"/g, 'className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed break-words whitespace-normal"');



code = code.substring(0, sIdx) + section + code.substring(eIdx);
fs.writeFileSync('src/pages/LiveTaxWorkspace.jsx', code);
console.log("Fixed successfully");
