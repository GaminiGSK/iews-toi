const mongoose = require('mongoose');
require('dotenv').config();
const CompanyProfile = require('../models/CompanyProfile');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const profiles = await CompanyProfile.find({});
        console.log(`Searching for profiles... Total: ${profiles.length}`);

        profiles.forEach(p => {
            console.log(`Code: ${p.companyCode} | User: ${p.user} | ID: ${p._id}`);
            p.documents.forEach(d => {
                if (d.rawText && d.rawText.length > 500) {
                    console.log(`  >>> FOUND REAL TEXT IN DOC: ${d.originalName} (${d.rawText.length} chars)`);
                }
            });
        });
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
