const mongoose = require('mongoose');
require('dotenv').config();
const CompanyProfile = require('../models/CompanyProfile');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const profile = await CompanyProfile.findOne({ companyCode: 'GK_SMART_AI' });
        if (profile) {
            console.log("PROFILE_DATA_START");
            console.log("Global Organized Profile:");
            console.log(profile.organizedProfile);
            console.log("\nDocument Details:");
            profile.documents.forEach((d, i) => {
                console.log(`Doc ${i}: ${d.originalName}`);
                console.log(`  Status: ${d.status}`);
                console.log(`  Raw Text (first 100): ${d.rawText?.substring(0, 100)}`);
                console.log(`  Extracted Data Keys: ${Object.keys(d.extractedData || {}).join(', ')}`);
            });
            console.log("PROFILE_DATA_END");
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
