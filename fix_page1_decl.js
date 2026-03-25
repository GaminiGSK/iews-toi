const fs = require('fs');
const path = 'client/src/pages/ToiAcar.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\r\n');

console.log('Total lines:', lines.length);

// Fix 1: Line 1221 (0-indexed: 1220) - widen Filed In box and add Khmer font
// Original: w-[100px] ... text-[10px] font-bold
const L1221 = lines[1220];
console.log('L1221:', JSON.stringify(L1221.substring(0,80)));
if (L1221.includes('w-[100px]') && L1221.includes('filedIn')) {
    lines[1220] = L1221
        .replace('w-[100px]', 'w-[130px]')
        .replace('text-[10px] font-bold', 'text-[8.5px] font-bold')
        .replace('shrink-0 overflow-hidden px-1">', 'shrink-0 overflow-hidden px-1" style={{ fontFamily: \'\"Kantumruy Pro\", sans-serif\'}}>');
    console.log('✅ Fix 1 applied - wider box');
} else {
    console.log('❌ Fix 1 not applied - no match');
}

// Fix 2: Lines 1222-1244 - Replace filingDate blocks with today's date IIFE
// We need to find the start of the date block (the closing > of the filedIn box)
// Then replace lines 1222-1244 with the today's date block
// L1222 (0-indexed 1221) should be: <div className="flex gap-[4px] ml-4">
const L1222 = lines[1221];
console.log('L1222:', JSON.stringify(L1222.substring(0,60)));
if (L1222.includes('flex gap-[4px] ml-4')) {
    // Find end of this block - L1244 (0-indexed 1243) should be "                        </div>"
    // Replace lines 1221..1243 (0-indexed) with the new today block
    const indent = '                        ';
    const newDateBlock = [
        `${indent}{/* TODAY's date (print date) - computed live */}`,
        `${indent}{(() => {`,
        `${indent}  const now = new Date();`,
        `${indent}  const td = String(now.getDate()).padStart(2,'0') + String(now.getMonth()+1).padStart(2,'0') + String(now.getFullYear());`,
        `${indent}  return (`,
        `${indent}    <div className="flex gap-[4px] ml-4">`,
        `${indent}      <div className="flex gap-[2px]">`,
        `${indent}        {[0,1].map(i => <div key={'td'+i} className="w-[18px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-black text-[11px]">{td[i]}</div>)}`,
        `${indent}      </div>`,
        `${indent}      <div className="flex gap-[2px] ml-1">`,
        `${indent}        {[2,3].map(i => <div key={'tm'+i} className="w-[18px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-black text-[11px]">{td[i]}</div>)}`,
        `${indent}      </div>`,
        `${indent}      <div className="flex gap-[2px] ml-1">`,
        `${indent}        {[4,5,6,7].map(i => <div key={'ty'+i} className="w-[18px] h-[22px] border border-black bg-white flex items-center justify-center font-bold text-black text-[11px]">{td[i]}</div>)}`,
        `${indent}      </div>`,
        `${indent}    </div>`,
        `${indent}  );`,
        `${indent}})()}`,
    ];
    lines.splice(1221, 23, ...newDateBlock);
    console.log('✅ Fix 2 applied - today date block');
} else {
    console.log('❌ Fix 2 not applied');
}

// Re-read lines after splice shift
// Fix 3: Find signatory block - look for "absolute bottom-[28px]"
const absIdx = lines.findIndex(l => l.includes('absolute bottom-[28px]') && l.includes('signatoryName'));
console.log('Signatory abs line (0-indexed):', absIdx);
if (absIdx >= 0) {
    // The parent div is the line before the {filledData?.signatoryName check
    // Find "flex-1 flex flex-col justify-end" container div
    let parentIdx = absIdx - 1;
    while (parentIdx > absIdx - 5 && !lines[parentIdx].includes('flex-1 flex flex-col justify-end')) parentIdx--;
    console.log('Parent div at:', parentIdx, JSON.stringify(lines[parentIdx].substring(0,60)));

    // Replace: absolute bottom-[28px] → just flow in the doc (no absolute)
    lines[absIdx] = lines[absIdx]
        .replace('absolute bottom-[28px] w-full text-center text-blue-800 font-bold text-[14px]', 'w-full text-center text-blue-800 font-bold text-[13px] mb-[6px]');

    // Also change the parent to add pt-6 so there is space
    if (lines[parentIdx].includes('pb-[8px] relative')) {
        lines[parentIdx] = lines[parentIdx]
            .replace('justify-end text-center text-[9px] w-full items-center pb-[8px] relative', 'justify-end text-center text-[9px] w-full items-center pb-[8px] pt-4 relative');
    }
    console.log('✅ Fix 3 applied - name moved up');
} else {
    console.log('❌ Fix 3 not applied');
}

fs.writeFileSync(path, lines.join('\r\n'), 'utf8');
console.log('Saved!');
