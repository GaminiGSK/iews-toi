const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const files = await BankFile.find({ driveId: { $ne: null } });
    console.log(`TOTAL FILES WITH DRIVE ID: ${files.length}`);
    files.forEach(f => {
        console.log(`- COMPANY: ${f.companyCode} | FILE: ${f.originalName} | DRIVE: ${f.driveId}`);
    });
    process.exit(0);
}

check();
