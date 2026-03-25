const fs = require('fs');
let c = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

// The file uses \r\n. Replace bg-white on row 14's number cell specifically.
// Target: the div at line 815 - w-[49px]...bg-white (only the number cell, not the outer wrapper)
const OLD = '<div className="w-[49px] shrink-0 border-r border-black flex flex-col items-center justify-center bg-white">\r\n                  {/* Container to center 14 properly */}';
const NEW = '<div className="w-[49px] shrink-0 border-r border-black flex flex-col items-center justify-center bg-[#e6e6e6]">\r\n                  {/* Container to center 14 properly */}';

// Verify there's exactly one occurrence within the row 14 section
const count = (c.match(new RegExp(OLD.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
console.log('Occurrences found:', count);

if (count !== 1) {
    // Try LF only  
    const OLD2 = OLD.replace(/\r\n/g, '\n');
    const count2 = (c.match(new RegExp(OLD2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    console.log('LF occurrences:', count2);
    if (count2 === 1) {
        c = c.replace(OLD2, NEW.replace(/\r\n/g, '\n'));
        fs.writeFileSync('client/src/pages/ToiAcar.jsx', c, 'utf8');
        console.log('✅ Fixed with LF');
        return;
    }
    // Direct approach: split into lines and patch line 815
    const lines = c.split('\n');
    const lineIdx = 815 - 1; // 0-indexed
    console.log('Line 815:', JSON.stringify(lines[lineIdx]));
    lines[lineIdx] = lines[lineIdx].replace('bg-white">', 'bg-[#e6e6e6]">');
    c = lines.join('\n');
    fs.writeFileSync('client/src/pages/ToiAcar.jsx', c, 'utf8');
    console.log('✅ Fixed via line 815 patch');
    process.exit(0);
}

c = c.replace(OLD, NEW);
fs.writeFileSync('client/src/pages/ToiAcar.jsx', c, 'utf8');
console.log('✅ Row 14 number cell → gray background applied');
