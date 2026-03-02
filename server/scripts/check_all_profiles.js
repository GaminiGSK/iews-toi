const mongoose = require('mongoose');
require('dotenv').config();
const CompanyProfile = require('../models/CompanyProfile');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const profiles = await CompanyProfile.find({});
        console.log(`Found ${profiles.length} profiles.`);
        profiles.forEach(p => {
            console.log(`Profile: ${p.companyCode} (User: ${p.user}) - Documents: ${p.documents?.length || 0}`);
            if (p.documents?.length > 0) {
                p.documents.forEach(d => {
                    console.log(`  - ${d.originalName} [Type: ${d.docType}] [Text Length: ${d.rawText?.length || 0}]`);
                });
            }
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
