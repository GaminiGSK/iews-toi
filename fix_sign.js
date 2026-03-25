const fs = require('fs');
let content = fs.readFileSync('server/routes/company.js', 'utf8');

// The autofill was treating tx.amount > 0 as DEBIT, but TB treats amount > 0 as CREDIT
// Fix: positive amount = CREDIT (money in, liability/equity increases)
const oldTxLoop = `        for (const tx of txnsAllTime) {
            if (!equityCodeIds.has(tx.accountCode?._id?.toString())) continue;
            if (tx.amount > 0) equityDrAll += Math.abs(tx.amount);
            else               equityCrAll += Math.abs(tx.amount);
        }`;

const newTxLoop = `        for (const tx of txnsAllTime) {
            if (!equityCodeIds.has(tx.accountCode?._id?.toString())) continue;
            // Positive amount = money in = Credit (consistent with TB unadjCrUSD)
            if (tx.amount > 0) equityCrAll += Math.abs(tx.amount);
            else               equityDrAll += Math.abs(tx.amount);
        }`;

if (content.includes(oldTxLoop)) {
    content = content.replace(oldTxLoop, newTxLoop);
    console.log('Fixed transaction sign convention!');
} else {
    console.log('Pattern not found for tx loop!');
    // Try to find it manually
    const idx = content.indexOf('equityDrAll += Math.abs(tx.amount)');
    if (idx >= 0) {
        console.log('Found at:', idx);
        console.log('Context:', content.substring(idx - 100, idx + 200));
    }
}

fs.writeFileSync('server/routes/company.js', content, 'utf8');
console.log('Saved!');
