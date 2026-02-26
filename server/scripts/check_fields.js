const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkFields() {
    try {
        const platformUri = process.env.MONGODB_URI.replace('/test?', '/toi_platform?');
        const conn = await mongoose.connect(platformUri);
        const users = await conn.connection.db.collection('users').find().toArray();
        if (users.length \u003e 0) {
            console.log('--- FIRST USER DATA ---');
            console.log(JSON.stringify(users[0], null, 2));
        } else {
            console.log('No users found in toi_platform');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkFields();
