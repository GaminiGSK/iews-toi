require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const checkUserCodes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const users = await User.find({}, 'companyName companyCode loginCode role email');
        console.log('--- USER LOGIN CODES ---');
        console.log(JSON.stringify(users, null, 2));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUserCodes();
