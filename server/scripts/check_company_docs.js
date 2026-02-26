const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkDocs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const profile = await mongoose.connection.db.collection('companyprofiles').findOne({ companyCode: 'GK_SMART_AI' });

        if (profile && profile.documents) {
            console.log('--- DOCUMENTS FOR GK_SMART_AI ---');
            for (let doc of profile.documents) {
                console.log(`- Type: ${doc.docType}, Name: ${doc.originalName}, Status: ${doc.status}, Uploaded: ${doc.uploadedAt}`);
            }
        } else {
            console.log('No profile or documents found.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkDocs();
