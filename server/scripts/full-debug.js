const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function debug() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('--- ALL USERS ---');
        users.forEach(u =\u003e {
            console.log(`Username: ${u.username}, Code: ${u.loginCode}, Role: ${u.role}, CompanyCode: ${u.companyCode}`);
        });

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('--- COLLECTION COUNTS ---');
        for (let col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count}`);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
debug();
