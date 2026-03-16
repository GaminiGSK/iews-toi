const fs = require('fs');
const file = 'client/src/pages/FinancialStatements.jsx';
let content = fs.readFileSync(file, 'utf8');

// Use proper React state classes to force page dimensions if standard interpolations fail
content = content.replace(
    /size:\s*\${viewMode === 'annual'\s*\?\s*'A4 portrait'\s*:\s*'A4 landscape'}\s*!important;/,
    `size: A4 \${viewMode === 'annual' ? 'portrait' : 'landscape'} !important;`
);

fs.writeFileSync(file, content);
console.log('Fixed syntax error in print sizes.');
