const mongoose = require('mongoose');
require('dotenv').config();
const BankFile = require('../models/BankFile');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const files = await BankFile.find({ companyCode: 'GK_SMART_AI' });
        console.log("BANK_FILES_LIST_START");
        console.log(JSON.stringify(files.map(f => ({
            name: f.originalName,
            hasData: !!f.data,
            dataLength: f.data ? f.data.length : 0,
            path: f.path
        })), null, 2));
        console.log("BANK_FILES_LIST_END");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
