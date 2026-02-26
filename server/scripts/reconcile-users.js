const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('--- USER RECONCILIATION ---');
        for (let u of users) {
            console.log(`User: ${u.username}, Code: ${u.loginCode}, Company: ${u.companyCode}, Role: ${u.role}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUsers();
