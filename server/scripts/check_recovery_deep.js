const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkRecovery() {
    try {
        const uri = process.env.MONGODB_URI.replace('/gksmart_live?', '/TOI_I9_RECOVERY?');
        const conn = await mongoose.createConnection(uri).asPromise();
        const cols = await conn.db.listCollections().toArray();

        const names = [];
        for (let i = 0; i < cols.length; i++) {
            names.push(cols[i].name);
        }
        console.log('Collections in Recovery: ' + names.join(', '));

        for (let i = 0; i < names.length; i++) {
            const colName = names[i];
            const count = await conn.db.collection(colName).countDocuments();
            console.log(' - ' + colName + ': ' + count);
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
checkRecovery();
