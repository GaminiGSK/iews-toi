require('dotenv').config();
const mongoose = require('mongoose');

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    const AccountCode = require('./models/AccountCode');
    const User = require('./models/User');

    const u = await User.findOne({username: 'SKRANA'});
    if (!u) return console.log('SKRANA not found');
    console.log('SKRANA id:', u._id, 'company:', u.companyCode);

    const codes = await AccountCode.find({ companyCode: 'SKRANA' }).limit(3).lean();
    console.log('SKRANA codes:', codes);

    const rsw = await AccountCode.find({ companyCode: 'RSW' }).limit(3).lean();
    console.log('RSW codes:', rsw);
    process.exit(0);
}
debug();
