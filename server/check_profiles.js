const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const CompanyProfile = require('./models/CompanyProfile');
    const User = require('./models/User');

    const profiles = await CompanyProfile.find().lean();
    console.log(`Found ${profiles.length} profiles.`);

    for (const p of profiles) {
        const user = await User.findById(p.user);
        console.log(`\n--- PROFILE for ${user ? user.username : p.user} (${p.companyCode}) ---`);
        console.log(`Docs: ${p.documents.length}`);
        p.documents.forEach((d, i) => {
            console.log(` [${i}] ${d.originalName} (${d.docType}) - Text Length: ${d.rawText ? d.rawText.length : 0} - Status: ${d.status}`);
        });
        console.log(`Organized Summary Length: ${p.organizedProfile ? p.organizedProfile.length : 0}`);
    }

    process.exit();
}

run();
