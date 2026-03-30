require('dotenv').config();
const mongoose = require('mongoose');

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    const AccountCode = require('./models/AccountCode');
    const User = require('./models/User');

    const u = await User.findOne({username: /skrana/i});
    if (!u) return console.log('SKRANA not found');
    console.log('SKRANA id:', u._id, 'company:', u.companyCode);

    const codes = await AccountCode.find({ companyCode: /skrana/i }).lean();
    console.log('SKRANA codes length:', codes.length);
    if(codes.length > 0) console.log('first code user ID:', codes[0].user);

    process.exit(0);
}
debug();
