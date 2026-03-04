const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');

    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ username: 'GKSMART' });
    if (!user) {
        console.log('User GKSMART not found. Listing users:');
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => console.log(u.username, u.companyCode));
        process.exit(0);
    }
    console.log('User found:', user.username, 'CompanyCode:', user.companyCode);

    const profile = await db.collection('companyprofiles').findOne({ companyCode: user.companyCode });
    console.log('Profile found:', !!profile);
    if (profile) console.log('Profile details:', Object.keys(profile));

    process.exit(0);
}
run().catch(console.dir);
