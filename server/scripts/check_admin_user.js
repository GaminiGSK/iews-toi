const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ username: 'admin_gsk' });
        console.log("ADMIN_USER_START");
        console.log(JSON.stringify(admin, null, 2));
        console.log("ADMIN_USER_END");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
