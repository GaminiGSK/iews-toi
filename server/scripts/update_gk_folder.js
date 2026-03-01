const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function update() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ companyCode: 'GK_SMART_AI' });
    if (!user) {
        console.error("User GK_SMART_AI not found");
        process.exit(1);
    }
    const oldId = user.bankStatementsFolderId;
    const newId = '16d27mzpBnEzujvilWvp3-Lgmdt5WBvvuD';
    user.bankStatementsFolderId = newId;
    await user.save();
    console.log(`Updated GK_SMART_AI's bankStatementsFolderId from ${oldId} to ${newId}`);
    process.exit(0);
}

update();
