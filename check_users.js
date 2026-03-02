const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const User = require('./server/models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        console.log("USERS_LIST_START");
        console.log(JSON.stringify(users.map(u => ({ u: u.username, r: u.role, c: u.companyCode })), null, 2));
        console.log("USERS_LIST_END");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
