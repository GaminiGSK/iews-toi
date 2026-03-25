require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const CompanyProfile = require('./models/CompanyProfile');
    const users = await User.find({ companyCode: { $regex: /ARKAN/i } });
    console.log("Users:");
    users.forEach(u => console.log(u.email, u.companyCode));
    
    console.log("Profiles:");
    const profiles = await CompanyProfile.find({});
    profiles.forEach(p => console.log(p.companyNameEn));
    process.exit(0);
});
