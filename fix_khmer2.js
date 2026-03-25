const fs = require('fs');
const path = 'server/routes/company.js';
let content = fs.readFileSync(path, 'utf8');

// The Khmer string for "GK SMART" in Khmer:  ជីខេ ស្អាត
// Correct UTF-8 bytes: e1 9e 87 e1 9e b8 e1 9e 81 e1 9f 81 20 e1 9e 9f e1 9f 92 e1 9e a2 e1 9e b6 e1 9e 8f
const correctKhmer = '\u1787\u17B8\u1781\u17C1 \u179F\u17D2\u17A2\u17B6\u178F';

// Find and replace the broken companyNameKh line
const badPattern = /profileInDb\.companyNameKh\s*=\s*"[^"]*";/g;
const replacement = `profileInDb.companyNameKh = "${correctKhmer}";`;

const fixed = content.replace(badPattern, replacement);
if (fixed === content) {
    console.log('WARNING: Pattern not found, trying alternative...');
    // Try finding by line number approach
    const lines = content.split('\n');
    for (let i = 170; i < 180; i++) {
        if (lines[i] && lines[i].includes('companyNameKh')) {
            console.log(`Line ${i+1}: ${Buffer.from(lines[i]).toString('hex').substring(0,60)}`);
            lines[i] = `                    profileInDb.companyNameKh = "${correctKhmer}";`;
        }
    }
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
} else {
    fs.writeFileSync(path, fixed, 'utf8');
    console.log('Fixed successfully!');
}

// Verify
const verify = fs.readFileSync(path, 'utf8');
const verifyLines = verify.split('\n');
console.log('Line 173:', Buffer.from(verifyLines[172]).toString('hex').substring(0, 60));
console.log('Expected Khmer:', Buffer.from(correctKhmer).toString('hex'));
