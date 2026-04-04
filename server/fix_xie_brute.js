const mongoose = require('mongoose');
require('dotenv').config();
const BankStatement = require('./models/BankStatement');
async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const docs = await BankStatement.find({});
    let count = 0;
    for(let d of docs) {
        if(d.transactions) {
            d.transactions.forEach((tx,i) => {
                if(tx.moneyIn == 400200 || tx.moneyIn === '400,200.00' || String(tx.description).includes('XIE YUESHENG')) {
                    tx.moneyIn = 100.00;
                    if(i>0) tx.balance = s.transactions[i-1].balance + 100;
                    else tx.balance = 100.00;
                    count++;
                }
            });
            if(count > 0) await d.save();
        }
    }
    console.log(`Fixed ${count} tx inside BankStatements`);
    process.exit(0);
}
run();
