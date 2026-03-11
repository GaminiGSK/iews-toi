const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Transaction = require('../models/Transaction');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const txs = await Transaction.find({ companyCode: 'GK_SMART_AI' }).lean();
    
    let totalIn = 0;
    let totalOut = 0;
    
    txs.forEach(tx => {
       const amount = Number(String(tx.amount).replace(/[^0-9.-]+/g, ''));
       if (amount > 0) totalIn += amount;
       else totalOut += Math.abs(amount);
    });

    console.log(`TOTAL MONEY IN: ${totalIn}`);
    console.log(`TOTAL MONEY OUT: ${totalOut}`);
    
    // Sort logic
    const txsIn = txs.filter(t => Number(String(t.amount).replace(/[^0-9.-]+/g, '')) > 0).sort((a,b) => Number(String(b.amount).replace(/[^0-9.-]+/g, '')) - Number(String(a.amount).replace(/[^0-9.-]+/g, '')));
    const txsOut = txs.filter(t => Number(String(t.amount).replace(/[^0-9.-]+/g, '')) <= 0).sort((a,b) => Math.abs(Number(String(b.amount).replace(/[^0-9.-]+/g, ''))) - Math.abs(Number(String(a.amount).replace(/[^0-9.-]+/g, ''))));
    
    console.log('\n--- TOP 10 MONEY IN ---');
    txsIn.slice(0, 10).forEach(t => console.log(`${t.date ? t.date.toISOString().substring(0,10) : 'No Date'} | Amount: ${t.amount} | Desc: ${t.description ? t.description.substring(0, 50) : ''}... | Acc: ${t.accountCode}`));
    
    console.log('\n--- TOP 10 MONEY OUT ---');
    txsOut.slice(0, 10).forEach(t => console.log(`${t.date ? t.date.toISOString().substring(0,10) : 'No Date'} | Amount: ${t.amount} | Desc: ${t.description ? t.description.substring(0, 50) : ''}... | Acc: ${t.accountCode}`));

    process.exit(0);
}
run();
