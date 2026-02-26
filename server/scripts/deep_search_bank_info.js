const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function deepSearchBank() {
    try {
        const uri = "mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/?appName=Cluster0";
        await mongoose.connect(uri);
        const dbs = ['gksmart_live', 'test', 'TOI_I9_RECOVERY'];

        for (let dbName of dbs) {
            console.log(`Searching DB: ${dbName}...`);
            const db = mongoose.connection.useDb(dbName);
            const collections = await db.db.listCollections().toArray();

            for (let coll of collections) {
                const results = await db.collection(coll.name).find({
                    $or: [
                        { bankName: { $exists: true, $ne: null } },
                        { accountNumber: { $exists: true, $ne: null } },
                        { companyCode: 'GK_SMART_AI' }
                    ]
                }).limit(5).toArray();

                if (results.length > 0) {
                    console.log(`- Found ${results.length} results in ${coll.name}`);
                    results.forEach(r => {
                        if (r.bankName || r.accountNumber) {
                            console.log(`  * Bank: ${r.bankName}, Acc: ${r.accountNumber}, Code: ${r.companyCode}`);
                        }
                    });
                }
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
deepSearchBank();
