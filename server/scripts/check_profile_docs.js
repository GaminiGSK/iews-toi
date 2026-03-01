const mongoose = require('mongoose');
const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ username: 'GKSMART' });
    const profile = await CompanyProfile.findOne({ user: user._id });
    if (!profile) return console.log("No profile found.");

    console.log(`GKSMART documents found: ${profile.documents.length}`);
    profile.documents.forEach(d => {
        console.log(`- TYPE: ${d.docType} | DRIVE_ID: ${d.driveId || 'NONE'} | PATH: ${d.path}`);
    });
    process.exit(0);
}

check();
