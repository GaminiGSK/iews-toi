const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkToiPlatform() {
    try {
        const platformUri = process.env.MONGODB_URI.replace('/test?', '/toi_platform?');
        console.log('Connecting to toi_platform...');
        const conn = await mongoose.connect(platformUri);

        const usersCount = await conn.connection.db.collection('users').countDocuments();
        const profilesCount = await conn.connection.db.collection('companyprofiles').countDocuments();
        const txCount = await conn.connection.db.collection('transactions').countDocuments();

        console.log('toi_platform Inventory:');
        console.log(` - Users: ${usersCount}`);
        console.log(` - Company Profiles: ${profilesCount}`);
        console.log(` - Transactions: ${txCount}`);

        if (usersCount \u003e 0) {
            const users = await conn.connection.db.collection('users').find().toArray();
            console.log('Users:');
            users.forEach(u =\u003e console.log(`   * ${u.username} (${u.role})`));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkToiPlatform();
