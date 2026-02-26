const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkFields() {
    try {
        const platformUri = process.env.MONGODB_URI.replace('/test?', '/toi_platform?');
        const conn = await mongoose.connect(platformUri);
        const users = await conn.connection.db.collection('users').find().toArray();
        if (users.length > 0) {
            console.log('--- USER FOUND ---');
            const u = users[0];
            console.log('Keys: ' + Object.keys(u).join(', '));
            console.log('Username: ' + u.username);
            console.log('Email: ' + u.email);
            console.log('LoginCode: ' + u.loginCode);
        } else {
            console.log('No users.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkFields();
