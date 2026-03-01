const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ companyCode: 'GK_SMART_AI' });
    console.log(`FULL_ID: [${user.bankStatementsFolderId}]`);
    process.exit(0);
}

check();
