const fs = require('fs');
let code = fs.readFileSync('client/src/pages/FinancialStatements.jsx', 'utf8');

const replacements = {
    'ហិរញ្ញវត្ថ\ufffd': 'ហិរញ្ញវត្ថុ',
    'ចំណូ\ufffd': 'ចំណូល',
    'លក\ufffd': 'លក់',
    'ចំណេញដុ\ufffd': 'ចំណេញដុល',
    'សម្រាប់ឆ្នា\ufffd': 'សម្រាប់ឆ្នាំ',
    'ទ្រព្យសកម្\ufffd': 'ទ្រព្យសកម្ម',
    'មូលធ\ufffdនិ\ufffdបំណុ\ufffd': 'មូលធននិងបំណុល',
    'មូលធ\ufffd': 'មូលធន',
    'បំណុ\ufffd': 'បំណុល',
    'ប្រាក\ufffd': 'ប្រាក់',
    'បង\ufffd': 'បង់',
    'ពន្\ufffd': 'ពន្ធ',
    'វិនិយោ\ufffd': 'វិនិយោគ',
    'បច្ចុប្បន្\ufffd': 'បច្ចុប្បន្ន',
    'សរុ\ufffd': 'សរុប'
};

let count = 0;
Object.entries(replacements).forEach(([bad, good]) => {
    // Escape for regex or just use split/join
    const parts = code.split(bad);
    if (parts.length > 1) {
        count += parts.length - 1;
        code = parts.join(good);
    }
});

fs.writeFileSync('client/src/pages/FinancialStatements.jsx', code, 'utf8');
console.log(`Replaced ${count} corrupted Khmer strings!`);
