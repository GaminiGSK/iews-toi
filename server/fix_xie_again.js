const mongoose = require('mongoose');
require('dotenv').config();
const BankStatement = require('./models/BankStatement');
const Transaction = require('./models/Transaction');

async function findIt() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const stmts = await BankStatement.find({ "transactions.description": { $regex: /XIE YUESHENG/i } });
        console.log(`Found ${stmts.length} BankStatements with XIE YUESHENG`);
        for (let s of stmts) {
            let modified = false;
            s.transactions.forEach((tx,i) => {
                if (tx.description.includes('XIE YUESHENG') && tx.description.includes('400,200.00 KHR')) {
                   tx.moneyIn = 100.00;
                   if (i>0) tx.balance = s.transactions[i-1].balance + 100.00;
                   if (!tx.balance) tx.balance = 400.00; // rough fix
                   modified = true;
                }
            });
            if (modified) await s.save();
        }

        const txs = await Transaction.find({ description: { $regex: /XIE YUESHENG/i } });
        console.log(`Found ${txs.length} GL Transactions with XIE YUESHENG`);
    } catch(e) { console.error(e) }
    finally { mongoose.disconnect(); }
}
findIt();
