const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkAdminDocs() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in .env');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ username: 'Admin' });
        if (!admin) {
            console.log('Admin user not found');
            return;
        }

        const profile = await CompanyProfile.findOne({ user: admin._id });
        if (!profile) {
            console.log('Admin profile not found');
            return;
        }

        console.log(`Admin Profile found: ${profile.companyNameEn}`);
        console.log(`Documents Count: ${profile.documents.length}`);

        profile.documents.forEach((doc, i) => {
            console.log(`[${i}] Type: ${doc.docType} | Status: ${doc.status} | RawText Length: ${doc.rawText ? doc.rawText.length : 0}`);
            if (doc.rawText) {
                console.log(`    Snippet: ${doc.rawText.substring(0, 100)}...`);
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkAdminDocs();
