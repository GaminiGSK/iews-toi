const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function count() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('../models/User');

    const users = await User.find({});
    console.log("USERS_JSON_START");
    console.log(JSON.stringify(users, null, 2));
    console.log("USERS_JSON_END");

    process.exit(0);
}

count();
