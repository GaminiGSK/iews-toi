const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await BankFile.countDocuments({ companyCode: 'GK_SMART_AI' });
    console.log(`GRAND_TOTAL: ${count}`);
    process.exit(0);
}

check();
