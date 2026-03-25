require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const CompanyProfile = require('./models/CompanyProfile');
    const b = await CompanyProfile.find({ companyCode: 'ARAKAN' });
    console.log(`ARAKAN Profiles found: ${b.length}`);
    process.exit(0);
});
