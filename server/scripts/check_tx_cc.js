const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');

    const db = mongoose.connection.db;
    const txs = await db.collection('transactions').find({}).toArray();
    console.log('TX count:', txs.length);
    console.log('Sample CompanyCodes:', Array.from(new Set(txs.map(t => t.companyCode))));
    process.exit(0);
}
run().catch(console.dir);
