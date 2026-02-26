const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

async function analyze() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        const collections = ['transactions', 'bankfiles', 'companyprofiles', 'taxpackages'];

        console.log('--- DATA ANALYSIS BY COMPANY CODE ---');

        for (let colName of collections) {
            console.log(`\nCollection: ${colName}`);
            const results = await db.collection(colName).aggregate([
                { $group: { _id: "$companyCode", count: { $sum: 1 } } }
            ]).toArray();

            if (results.length === 0) {
                console.log(' (Empty)');
            } else {
                results.forEach(r => {
                    console.log(` - ${r._id || 'NULL'}: ${r.count}`);
                });
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
analyze();
