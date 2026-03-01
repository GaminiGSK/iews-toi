const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function findGK() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({
        $or: [
            { username: /GK/i },
            { companyCode: /GK/i }
        ]
    });
    users.forEach(u => {
        console.log(`USERNAME: ${u.username} | CO_CODE: ${u.companyCode} | BANK_FOLDER: ${u.bankStatementsFolderId}`);
    });
    process.exit(0);
}

findGK();
