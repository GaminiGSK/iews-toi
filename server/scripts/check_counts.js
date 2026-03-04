const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');

    const db = mongoose.connection.db;

    const bankFilesMsg = await db.collection('bankfiles').countDocuments();
    const transMsg = await db.collection('transactions').countDocuments();
    const accBankFilesMsg = await db.collection('BankFile').countDocuments(); // mongoose capitalizes
    const accTransMsg = await db.collection('Transaction').countDocuments();

    console.log('bankfiles count:', bankFilesMsg);
    console.log('transactions count:', transMsg);
    console.log('BankFile counts:', await db.collection('bankfiles').countDocuments());

    const collections = await db.listCollections().toArray();
    for (let c of collections) {
        if (c.name.toLowerCase().includes('bank') || c.name.toLowerCase().includes('transac')) {
            const count = await db.collection(c.name).countDocuments();
            console.log(c.name, '=>', count);
        }
    }

    process.exit(0);
}
run().catch(console.dir);
