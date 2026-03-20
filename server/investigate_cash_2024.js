const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const allAccs = await db.collection('accountcodes').find({ 
        companyCode: 'GK_SMART_AI',
        name: { $regex: 'CASH', $options: 'i' }
    }).toArray();
    
    console.log("All Accounts containing CASH:");
    allAccs.forEach(a => console.log(a.code, a.name));

    const checkAccs = await db.collection('accountcodes').find({ 
        companyCode: 'GK_SMART_AI',
        code: { $in: ['10110', '10120', '10130', '10140'] }
    }).toArray();
    
    console.log("\nSpecific Account Codes:");
    checkAccs.forEach(a => console.log(a.code, a.name));

    // Get all transactions for these accounts in 2024
    for (let acc of [...allAccs, ...checkAccs]) {
        const txs = await db.collection('transactions').find({
            companyCode: 'GK_SMART_AI',
            code: acc.code,
            date: { $gte: new Date('2024-01-01'), $lt: new Date('2025-01-01') }
        }).toArray();

        let totalDr = 0;
        let totalCr = 0;
        let mTx = Array(12).fill(0);
        
        txs.forEach(t => {
            totalDr += (t.moneyIn || 0);
            totalCr += (t.moneyOut || 0);
            const m = t.date.getMonth();
            mTx[m] += (t.moneyIn || 0) - (t.moneyOut || 0);
        });

        console.log(`\n--- Transactions for ${acc.code} ${acc.name} in 2024 ---`);
        console.log(`Total TX Count: ${txs.length}`);
        
        if (txs.length > 0) {
            console.log(`Total Money In (Dr): ${totalDr}`);
            console.log(`Total Money Out (Cr): ${totalCr}`);
            console.log(`Net Change for 2024: ${totalDr - totalCr}`);
            console.log("Monthly Net:");
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            mTx.forEach((val, i) => console.log(`${monthNames[i]}: ${val}`));
        }
    }

    process.exit(0);
});
