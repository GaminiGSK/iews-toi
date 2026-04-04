const mongoose = require('mongoose');
require('dotenv').config();
const BankFile = require('./models/BankFile');
const BankStatement = require('./models/BankStatement');

async function fixAll() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // Find in BankStatement
        const stmts = await BankStatement.find();
        let sCount = 0;
        for (let s of stmts) {
            let mod = false;
            s.transactions.forEach((tx,i) => {
                if (tx.moneyIn == 400200 || tx.moneyIn === '400,200.00' || String(tx.moneyIn).includes('400200')) {
                    tx.moneyIn = 100.00;
                    if(i>0) tx.balance = s.transactions[i-1].balance + 100;
                    else tx.balance = 100.00;
                    mod = true;
                    console.log('Fixed in BankStatement:', s._id);
                }
            });
            if(mod) { await s.save(); sCount++; }
        }
        
        // Find in BankFile (if it stores transactions?) Wait, BankFile DOES NOT store transactions array in schema! Let's check?
        // Actually BankFile might not store transactions, it only stores metadata.
        // Let's also check Transaction collection!
        const Transaction = require('./models/Transaction');
        const txs = await Transaction.find({ amount: 400200 });
        let tCount = 0;
        for (let tx of txs) {
            console.log('Fixed in GeneralLedger TX:', tx._id);
            tx.amount = 100.00;
            tx.originalData.moneyIn = 100.00;
            await tx.save();
            tCount++;
        }
        
        console.log(`Done. Saved ${sCount} BankStatements and ${tCount} GL Transactions.`);
    } catch(e) { console.error(e) }
    finally { mongoose.disconnect(); }
}
fixAll();
