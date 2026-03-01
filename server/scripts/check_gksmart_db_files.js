const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkGksmartBankFiles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ username: 'GKSMART' });
        if (!user) return console.log("User GKSMART not found.");

        const files = await BankFile.find({ user: user._id });
        console.log(`GKSMART Sticked Files in DB: ${files.length}`);

        files.forEach(f => {
            console.log(`- ${f.originalName} | Status: ${f.status} | Locked: ${f.isLocked} | Drive: ${f.driveId || 'NONE'}`);
        });

        console.log(`User Folders: Root (${user.driveFolderId}) | Bank Sub (${user.bankStatementsFolderId})`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkGksmartBankFiles();
