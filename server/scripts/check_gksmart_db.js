const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ username: 'GKSMART' });
        console.log("GKSMART_USER_DB_START");
        console.log(JSON.stringify(user, null, 2));
        console.log("GKSMART_USER_DB_END");
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
