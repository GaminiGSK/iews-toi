const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ companyCode: 'GKSMART' });
    console.log("GKSMART User Info:", JSON.stringify(user, null, 2));
    process.exit(0);
}

debug();
