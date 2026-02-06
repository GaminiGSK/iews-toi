const fs = require('fs');
const path = require('path');

const filesToFix = [
    'client/src/pages/LiveTaxWorkspace.jsx',
    'client/src/pages/AdminDashboard.jsx',
    'client/src/components/DynamicForm.jsx',
    'client/src/pages/ToiAcar.jsx'
];

// Correct Khmer Strings
const strings = {
    title: "លិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ",
    taxPeriod: "សម្រាប់កាលបរិច្ឆេទ (ខែ)",
    from: "ពីថ្ងៃទី",
    until: "រហូតដល់ថ្ងៃទី",
    generalDept: "អគ្គនាយកដ្ឋានពន្ធដារ",
    kingdom: "ព្រះរាជាណាចក្រកម្ពុជា",
    nation: "ជាតិ សាសនា ព្រះមហាក្សត្រ",
    formToi01: "ទម្រង់ ល.ព.ច ០១ / FORM TOI 01",
    info: "ព័ត៌មាន"
};

filesToFix.forEach(relPath => {
    const fullPath = path.resolve(__dirname, relPath);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${relPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Fix the "title" string corruption specifically
    content = content.replace(/title:\s*"釣涐灧[^"]*釤\?,/g, `title: "${strings.title}",`);
    content = content.replace(/title:\s*"釣涐灧[^"]*釤\?"/g, `title: "${strings.title}"`);

    // 2. Fix "labelKh" or other Khmer labels
    // Tax Period
    content = content.replace(/labelKh:\s*"釣熱灅釤掅灇[^"]*?",/g, `labelKh: "${strings.taxPeriod}",`);
    content = content.replace(/"釣€釣夺灇釣斸灇[^"]*?"/g, `"${strings.taxPeriod}"`);

    // From / Until
    content = content.replace(/"釣栣灨釣愥煉釣勧焹釣戓灨"/g, `"${strings.from}"`);
    content = content.replace(/"釣氠灎釣坚瀼釣娽灈釤嬦瀽釤掅瀯釤冡瀾釣\?"/g, `"${strings.until}"`);
    content = content.replace(/"釣娽灈釤嬦瀽釤掅瀯釤冡瀾釣\?"/g, `"${strings.until}"`);

    // General Department of Taxation
    content = content.replace(/"釣⑨瀭釤掅瀭[^"]*?"/g, `"${strings.generalDept}"`);

    // Kingdom of Cambodia
    content = content.replace(/"釣€釤掅灇釣熱灲[^"]*?"/g, `"${strings.kingdom}"`);

    // Form TOI 01
    content = content.replace(/"釣戓灅釤掅灇[^"]*?"/g, `"${strings.formToi01}"`);

    // Catch-all for any quoted string starting with 釣 or 釤 and having a ? or other corruption marks
    // We replace them with a generic but safe "ព័ត៌មាន" (Information) to prevent syntax errors
    content = content.replace(/"[釣釤][^"]*釤\?"/g, `"${strings.info}"`);
    content = content.replace(/"[釣釤][^"]*釤\?,/g, `"${strings.info}",`);

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed ${relPath}`);
});
