const mongoose = require('mongoose');

const SOURCE_URI = 'mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/test?appName=Cluster0';
const TARGET_URI = 'mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0';

async function migrate() {
    try {
        console.log('--- EMERGENCY MIGRATION ---');

        console.log('Connecting to Source (test)...');
        const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();

        console.log('Connecting to Target (gksmart_live)...');
        const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();

        const collections = ['bankfiles', 'companyprofiles', 'transactions', 'accountcodes', 'taxpackages'];

        for (let colName of collections) {
            console.log(`Processing ${colName}...`);
            const docs = await sourceConn.db.collection(colName).find({}).toArray();
            console.log(` - Found ${docs.length} docs.`);

            if (docs.length > 0) {
                // Wipe target first to avoid duplicates if re-running
                await targetConn.db.collection(colName).deleteMany({});
                await targetConn.db.collection(colName).insertMany(docs);
                console.log(` - Migrated ${docs.length} docs to target.`);
            }
        }

        console.log('✅ MIGRATION COMPLETE!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
