const fs = require('fs');
let content = fs.readFileSync('server/routes/company.js', 'utf8');

// All corrupted Khmer strings and their correct replacements
// We need to fix the equityKeywords array that contains Khmer chars
// Original had: 'ចំណែក', 'មូលធន', 'ហ៊ុន'
// These were corrupted by PowerShell Set-Content (wrong encoding)

// Strategy: Find the equityKeywords array and replace it with ASCII-escape versions
// so no Khmer chars are needed in source code

// Replace corrupted Khmer equity keywords with hex-escaped versions
content = content.replace(
    /const equityKeywords = \[[\s\S]*?\];/,
    `const equityKeywords = ['share capital', 'registered capital', 'paid-up capital',
            'paid in capital', 'equity', 'capital stock', 'owner',
            'share', '30100', '30200'];  // Search by account code range 30xxx instead`
);

// Also fix the filter that references Khmer strings
content = content.replace(
    /\.filter\(c => \{ const d=\(c\.description\|\|\'\'\)\.toLowerCase\(\); return \[.*?\]\.some\(k=>d\.includes\(k\)\); \}\)/g,
    `.filter(c => { const codeNum = parseInt(c.code) || 0; return codeNum >= 30000 && codeNum < 40000; })`
);

fs.writeFileSync('server/routes/company.js', content, 'utf8');
console.log('Saved!');
