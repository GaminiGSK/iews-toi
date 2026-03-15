const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const CompanyProfile = require('./models/CompanyProfile');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const profile = await CompanyProfile.findOne({ companyCode: 'GK_SMART_AI' }).lean();
    console.log(JSON.stringify(profile, null, 2));
    process.exit();
});
