const fs = require('fs');
let code = fs.readFileSync('client/src/pages/FinancialStatements.jsx', 'utf8');

const regexes = [
    { target: /ចំណា\uFFFD\?br\/>/g, replacement: 'ចំណាំ<br/>' },
    { target: /ចំណូ\uFFFD\?/g, replacement: 'ចំណូល' },
    { target: /ចំណូល\?/g, replacement: 'ចំណូល' },
    { target: /ថ្លៃដើមលក\uFFFD\?/g, replacement: 'ថ្លៃដើមលក់' },
    { target: /ថ្លៃដើមលក់\?/g, replacement: 'ថ្លៃដើមលក់' },
    { target: /ប្រាក់ចំណេញដុ\uFFFD\?/g, replacement: 'ប្រាក់ចំណេញដុល' },
    { target: /ប្រាក់ចំណេញដុល\?/g, replacement: 'ប្រាក់ចំណេញដុល' },
    { target: /សម្រាប់ឆ្នា\uFFFD\?/g, replacement: 'សម្រាប់ឆ្នាំ' },
    { target: /សម្រាប់ឆ្នាំ\?/g, replacement: 'សម្រាប់ឆ្នាំ' },
    { target: /ទ្រព្យសកម្\uFFFD\?/g, replacement: 'ទ្រព្យសកម្ម' },
    { target: /ទ្រព្យសកម្ម\?/g, replacement: 'ទ្រព្យសកម្ម' },
    { target: /មូលធ\uFFFD\?និ\uFFFD\?បំណុ\uFFFD\?/g, replacement: 'មូលធននិងបំណុល' },
    { target: /មូលធន\?និ\?បំណុល\?/g, replacement: 'មូលធននិងបំណុល' },
    { target: /មូលធ\uFFFD\?/g, replacement: 'មូលធន' },
    { target: /មូលធន\?/g, replacement: 'មូលធន' },
    { target: /បំណុ\uFFFD\?/g, replacement: 'បំណុល' },
    { target: /បំណុល\?/g, replacement: 'បំណុល' },
    { target: /សរុ\uFFFD\?/g, replacement: 'សរុប' },
    { target: /សរុប\?/g, replacement: 'សរុប' },
    { target: /ប្រាក\uFFFD\?/g, replacement: 'ប្រាក់' },
    { target: /ប្រាក់\?/g, replacement: 'ប្រាក់' },
    { target: /ពន្\uFFFD\?/g, replacement: 'ពន្ធ' },
    { target: /ពន្ធ\?/g, replacement: 'ពន្ធ' },
    { target: /បង\uFFFD\?/g, replacement: 'បង់' },
    { target: /បង់\?/g, replacement: 'បង់' },
    { target: /វិនិយោ\uFFFD\?/g, replacement: 'វិនិយោគ' },
    { target: /វិនិយោគ\?/g, replacement: 'វិនិយោគ' },
    { target: /បច្ចុប្បន្\uFFFD\?/g, replacement: 'បច្ចុប្បន្ន' },
    { target: /បច្ចុប្បន្ន\?/g, replacement: 'បច្ចុប្បន្ន' },
    { target: /ហិរញ្ញវត្ថ\uFFFD\?/g, replacement: 'ហិរញ្ញវត្ថុ' },
    { target: /ហិរញ្ញវត្ថុ\?/g, replacement: 'ហិរញ្ញវត្ថុ' },
    // A catch all for NOTE header
    { target: /ចំណា\u{FFFD}\?br\/>/gu, replacement: 'ចំណាំ<br/>' },
];

let replaced = 0;
regexes.forEach(fix => {
    code = code.replace(fix.target, function() {
        replaced++;
        return fix.replacement;
    });
});

fs.writeFileSync('client/src/pages/FinancialStatements.jsx', code, 'utf8');
console.log(`Replaced ${replaced} lingering Khmer string pieces!`);
