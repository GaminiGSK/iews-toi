const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ username: 'GKSMART' });
    console.log(`USER: ${user.username}`);
    console.log(`- Root Folder: ${user.driveFolderId}`);
    console.log(`- Bank Folder: ${user.bankStatementsFolderId}`);
    console.log(`- BR Folder: ${user.brFolderId}`);
    process.exit(0);
}

check();
