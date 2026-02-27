const mongoose = require('mongoose');

const dbs = [
    "TOI_I9_RECOVERY",
    "cambodia_law_db",
    "gksmart_live",
    "test",
    "test_dev",
    "toi_iews_standalone",
    "toi_platform"
];

const baseUri = "mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/";

async function findOrphans() {
    for (const dbName of dbs) {
        console.log(`\n=== Checking DB: ${dbName} ===`);
        const uri = `${baseUri}${dbName}?appName=Cluster0`;
        try {
            const conn = await mongoose.createConnection(uri).asPromise();

            const txCount = await conn.db.collection('transactions').countDocuments();
            console.log(` - Total Transactions: ${txCount}`);

            if (txCount > 0) {
                const sample = await conn.db.collection('transactions').findOne();
                console.log(` - Sample User ID in TX: ${sample.user}`);

                const user = await conn.db.collection('users').findOne({ _id: sample.user });
                if (user) {
                    console.log(` - User Found: ${user.username}`);
                } else {
                    console.log(` - USER NOT FOUND for this TX!`);
                }
            }

            const bankCount = await conn.db.collection('bankfiles').countDocuments();
            console.log(` - Total Bank Files: ${bankCount}`);

            await conn.close();
        } catch (err) {
            console.error(`Error:`, err.message);
        }
    }
    process.exit(0);
}

findOrphans();
