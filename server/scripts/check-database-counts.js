const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to:', process.env.MONGODB_URI.split('@')[1]);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:');
        for (let col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(` - ${col.name}: ${count}`);
        }

        const users = await mongoose.connection.db.collection('users').find().toArray();
        console.log('User Data Ownership:');
        for (let user of users) {
            const txCount = await mongoose.connection.db.collection('transactions').countDocuments({ user: user._id });
            const bankCount = await mongoose.connection.db.collection('bankfiles').countDocuments({ user: user._id });
            console.log(` - User: ${user.username} (ID: ${user._id})`);
            console.log(`    * Transactions: ${txCount}`);
            console.log(`    * Bank Files: ${bankCount}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
