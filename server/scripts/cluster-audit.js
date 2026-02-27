const mongoose = require('mongoose');

const uris = [
    "mongodb+srv://admin_gsk:admingsk1235@cluster0.mongodb.net/gksmart_live?appName=Cluster0",
    "mongodb+srv://admin_gsk:admingsk1235@cluster0.mongodb.net/test?appName=Cluster0",
    "mongodb+srv://admin_gsk:admingsk1235@cluster0.mongodb.net/iews-toi?appName=Cluster0"
];

async function auditClusters() {
    for (const uri of uris) {
        console.log(`\n=== Auditing URI: ${uri.split('@')[1].split('?')[0]} ===`);
        try {
            const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
            const collections = await conn.db.listCollections().toArray();

            for (const col of collections) {
                const count = await conn.db.collection(col.name).countDocuments();
                console.log(` - ${col.name}: ${count}`);
            }
            await conn.close();
        } catch (err) {
            console.error(`Error:`, err.message);
        }
    }
    process.exit(0);
}

auditClusters();
