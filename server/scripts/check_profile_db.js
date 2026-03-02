const mongoose = require('mongoose');
require('dotenv').config();
const CompanyProfile = require('../models/CompanyProfile');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const profiles = await CompanyProfile.find({ companyCode: 'GK_SMART_AI' });
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
