const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

async function listDBs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('Available Databases:');
        dbs.databases.forEach(db =\u003e {
            console.log(` - ${db.name}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
listDBs();
