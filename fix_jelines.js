const fs = require('fs');
let content = fs.readFileSync('server/routes/company.js', 'utf8');

// Fix "je.lines is not iterable" - add safe guard for je.lines
content = content.replace(
    `        for (const je of jesAllTime) {
            for (const ln of je.lines) {
                if (!equityCodeIds.has(ln.accountCode?._id?.toString())) continue;
                equityDrAll += ln.debit || 0;
                equityCrAll += ln.credit || 0;
            }
        }`,
    `        for (const je of jesAllTime) {
            for (const ln of (je.lines || [])) {
                if (!equityCodeIds.has(ln.accountCode?._id?.toString())) continue;
                equityDrAll += ln.debit || 0;
                equityCrAll += ln.credit || 0;
            }
        }`
);

fs.writeFileSync('server/routes/company.js', content, 'utf8');
console.log('Fixed je.lines guard!');
