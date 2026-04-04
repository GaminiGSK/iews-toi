const mongoose = require('mongoose');
require('dotenv').config();
const BankStatement = require('./models/BankStatement');

async function fixTransactions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find the statement matching 015 821 078
        const statements = await BankStatement.find({ 'transactions.moneyIn': { $gt: 400000 } });
        console.log(`Found ${statements.length} statements with extreme values.`);

        for (const stmt of statements) {
            let modified = false;
            let currentBalance = 0;
            
            for (let i = 0; i < stmt.transactions.length; i++) {
                const tx = stmt.transactions[i];
                if (tx.moneyIn > 100000) {
                    console.log(`Found large transaction: ${tx.moneyIn} on ${tx.date}`);
                    console.log(`Description: ${tx.description}`);
                    
                    // Convert KHR to USD
                    const realAmount = parseFloat((tx.moneyIn / 4000).toFixed(2));
                    console.log(`Converting ${tx.moneyIn} to ${realAmount} USD`);
                    
                    // Attempt to adjust the balance
                    tx.moneyIn = realAmount;
                    
                    // If balance is exactly the KHR amount, it was hallucinated too
                    if (tx.balance > 100000) {
                        currentBalance += realAmount;
                        tx.balance = parseFloat(currentBalance.toFixed(2));
                        console.log(`New Balance set to: ${tx.balance}`);
                    } else if (i > 0) {
                        tx.balance = stmt.transactions[i-1].balance + realAmount;
                        currentBalance = tx.balance;
                        console.log(`New Balance recalculated: ${tx.balance}`);
                    }
                    stmt.transactions[i] = tx;
                    modified = true;
                } else {
                     currentBalance = tx.balance || (currentBalance + (tx.moneyIn||0) - (tx.moneyOut||0));
                }
            }
            if (modified) {
                await stmt.save();
                console.log(`Successfully fixed statement ${stmt._id}.`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
fixTransactions();
