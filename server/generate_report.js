require('dotenv').config();
const mongoose = require('mongoose');
const BankStatement = require('./models/BankStatement');
const Transaction = require('./models/Transaction');
const JournalEntry = require('./models/JournalEntry');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const companyCode = 'GK_SMART_AI';
    
    const bsCount = await BankStatement.countDocuments({ companyCode });
    const txCount = await Transaction.countDocuments({ companyCode });
    const jeCount = await JournalEntry.countDocuments({ companyCode });
    
    // Detailed analysis
    const allBs = await BankStatement.find({ companyCode }).sort({date: 1});
    const allTx = await Transaction.find({ companyCode }).sort({date: 1});
    const allJe = await JournalEntry.find({ companyCode }).sort({date: 1});
    
    console.log("==========================================");
    console.log("      FINANCIAL RECONCILIATION REPORT     ");
    console.log("==========================================");
    console.log(`Company: ${companyCode}`);
    console.log(`Total Bank Statements Count (Raw Data): ${bsCount}`);
    console.log(`Total GL Transactions Count: ${txCount}`);
    console.log(`Total Journal Entries (Adjustments): ${jeCount}`);
    
    let totalBsIn = 0;
    let totalBsOut = 0;
    allBs.forEach(b => {
        if (b.amount > 0) totalBsIn += b.amount;
        if (b.amount < 0) totalBsOut += b.amount;
    });
    
    let totalTxIn = 0;
    let totalTxOut = 0;
    allTx.forEach(t => {
        const amt = parseFloat(t.amount.toString().replace(/,/g, ''));
        if (amt > 0) totalTxIn += amt;
        if (amt < 0) totalTxOut += amt;
    });
    
    console.log("\n--- MONETARY SUMMARIES (USD) ---");
    console.log(`Bank Statements - Total In: $${totalBsIn.toFixed(2)} | Total Out: $${Math.abs(totalBsOut).toFixed(2)} | Net: $${(totalBsIn + totalBsOut).toFixed(2)}`);
    console.log(`GL Transactions - Total In: $${totalTxIn.toFixed(2)} | Total Out: $${Math.abs(totalTxOut).toFixed(2)} | Net: $${(totalTxIn + totalTxOut).toFixed(2)}`);
    
    const jeTotals = await JournalEntry.aggregate([
        { $match: { companyCode } },
        { $unwind: "$lines" },
        { $group: { _id: null, debit: { $sum: "$lines.debit" }, credit: { $sum: "$lines.credit" } } }
    ]);
    if (jeTotals.length > 0) {
        console.log(`Journal Entries - Total Debit: $${jeTotals[0].debit.toFixed(2)} | Total Credit: $${jeTotals[0].credit.toFixed(2)}`);
    }
    
    process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
