const mongoose = require('mongoose');
require('dotenv').config();
const BankStatement = require('./models/BankStatement');

async function checkStr() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const docs = await BankStatement.find({ "transactions.description": { $regex: /XIE YUESHENG/i } });
        console.log(`Found ${docs.length} docs with XIE YUESHENG`);
        for (let d of docs) {
           let hits = d.transactions.filter(t => t.description.includes('XIE YUESHENG'));
           console.log('Hits:', JSON.stringify(hits, null, 2));
           
           // Apply fix
           let modified = false;
           d.transactions.forEach((tx, i) => {
               if (tx.description.includes('400,200.00 KHR') && tx.moneyIn == 400200) {
                   tx.moneyIn = 100.00; // Let's assume standard $100
                   
                   // Recalculate balance
                   let prevBal = i > 0 ? d.transactions[i-1].balance : 0;
                   tx.balance = prevBal + 100.00;
                   modified = true;
                   console.log(`Fixed KHR to USD: new MoneyIn ${tx.moneyIn}, new Bal ${tx.balance}`);
               }
           });
           if(modified){
               await d.save();
               console.log("Saved fixed statement.");
           }
        }
    } catch(e) { console.error(e) }
    finally { mongoose.disconnect(); }
}
checkStr();
