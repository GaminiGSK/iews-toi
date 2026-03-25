const fs = require('fs');
const path = 'e:/Antigravity/TOI/server/routes/company.js';

let content = fs.readFileSync(path, 'utf8');

// Fix the corrupted Khmer company name on line ~173
// The correct Khmer text is: ជីខេ ស្អាត
content = content.replace(
    /profileInDb\.companyNameKh = ".*?";/g,
    'profileInDb.companyNameKh = "ជីខេ ស្អាត";'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed! Verifying line 173:');
const lines = content.split('\n');
console.log(lines[172]);
