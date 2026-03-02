const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const CompanyProfile = require('./server/models/CompanyProfile');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const profiles = await CompanyProfile.find({ username: 'GKSMART' });
        console.log("PROFILES_LIST_START");
        console.log(JSON.stringify(profiles, null, 2));
        console.log("PROFILES_LIST_END");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
