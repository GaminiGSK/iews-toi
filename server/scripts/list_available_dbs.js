const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function listDatabases() {
    try {
        console.log('Connecting to Atlas...');
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        const admin = conn.connection.db.admin();
        const dbs = await admin.listDatabases();

        console.log('--- AVAILABLE DATABASES ---');
        for (let db of dbs.databases) {
            console.log(` - ${db.name} (${db.sizeOnDisk} bytes)`);
        }

        process.exit(0);
    } catch (err) {
        console.error('List DB Error:', err);
        process.exit(1);
    }
}
listDatabases();
