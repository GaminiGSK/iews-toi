const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Transaction = require('../models/Transaction');

async function purge() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Purging mock data...');

        // Pattern: Contains "- 12", "- 9", etc. and is generic
        const patterns = [
            /Staff Salaries - \d+/,
            /Office Rent - \d+/,
            /Monthly Revenue - \d+/,
            /Inventory Purchase - \d+/
        ];

        const result = await Transaction.deleteMany({
            $or: patterns.map(p => ({ description: { $regex: p } }))
        });

        console.log(`Deleted ${result.deletedCount} mock transactions.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
purge();
