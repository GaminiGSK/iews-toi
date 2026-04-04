const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/Antigravity/TOI/server/.env' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const CompanyProfile = require('./models/CompanyProfile');
    const profile = await CompanyProfile.findOne({ companyCode: 'SCAR' });
    console.log("--- scarTaxPatent ---");
    console.log(profile.scarTaxPatent ? profile.scarTaxPatent.substring(0, 500) : "NULL");
    console.log("--- scarTaxIdCard ---");
    console.log(profile.scarTaxIdCard ? profile.scarTaxIdCard.substring(0, 500) : "NULL");
    process.exit();
}
check();
