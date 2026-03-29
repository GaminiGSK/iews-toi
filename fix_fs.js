const fs = require('fs');
let text = fs.readFileSync('client/src/pages/FinancialStatements.jsx', 'utf8');

const replacements = [
    [/ហិរញ្ញវត្ថ\?/g, 'ហិរញ្ញវត្ថុ'],
    [/ចំណូ\?/g, 'ចំណូល'],
    [/ថ្លៃដើមលក\?/g, 'ថ្លៃដើមលក់'],
    [/ប្រាក់ចំណេញដុ\?/g, 'ប្រាក់ចំណេញដុល'],
    [/សម្រាប់ឆ្នា\?/g, 'សម្រាប់ឆ្នាំ'],
    [/ទ្រព្យសកម្\?/g, 'ទ្រព្យសកម្ម'],
    [/មូលធ\?និ\?បំណុ\?/g, 'មូលធននិងបំណុល'],
    [/មូលធ\?/g, 'មូលធន'],
    [/បំណុ\?/g, 'បំណុល'],
    [/ប្រាក\?/g, 'ប្រាក់'],
    [/បង\?/g, 'បង់'],
    [/ពន្\?/g, 'ពន្ធ'],
    [/វិនិយោ\?/g, 'វិនិយោគ']
];

let count = 0;
for (const [pattern, replacement] of replacements) {
    const matches = text.match(pattern);
    if (matches) {
        count += matches.length;
        text = text.replace(pattern, replacement);
    }
}

fs.writeFileSync('client/src/pages/FinancialStatements.jsx', text, 'utf8');
console.log('Replaced', count, 'instances!');
