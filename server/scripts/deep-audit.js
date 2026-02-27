const mongoose = require('mongoose');

const dbs = [
    "TOI_I9_RECOVERY",
    "cambodia_law_db",
    "gksmart_live",
    "test",
    "test_dev",
    "toi_iews_standalone",
    "toi_platform",
    "admin",
    "local"
];

const baseUri = "mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/";

async function auditAll() {
    for (const dbName of dbs) {
        console.log(`\n=== Auditing DB: ${dbName} ===`);
        const uri = `${baseUri}${dbName}?appName=Cluster0`;
        try {
            const conn = await mongoose.createConnection(uri).asPromise();
            const collections = await conn.db.listCollections().toArray();

            for (const col of collections) {
                const count = await conn.db.collection(col.name).countDocuments();
                console.log(` - ${col.name}: ${count}`);
            }
            await conn.close();
        } catch (err) {
            console.error(`Error auditing ${dbName}:`, err.message);
        }
    }
    process.exit(0);
}

auditAll();
