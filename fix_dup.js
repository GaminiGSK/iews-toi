const fs = require('fs');
let content = fs.readFileSync('server/routes/company.js', 'utf8');
const lines = content.split('\n');

// Remove the duplicate declaration on line 2898 (index 2897)
// It reads: "        const shareCapitalOpeningFinal = shareCapitalOpening > 0 ? shareCapitalOpening : shareCapitalFinal;"
if (lines[2897] && lines[2897].includes('const shareCapitalOpeningFinal = shareCapital')) {
    console.log('Removing duplicate line 2898:', lines[2897]);
    lines.splice(2897, 1);
} else {
    console.log('Line 2898:', lines[2897]);
    console.log('Searching for duplicate...');
    for (let i = 2895; i < 2905; i++) {
        if (lines[i] && lines[i].includes('shareCapitalOpeningFinal') && lines[i].includes('const ')) {
            console.log(`Found at line ${i+1}:`, lines[i]);
        }
    }
}

fs.writeFileSync('server/routes/company.js', lines.join('\n'), 'utf8');
console.log('Saved!');
