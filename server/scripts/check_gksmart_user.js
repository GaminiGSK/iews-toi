const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ username: 'GKSMART' });
        console.log("USER_JSON_START");
        console.log(JSON.stringify(user, null, 2));
        console.log("USER_JSON_END");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
