const fs = require('fs');
let content = fs.readFileSync('server/routes/company.js', 'utf8');

// Fix line 2898: "const shareCapitalOpeningFinal = shareCapitalOpeningFinal > 0 ? shareCapitalOpeningFinal : shareCapitalFinal;"
// Should be: "const shareCapitalOpeningFinal = shareCapitalOpening > 0 ? shareCapitalOpening : shareCapitalFinal;"
// Where shareCapitalOpening = the computed opening from equityAccCodes.reduce(...)
// Let's find the bad line and fix it
content = content.replace(
    /const shareCapitalOpeningFinal = shareCapitalOpeningFinal > 0 \? shareCapitalOpeningFinal : shareCapitalFinal;/,
    'const shareCapitalOpeningFinal = shareCapitalOpening > 0 ? shareCapitalOpening : shareCapitalFinal;'
);

// Also check the declaration of shareCapitalOpening is still there
if (content.includes('const shareCapitalOpening = equityAccCodes.reduce(')) {
    console.log('shareCapitalOpening declaration found - OK');
} else {
    console.log('WARNING: shareCapitalOpening declaration missing!');
    // Search for it
    const lines = content.split('\n');
    lines.forEach((l, i) => {
        if (l.includes('shareCapitalOpening') && l.includes('reduce')) {
            console.log(`  Found at line ${i+1}:`, l.trim());
        }
    });
}

fs.writeFileSync('server/routes/company.js', content, 'utf8');
console.log('Saved!');
