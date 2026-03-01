const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await BankFile.countDocuments({ companyCode: 'GK_SMART_AI' });
    const files = await BankFile.find({ companyCode: 'GK_SMART_AI' }).sort({ uploadedAt: -1 });
    console.log(`TOTAL_LEDGER_COUNT: ${count}`);
    files.forEach(f => {
        console.log(`- ${f.originalName} | DRIVE: ${f.driveId || 'NONE'}`);
    });
    process.exit(0);
}

check();
