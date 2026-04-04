const mongoose = require('mongoose');
require('dotenv').config({path: 'e:/Antigravity/TOI/server/.env'});
const CompanyProfile = require('./models/CompanyProfile');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const profile = await CompanyProfile.findOne({ companyCode: 'SCAR' });
    console.log("Found profile?", !!profile);
    if(profile) {
        console.log("Tax Patent:", profile.scarTaxPatent);
        console.log("Tax Id Card:", profile.scarTaxIdCard);
    }
    process.exit(0);
}
check();
