const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');
require('dotenv').config({ path: './.env' });

async function getProfile() {
    await mongoose.connect(process.env.MONGODB_URI);
    const company = await CompanyProfile.findOne({ companyCode: { $regex: /GK/i } });
    if (company) {
        console.log(JSON.stringify(company, null, 2));
    } else {
        console.log("Not found");
    }
    process.exit(0);
}
getProfile();
