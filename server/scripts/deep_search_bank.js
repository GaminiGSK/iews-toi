const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function deepSearch() {
    try {
        const dbs = ['test', 'toi_platform', 'TOI_I9_RECOVERY'];
        const collections = ['bankfiles', 'transactions'];

        console.log('--- GLOBAL SEARCH FOR BANK DATA ---');

        for (let i = 0; i < dbs.length; i++) {
            const dbName = dbs[i];
            const uri = process.env.MONGODB_URI.replace('/gksmart_live?', '/' + dbName + '?');
            const conn = await mongoose.createConnection(uri).asPromise();

            for (let j = 0; j < collections.length; j++) {
                const colName = collections[j];
                const results = await conn.db.collection(colName).aggregate([
                    { $group: { _id: "$companyCode", count: { $sum: 1 } } }
                ]).toArray();

                if (results.length > 0) {
                    console.log('DB: ' + dbName + ', Collection: ' + colName);
                    for (let k = 0; k < results.length; k++) {
                        const r = results[k];
                        console.log(' - ' + (r._id || 'NULL') + ': ' + r.count);
                    }
                }
            }
            await conn.close();
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
deepSearch();
