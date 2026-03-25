const fs = require('fs');
const content = fs.readFileSync('server/routes/company.js', 'utf8');
const lines = content.split('\n');

// Find the problematic line
for (let i = 165; i < 185; i++) {
    if (lines[i] && lines[i].includes('companyNameKh')) {
        console.log(`Line ${i+1}:`);
        const bytes = Buffer.from(lines[i], 'utf8');
        console.log('  Hex:', bytes.toString('hex'));
        console.log('  Length:', bytes.length);
        
        // Fix it
        lines[i] = '                    profileInDb.companyNameKh = "\u1787\u17B8\u1781\u17C1 \u179F\u17D2\u17A2\u17B6\u178F";';
        console.log('  Fixed to:', Buffer.from(lines[i]).toString('hex').substring(50, 80));
    }
}

fs.writeFileSync('server/routes/company.js', lines.join('\n'), 'utf8');
console.log('Saved!');

// Verify syntax
try {
    require('vm').Script(require('fs').readFileSync('server/routes/company.js', 'utf8'));
    console.log('Syntax OK');
} catch(e) {
    console.log('Syntax error at:', e.message);
}
