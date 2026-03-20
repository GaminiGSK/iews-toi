const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    // Find the account code for 30100
    const ownerEquityAcc = await db.collection('accountcodes').findOne({ code: '30100', companyCode: 'GK_SMART_AI' });
    if (!ownerEquityAcc) {
        console.log("No 30100 account found!");
        process.exit(1);
    }

    // Find all 2025 transactions for GUNASINGHA
    const targetTxs = await db.collection('transactions').find({
        date: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') },
        description: { $regex: 'GUNASINGHA|GK BACK UP|Owner capital', $options: 'i' }
    }).toArray();

    console.log(`Found ${targetTxs.length} transactions to update.`);

    for (let tx of targetTxs) {
        // Only update if it's Money Out or a transfer to him that was miscategorized
        if (tx.moneyOut > 0) {
            console.log(`Updating ${tx.date.toISOString().substring(0, 10)} | ${tx.amount} | Old Code: ${tx.code} -> New Code: 30100`);
            await db.collection('transactions').updateOne(
                { _id: tx._id },
                { $set: { code: '30100', accountCode: ownerEquityAcc._id } }
            );
        }
    }

    // What about "Registration"?
    const regTxs = await db.collection('transactions').find({
        date: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') },
        description: { $regex: 'Registration', $options: 'i' },
        code: { $ne: '30100' }
    }).toArray();

    console.log(`Found ${regTxs.length} Registration transactions.`);
    for(let tx of regTxs) {
       console.log(`Reg TX: ${tx.date.toISOString().substring(0, 10)} | ${tx.amount} | Code: ${tx.code} | Desc: ${tx.description}`);
       if (tx.description.toLowerCase().includes('gunasingha')) {
           console.log(" -> Will update to 30100");
           await db.collection('transactions').updateOne(
                { _id: tx._id },
                { $set: { code: '30100', accountCode: ownerEquityAcc._id } }
            );
       }
    }

    console.log("Done.");
    process.exit(0);
});
