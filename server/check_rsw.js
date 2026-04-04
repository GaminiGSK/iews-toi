const mongoose = require('mongoose');
require('dotenv').config();
const CompanyProfile = require('./models/CompanyProfile');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const profile = await CompanyProfile.findOne({ companyCode: 'RSW' });
    if (!profile) return console.log('RSW not found');
    console.log('companyNameKh:', profile.companyNameKh);
    if(profile.extractedData) {
        console.log('extractedData.companyNameKh:', profile.extractedData.get('companyNameKh'));
    }
    console.log('organizedProfile:', profile.organizedProfile);
    process.exit(0);
}
check();
