const mongoose = require('mongoose');
require('dotenv').config();
const CompanyProfile = require('../models/CompanyProfile');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const profile = await CompanyProfile.findOne({ companyCode: 'GK_SMART_AI' });
        if (profile) {
            console.log("PROFILE_DATA_START");
            console.log("Organized Profile Content:");
            console.log(profile.organizedProfile || "NONE");
            console.log("\nDocuments in Pool:");
            profile.documents.forEach(d => {
                console.log(`- ${d.originalName} (${d.status}) - Text Preview: ${d.rawText?.substring(0, 50)}...`);
            });
            console.log("PROFILE_DATA_END");
        } else {
            console.log("Profile not found.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
