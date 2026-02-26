const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function inspectProfile() {
    try {
        const uri = "mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/test?appName=Cluster0";
        await mongoose.connect(uri);
        const profile = await mongoose.connection.db.collection('companyprofiles').findOne({ companyCode: 'GK_SMART_AI' });
        console.log(JSON.stringify(profile, null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
inspectProfile();
