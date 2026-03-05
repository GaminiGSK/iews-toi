const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Transaction = require('../models/Transaction');

async function cleanDuplicateTransactions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Fetch all transactions, sorted by date so we keep the first one
        const transactions = await Transaction.find({}).sort({ date: 1, createdAt: 1 });
        console.log(`Total transactions found: ${transactions.length}`);

        let deletedCount = 0;
        const seenFingerprints = new Set();

        for (const txn of transactions) {
            // Generate a precise fingerprint for each transaction to avoid false positives
            const dateStr = txn.date ? new Date(txn.date).toISOString().split('T')[0] : 'nodate';
            const amount = txn.amount ? txn.amount.toFixed(2) : '0.00';
            const balance = txn.balance ? txn.balance.toFixed(2) : '0.00';

            // Clean up the description a little bit to normalize it
            const desc = (txn.description || '').trim();

            const fingerprint = `${txn.user.toString()}_${txn.companyCode}_${dateStr}_${amount}_${balance}_${desc}`;

            if (seenFingerprints.has(fingerprint)) {
                console.log(`Deleting duplicate: ${dateStr} | ${amount} | ${balance} | ${desc.substring(0, 40)}...`);
                await Transaction.findByIdAndDelete(txn._id);
                deletedCount++;
            } else {
                seenFingerprints.add(fingerprint);
            }
        }

        console.log(`\nCleanup complete! Removed ${deletedCount} duplicate transactions.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error("Error during duplicate cleanup:", err);
        process.exit(1);
    }
}

cleanDuplicateTransactions();
