const mongoose = require('mongoose');
const User = require('../models/User');
const BankFile = require('../models/BankFile');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function update() {
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Update User Folder ID
    const user = await User.findOne({ companyCode: 'GK_SMART_AI' });
    if (!user) {
        console.error("User not found");
        process.exit(1);
    }
    const targetFolderId = '1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH';
    user.bankStatementsFolderId = targetFolderId;
    await user.save();
    console.log(`Updated GKSMART folder ID to: ${targetFolderId}`);

    // 2. Reset files so they re-sync to the CORRECT folder
    const result = await BankFile.updateMany(
        { companyCode: "GK_SMART_AI" },
        {
            $unset: { driveId: "", path: "" }
        }
    );
    console.log(`Reset ${result.modifiedCount} files for re-sync.`);

    process.exit(0);
}

update();
