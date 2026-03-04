const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');

    const db = mongoose.connection.db;

    const users = await db.collection('users').find({}).toArray();
    console.log('\n--- USERS ---');
    users.forEach(u => console.log(u.username, u.companyCode));

    const bankFilesMsg = await db.collection('bankfiles').find({}).toArray();
    console.log('\n--- BANK FILES ---');
    bankFilesMsg.forEach(bf => console.log(bf.originalName, bf.companyCode));

    process.exit(0);
}
run().catch(console.dir);
