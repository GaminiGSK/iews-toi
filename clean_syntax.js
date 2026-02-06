const fs = require('fs');
const path = require('path');

const filesToFix = [
    'client/src/pages/LiveTaxWorkspace.jsx',
    'client/src/pages/AdminDashboard.jsx',
    'client/src/components/DynamicForm.jsx',
    'client/src/pages/ToiAcar.jsx',
    'client/src/components/SiteGate.jsx'
];

// Core Khmer Strings that we KNOW are right
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
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    // Remove any weird dangling question marks or escape sequences that break syntax
    // This is the most important part to fix the "White Screen"
    content = content.replace(/[釣釤][^"]*釤\?,/g, `"${strings.info}",`);
    content = content.replace(/[釣釤][^"]*釤\?"/g, `"${strings.info}"`);
    content = content.replace(/"釣[^"]*釤[^"]*?"/g, `"${strings.info}"`);

    // Specific field fixes
    content = content.replace(/title:\s*"លិខិត[^"]*?"/g, `title: "${strings.title}"`);
    content = content.replace(/labelKh:\s*"សម្រាប់[^"]*?"/g, `labelKh: "${strings.taxPeriod}"`);

    // Catch any remaining "Chinese-looking" text in strings
    const mojibakeRegex = /["'][^"']*[釣釤][^"']*["']/g;
    content = content.replace(mojibakeRegex, `"${strings.info}"`);

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Cleaned syntax and removed corruption in ${relPath}`);
});
