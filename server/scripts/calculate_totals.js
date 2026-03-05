require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

async function calculateTotals() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const gksmartUser = await User.findOne({ username: 'GKSMART' });
        if (!gksmartUser) {
            console.log("GKSMART user not found.");
            process.exit();
        }

        const transactions = await Transaction.find({ user: gksmartUser._id }).sort({ date: 1, sequence: 1 });

        const totalCount = transactions.length;
        let totalIn = 0;
        let totalOut = 0;

        // Find latest balance and date
        let finalBalance = 0;
        let lastDate = null;

        // Let's also find the account name from original data if available
        let accountName = "Unknown Account";
        let accountFound = false;

        transactions.forEach(txn => {
            if (txn.amount > 0) {
                totalIn += txn.amount;
            } else if (txn.amount < 0) {
                totalOut += Math.abs(txn.amount);
            }

            if (txn.balance !== undefined && txn.balance !== null) {
                finalBalance = txn.balance;
                lastDate = txn.date;
            }

            if (!accountFound && txn.originalData && txn.originalData.accountName) {
                accountName = txn.originalData.accountName;
                accountFound = true;
            }
        });

        console.log(`=== BANK STATEMENT SUMMARY ===`);
        console.log(`Account Name Target: ${accountName}`);
        console.log(`Total Transactions: ${totalCount}`);
        console.log(`Total Money In (+): $${totalIn.toFixed(2)}`);
        console.log(`Total Money Out (-): $${totalOut.toFixed(2)}`);

        if (transactions.length > 0) {
            const latestTxn = transactions[transactions.length - 1];
            console.log(`\nLatest Transaction Details:`);
            console.log(`Date: ${new Date(latestTxn.date).toISOString().split('T')[0]}`);
            console.log(`Final Known Running Balance: $${latestTxn.balance ? latestTxn.balance.toFixed(2) : 'N/A'}`);
        } else {
            console.log(`\nNo transactions found in the database.`);
        }

    } catch (err) {
        console.error("Error calculating:", err);
    } finally {
        mongoose.disconnect();
    }
}

calculateTotals();
