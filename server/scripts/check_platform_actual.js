const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkToiPlatform() {
    try {
        const platformUri = process.env.MONGODB_URI.replace('/test?', '/toi_platform?');
        console.log('Connecting to toi_platform...');
        const conn = await mongoose.connect(platformUri);

        // Use generic collection access to avoid model overlap issues
        const usersCount = await conn.connection.db.collection('users').countDocuments();
        const profilesCount = await conn.connection.db.collection('companyprofiles').countDocuments();

        console.log('toi_platform Inventory:');
        console.log(' - Users: ' + usersCount);
        console.log(' - Company Profiles: ' + profilesCount);

        const users = await conn.connection.db.collection('users').find().toArray();
        console.log('--- USERS IN TOI_PLATFORM ---');
        for (let u of users) {
            console.log('   * ' + u.username + ' (' + u.role + ') - Code: ' + u.loginCode);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkToiPlatform();
