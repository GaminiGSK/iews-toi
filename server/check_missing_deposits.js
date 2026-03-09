require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    // Check missing deposits around 13042.35 total
    const txs = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    console.log(`Total transactions in ledger: ${txs.length}`);
    let moneyIn = 0;
    for (const t of txs) {
        if (t.amount > 0) moneyIn += t.amount;
    }
    console.log(`Total Money In Ledger: ${moneyIn}`);

    const statementTxs = await db.collection('bankstatements').find({ companyCode: 'GK_SMART_AI' }).toArray();
    console.log(`Total Bank Statement pages: ${statementTxs.length}`);
    let bankMoneyIn = 0;
    for (const st of statementTxs) {
        if (st.transactions) {
            for (const t of st.transactions) {
                if (t.deposit > 0) {
                    bankMoneyIn += t.deposit;
                    if (t.deposit > 1000) {
                        console.log(`Found large bank deposit: ${t.date} | ${t.description} | ${t.deposit}`);
                    }
                }
            }
        }
    }
    console.log(`Bank Total Money In: ${bankMoneyIn}`);
    process.exit(0);
});
