const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkRecovery() {
    try {
        const recoveryUri = process.env.MONGODB_URI.replace('/test?', '/TOI_I9_RECOVERY?');
        console.log('Connecting to TOI_I9_RECOVERY...');
        const conn = await mongoose.connect(recoveryUri);

        const users = await conn.connection.db.collection('users').find().toArray();
        console.log('--- USERS IN RECOVERY ---');
        for (let u of users) {
            console.log('   * ' + (u.username || u.email) + ' (' + u.role + ') - Code: ' + u.loginCode);
        }

        const txCount = await conn.connection.db.collection('transactions').countDocuments();
        console.log('Transactions: ' + txCount);

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
checkRecovery();
