const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');

    const db = mongoose.connection.db;

    const bankFilesMsg = await db.collection('bankfiles').find({}).toArray();
    console.log('\n--- BANK FILES DATE RANGE ---');
    bankFilesMsg.forEach(bf => console.log(bf.originalName, '|', bf.dateRange, '| DriveId:', bf.driveId));

    process.exit(0);
}
run().catch(console.dir);
