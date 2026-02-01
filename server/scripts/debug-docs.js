const mongoose = require('mongoose');
const path = require('path');
// Fix path to .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const CompanyProfile = require('../models/CompanyProfile');

async function checkDocs() {
    try {
        console.log('Connecting to DB...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const profiles = await CompanyProfile.find({});
        console.log(`Profiles Found: ${profiles.length}`);

        for (const p of profiles) {
            console.log(`User: ${p.user} | Company: ${p.companyCode}`);
            console.log('Documents:');
            p.documents.forEach(d => {
                console.log(` - Type: ${d.docType}`);
                console.log(`   Path: ${d.path}`);
                console.log(`   URL Test: ${d.path.startsWith('drive:') ? 'Drive API' : '/uploads/' + d.path.replace(/\\/g, '/').split('/').pop()}`);
            });
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkDocs();
