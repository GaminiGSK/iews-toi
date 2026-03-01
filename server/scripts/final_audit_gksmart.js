const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function finalAudit() {
    await mongoose.connect(process.env.MONGODB_URI);
    const files = await BankFile.find({ companyCode: "GK_SMART_AI" });
    console.log(`AUDIT: Found ${files.length} records.`);
    files.forEach(f => {
        console.log(`- File: ${f.originalName} | Status: ${f.status} | Locked: ${f.isLocked} | Drive: ${f.driveId || 'NONE'} | Path: ${f.path || 'NONE'}`);
    });
    process.exit(0);
}

finalAudit();
