const mongoose = require('mongoose');
const uri = 'mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/test?appName=Cluster0';
const live_uri = 'mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0';

async function fix() {
    for (const u of [uri, live_uri]) {
        await mongoose.connect(u);
        const User = mongoose.connection.db.collection('users');
        await User.updateOne({ username: 'GKSMART' }, { $set: { role: 'admin' } });
        await User.updateOne({ username: 'Admin' }, { $set: { role: 'admin' } });
        console.log(`Synced roles on ${u}`);
        await mongoose.connection.close();
    }
    process.exit(0);
}
fix();
