const mongoose = require('mongoose');
const fs = require('fs');
const CompanyProfile = require('./models/CompanyProfile');
require('dotenv').config({ path: './.env' });

async function getProfile() {
    await mongoose.connect(process.env.MONGODB_URI);
    const company = await CompanyProfile.findOne({ companyCode: { $regex: /GK/i } });
    if (company) {
        fs.writeFileSync('gksmart.json', JSON.stringify(company, null, 2), 'utf8');
    } else {
        fs.writeFileSync('gksmart.json', 'Not found', 'utf8');
    }
    process.exit(0);
}
getProfile();
