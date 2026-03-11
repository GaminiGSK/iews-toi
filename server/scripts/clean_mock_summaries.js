const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Transaction = require('../models/Transaction');

async function cleanMockSummaries() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const descriptionsToRemove = [
            'Total Service Revenue (Jan-Sept 2025)',
            'Owner Capital Injection (Jan-Sept 2025)',
            'Total Operating Expenses (Jan-Sept 2025)'
        ];

        const result = await Transaction.deleteMany({
            companyCode: 'GK_SMART_AI',
            description: { $in: descriptionsToRemove }
        });

        console.log(`Deleted ${result.deletedCount} mockup summary transactions that were inflating the total.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

cleanMockSummaries();
