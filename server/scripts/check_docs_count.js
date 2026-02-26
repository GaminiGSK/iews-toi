const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkDocs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const profile = await mongoose.connection.db.collection('companyprofiles').findOne({ companyCode: 'GK_SMART_AI' });

        if (profile) {
            console.log('Profile keys: ' + Object.keys(profile).join(', '));
            if (profile.documents) {
                console.log('Document count: ' + profile.documents.length);
            } else {
                console.log('No documents array.');
            }
        } else {
            console.log('Profile not found.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkDocs();
