const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Transaction = require('../models/Transaction');
const BankFile = require('../models/BankFile');

async function checkOverlap() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const files = await BankFile.find({ companyCode: 'GK_SMART_AI' });

        for (const f of files) {
            console.log(`\nFile: ${f.originalName} | Range: ${f.dateRange} | DriveId: ${f.driveId}`);
            if (f.dateRange && f.dateRange.includes(' - ')) {
                const [s, e] = f.dateRange.split(' - ');
                const start = new Date(s.trim());
                const end = new Date(e.trim());

                const count = await Transaction.countDocuments({
                    companyCode: 'GK_SMART_AI',
                    date: { $gte: start, $lte: end }
                });
                console.log(`  Transactions in this date range: ${count}`);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkOverlap();
