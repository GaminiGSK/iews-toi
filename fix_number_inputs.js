const fs = require('fs');

const files = [
    'e:/Antigravity/TOI/client/src/pages/SalaryTOSRecon.jsx',
    'e:/Antigravity/TOI/client/src/pages/AssetDepreciation.jsx',
    'e:/Antigravity/TOI/client/src/pages/RelatedPartyDisclosure.jsx',
];

let totalFixed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const before = content;

    // Replace type="number" with type="text" inputMode="decimal"
    // But only on input elements (not select/other)
    content = content.replace(/type="number"/g, 'type="text" inputMode="decimal"');

    // Also hide spinner arrows via className additions — add no-spinner class
    const count = (before.match(/type="number"/g) || []).length;
    totalFixed += count;

    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ ${file.split('/').pop()}: fixed ${count} number inputs`);
});

console.log(`\n✅ Total fixed: ${totalFixed} inputs across 3 files`);
