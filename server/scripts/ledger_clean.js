const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const files = await BankFile.find({ companyCode: 'GK_SMART_AI' }).sort({ uploadedAt: -1 });
    console.log(`LEDGER_TOTAL: ${files.length}\n`);
    files.forEach(f => {
        console.log(`F: ${f.originalName}`);
        console.log(`D: ${f.driveId || 'NONE'}`);
        console.log(`---`);
    });
    process.exit(0);
}

check();
