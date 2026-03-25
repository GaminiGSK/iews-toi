// Fix: fetch all journal entries (not year-filtered) to compute share capital closing balance
// Account 30100 has priorYearCr: 4950.23 (opening before 2025)
// and was credited in JEs (likely 2021/2022) so the year-filtered JEs don't find it.
// Solution: query ALL JEs for the company (no date filter), summing equity account credits.

const fs = require('fs');
let content = fs.readFileSync('server/routes/company.js', 'utf8');

// Replace the year-filtered approach with an all-time fetch for equity
const oldCode = `        // Closing = sum of all CR-DR transactions for this year on equity accounts
        // (from already-fetched txns + journal entries)
        let equityCrYear = 0, equityDrYear = 0;
        const equityCodeIds = new Set(equityAccCodes.map(c => c._id.toString()));
        for (const tx of txns) {
            if (!equityCodeIds.has(tx.accountCode?._id?.toString())) continue;
            if (tx.amount > 0) equityDrYear += Math.abs(tx.amount);
            else               equityCrYear += Math.abs(tx.amount);
        }
        for (const je of jes) {
            for (const ln of je.lines) {
                if (!equityCodeIds.has(ln.accountCode?._id?.toString())) continue;
                equityDrYear += ln.debit || 0;
                equityCrYear += ln.credit || 0;
            }
        }
        // Closing = opening + this year's net credits
        const shareCapitalFromTxns = Math.max(0, equityCrYear - equityDrYear);
        // Also check if AccountCode itself has priorYearCr as a proxy for current closing
        // (for accounts that store the balance directly, not movements)
        const shareCapitalFinal = shareCapitalFromTxns > 0
            ? shareCapitalOpeningFinal + shareCapitalFromTxns
            : equityGL > 0 ? equityGL
            : parseFloat(p.registeredCapital || p.shareCapital || 0);`;

const newCode = `        // Closing = fetch ALL-TIME journal entries (not year-filtered) for equity accounts
        // Share capital is typically recorded once at incorporation, not every year
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
        // Closing balance = priorYearCr (opening) + all-time net movements
        const shareCapitalFromTxns = Math.max(0, equityCrAll - equityDrAll);
        // Final = all-time total credits (this IS the closing balance if we include prior)
        const shareCapitalFinal = equityCrAll > 0 ? equityCrAll
            : shareCapitalOpeningFinal > 0 ? shareCapitalOpeningFinal
            : equityGL > 0 ? equityGL
            : parseFloat(p.registeredCapital || p.shareCapital || 0);`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    console.log('Replaced successfully!');
} else {
    console.log('Pattern not found, searching...');
    // Try partial match
    const idx = content.indexOf('const equityCodeIds = new Set(equityAccCodes');
    if (idx >= 0) {
        console.log('Found equityCodeIds at char:', idx);
        const chunk = content.substring(idx - 100, idx + 600);
        console.log(chunk);
    }
}

require('fs').writeFileSync('server/routes/company.js', content, 'utf8');
console.log('Saved!');
