require('dotenv').config({path: '../.env'});
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const T = require('../models/Transaction');
    const C = require('../models/AccountCode');
    
    // Check ghost income
    const ghostIncome = await T.find({
        companyCode: 'GK_SMART_AI', 
        amount: { $gt: 0 },
        date: { $gte: new Date('2025-01-01') }
    }).sort({amount: -1}).limit(10);
    
    console.log("Largest 2025 Incomes:");
    ghostIncome.forEach(t => console.log(t.date, t.amount, t.description.substring(0, 50)));

    // Misclassified equity
    const code30100 = await C.findOne({code: '30100', companyCode: 'GK_SMART_AI'});
    if(code30100) {
        const txs30100 = await T.find({accountCode: code30100._id});
        console.log("\nMisclassified Equity search:");
        txs30100.forEach(t => {
            if (t.description.toUpperCase().includes('CEYLEK') || t.description.toUpperCase().includes('CHECK') || t.amount === 1510 || t.amount === 5300 || t.amount === 1490.16) {
                console.log(t.date, t.amount, t.description.substring(0, 50));
            }
        });
    }

    process.exit(0);
}

run();
