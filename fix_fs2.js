const fs = require('fs');
let code = fs.readFileSync('client/src/pages/FinancialStatements.jsx', 'utf8');

const fixes = [
    { target: /ចំណា\?[^\<]*br\/>/g, replacement: 'ចំណាំ<br/>' },
    { target: /ចំណូ\?\//g, replacement: 'ចំណូល /' },
    { target: /ថ្លៃដើមលក\?\//g, replacement: 'ថ្លៃដើមលក់ /' },
    { target: /ដុ\?\//g, replacement: 'ដុល /' },
    { target: /សម្រាប់ឆ្នា\?\//g, replacement: 'សម្រាប់ឆ្នាំ /' },
    { target: /ហិរញ្ញវត្ថ\?\//g, replacement: 'ហិរញ្ញវត្ថុ /' },
    { target: /ទ្រព្យសកម្\?\//g, replacement: 'ទ្រព្យសកម្ម /' },
    { target: /ទ្រព្យសកម្មសរុ\?\//g, replacement: 'ទ្រព្យសកម្មសរុប /' },
    { target: /មូលធ\?និ\?បំណុ\?\//g, replacement: 'មូលធននិងបំណុល /' },
    { target: /មូលធ\?\//g, replacement: 'មូលធន /' },
    { target: /បំណុ\?\//g, replacement: 'បំណុល /' },
    { target: /ប្រាក\?\//g, replacement: 'ប្រាក់ /' },
    { target: /ពន្\?\//g, replacement: 'ពន្ធ /' },
    { target: /បង\?\//g, replacement: 'បង់ /' },
    { target: /វិនិយោ\?\//g, replacement: 'វិនិយោគ /' },
    { target: /បច្ចុប្បន្\?\//g, replacement: 'បច្ចុប្បន្ន /' },
    { target: /សរុ\?\//g, replacement: 'សរុប /' },
];

let replaced = 0;
fixes.forEach(fix => {
    const preCount = code.length;
    code = code.replace(fix.target, function(match) {
        replaced++;
        return fix.replacement;
    });
});

fs.writeFileSync('client/src/pages/FinancialStatements.jsx', code, 'utf8');
console.log(`Replaced ${replaced} corrupted Khmer strings instances in FinancialStatements.jsx`);
