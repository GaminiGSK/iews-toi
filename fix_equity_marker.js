const fs = require('fs');
let content = fs.readFileSync('server/routes/company.js', 'utf8');

// Find the start and end of the block to replace
const startMarker = '        // Closing = sum of all CR-DR transactions for this year on equity accounts';
const endMarker = `            : parseFloat(p.registeredCapital || p.shareCapital || 0);`;

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx) + endMarker.length;

if (startIdx < 0 || endIdx < endMarker.length) {
    console.error('Could not find block! startIdx:', startIdx, 'endIdx:', endIdx);
    process.exit(1);
}

console.log('Found block from', startIdx, 'to', endIdx);
console.log('Block content:');
console.log(content.substring(startIdx, endIdx));

const replacement = `        // Closing = fetch ALL-TIME journal entries to find share capital (recorded at incorporation)
        // Account 30100 was credited when company was incorporated (2021), not in 2025
        const equityCodeIds = new Set(equityAccCodes.map(c => c._id.toString()));
        let equityCrAll = 0, equityDrAll = 0;
        const jesAllTime = await JournalEntry.find({ companyCode }).populate('lines.accountCode').lean();
        const txnsAllTime = await Transaction.find({ companyCode }).populate('accountCode').lean();
        for (const tx of txnsAllTime) {
            if (!equityCodeIds.has(tx.accountCode?._id?.toString())) continue;
            if (tx.amount > 0) equityDrAll += Math.abs(tx.amount);
            else               equityCrAll += Math.abs(tx.amount);
        }
        for (const je of jesAllTime) {
            for (const ln of je.lines) {
                if (!equityCodeIds.has(ln.accountCode?._id?.toString())) continue;
                equityDrAll += ln.debit || 0;
                equityCrAll += ln.credit || 0;
            }
        }
        // shareCapitalFinal = all-time equity credits = closing balance
        const shareCapitalFinal = equityCrAll > 0
            ? equityCrAll
            : shareCapitalOpeningFinal > 0 ? shareCapitalOpeningFinal
            : equityGL > 0 ? equityGL
            : parseFloat(p.registeredCapital || p.shareCapital || 0);`;

const fixed = content.substring(0, startIdx) + replacement + content.substring(endIdx);
fs.writeFileSync('server/routes/company.js', fixed, 'utf8');
console.log('\nReplaced! Lines saved.');
