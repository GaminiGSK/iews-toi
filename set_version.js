const fs = require('fs');
const path = 'e:/Antigravity/TOI/client/src/pages/CompanyProfileNew.jsx';
let content = fs.readFileSync(path, 'utf8');

// Find and replace the version badge
const old1 = 'v2.3 Night';
const new1 = 'GK SMART \u0026 AI \u00b7 V1.0 Public';

if (content.includes(old1)) {
    // Also replace the red color with emerald for public release
    content = content.replace(
        'bg-red-600/20 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hidden sm:flex items-center shadow-inner',
        'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hidden sm:flex items-center shadow-inner gap-1.5'
    );
    content = content.replace(old1, new1);
    fs.writeFileSync(path, content, 'utf8');
    console.log('✅ Version badge updated to: GK SMART & AI · V1.0 Public');
} else {
    console.log('❌ "v2.3 Night" not found. Checking what version string exists...');
    const vMatch = content.match(/v\d+\.\d+[^\s<"']*/gi);
    if (vMatch) console.log('Found:', [...new Set(vMatch)].join(', '));
}

// Verify
const final = fs.readFileSync(path, 'utf8');
if (final.includes('V1.0 Public')) {
    console.log('✅ V1.0 Public confirmed in file');
} else {
    console.log('❌ V1.0 Public NOT in file');
}
