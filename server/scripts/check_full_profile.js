const mongoose = require('mongoose');
require('dotenv').config();
const CompanyProfile = require('../models/CompanyProfile');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const profile = await CompanyProfile.findOne({ companyCode: 'GK_SMART_AI' });
        if (profile) {
            console.log("FULL_PROFILE_OBJECT_START");
            const obj = profile.toObject();
            delete obj.documents; // Too big
            console.log(JSON.stringify(obj, null, 2));
            console.log("FULL_PROFILE_OBJECT_END");
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
