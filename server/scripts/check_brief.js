const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ username: 'GKSMART' });
    const files = await BankFile.find({ user: user._id });
    console.log(`TOTAL FILES FOR GKSMART: ${files.length}`);
    files.forEach(f => {
        console.log(`FILE: ${f.originalName} | LOCKED: ${f.isLocked} | DRIVE_ID: ${f.driveId || 'NONE'}`);
    });
    process.exit(0);
}

check();
