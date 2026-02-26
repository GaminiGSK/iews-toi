const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkProfileDocs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const CompanyProfile = mongoose.connection.db.collection('companyprofiles');
        const profiles = await CompanyProfile.find({ companyCode: 'GK_SMART_AI' }).toArray();

        profiles.forEach(p => {
            console.log(`Profile for ${p.companyCode}:`);
            p.documents?.forEach(d => {
                console.log(`- Doc: ${d.docType}, Path: ${d.path}, Size: ${d.data?.length || 0}`);
            });
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkProfileDocs();
