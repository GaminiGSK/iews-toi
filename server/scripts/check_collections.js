const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Collections found: ${collections.map(c => c.name).join(', ')}`);

        // Check Bridge collection
        const Bridge = mongoose.model('Bridge', new mongoose.Schema({}, { strict: false }));
        const bridges = await Bridge.find({});
        console.log(`Bridge count: ${bridges.length}`);

        // Check if there are any old profiles
        const Profile = mongoose.model('OldProfile', new mongoose.Schema({}, { strict: false, collection: 'companyprofiles' }));
        const oldProfiles = await Profile.find({});
        console.log(`Profiles in collection 'companyprofiles': ${oldProfiles.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
