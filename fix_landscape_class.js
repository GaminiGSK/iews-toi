const fs = require('fs');
const file = 'client/src/pages/FinancialStatements.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /size:\s*A4\s*\$\{viewMode\s*===\s*'annual'\s*\?\s*'portrait'\s*:\s*'landscape'\}\s*!important;\s*margin:\s*10mm;/,
    `size: \${viewMode === 'annual' ? 'A4 portrait !important' : 'A4 landscape !important'}; margin: 10mm;`
);

fs.writeFileSync(file, content);
console.log('Fixed CSS interpolation');
