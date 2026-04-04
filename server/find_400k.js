const mongoose = require('mongoose');
require('dotenv').config();
const BankStatement = require('./models/BankStatement');

async function findRaw() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const docs = await BankStatement.find();
        let found = false;
        for (let d of docs) {
            d.transactions.forEach(tx => {
                let desc = tx.description || "";
                if (desc.includes('400,200') || tx.moneyIn == 400200 || tx.moneyIn === '400,200.00' || tx.moneyIn === '400200.00' || tx.moneyIn === '400200') {
                    console.log('FOUND DOC:', d._id, '| TX:', JSON.stringify(tx));
                    found = true;
                }
            });
        }
        if(!found) console.log("Did not find any 400,200 text in BankStatements.");
    } catch(e) { console.error(e) }
    finally { mongoose.disconnect(); }
}
findRaw();
