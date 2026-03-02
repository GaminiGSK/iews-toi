const mongoose = require('mongoose');
require('dotenv').config();
const CompanyProfile = require('../models/CompanyProfile');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const profile = await CompanyProfile.findOne({ companyCode: 'GK_SMART_AI' });
        if (profile && profile.documents && profile.documents.length > 0) {
            console.log("ERROR_TEXT_PREVIEW_START");
            console.log(profile.documents[0].rawText);
            console.log("ERROR_TEXT_PREVIEW_END");
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
