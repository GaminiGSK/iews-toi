const mongoose = require('mongoose');
require('dotenv').config();
const CompanyProfile = require('./models/CompanyProfile');
const fs = require('fs');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const profile = await CompanyProfile.findOne({ companyCode: 'RSW' });
    if (!profile) return console.log('RSW not found');
    let out = `
nameKh: ${profile.companyNameKh}
extKh: ${profile.extractedData ? profile.extractedData.get('companyNameKh') : ''}
orgProfile:
${profile.organizedProfile}
`;
    fs.writeFileSync('rsw_dump.txt', out);
    console.log('Saved to rsw_dump.txt');
    process.exit(0);
}
check();
