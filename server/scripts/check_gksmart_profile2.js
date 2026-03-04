const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function run() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');

    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ username: 'gksmart' });
    console.log('User found:', user.username, user.companyCode);

    const profile = await db.collection('companyprofiles').findOne({ companyCode: user.companyCode });
    console.log('Profile found:', !!profile);
    if (profile) console.log('Profile companyCode:', profile.companyCode);

    process.exit(0);
}
run().catch(console.dir);
