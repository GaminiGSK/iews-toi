const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');

    const db = mongoose.connection.db;
    const tx = await db.collection('transactions').findOne();
    if (tx) {
        console.log('Sample Transaction DriveId:');
        console.log(tx.originalData ? tx.originalData.driveId : 'none');
    }

    process.exit(0);
}
run().catch(console.dir);
