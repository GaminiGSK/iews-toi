const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');

async function checkCodes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username: 'GKSMART' });
        if (!user) {
            console.log('User GKSMART not found');
            process.exit(0);
        }

        const profile = await CompanyProfile.findOne({ user: user._id });
        if (!profile) {
            console.log('Profile for GKSMART not found');
            process.exit(0);
        }

        console.log('--- Document Raw Text Analysis for GKSMART ---');
        profile.documents.forEach(doc => {
            console.log(`\nDocument Type: ${doc.docType}`);
            const text = doc.rawText || '';
            // Match 4-5 digit numbers (likely ISIC codes)
            const codes = text.match(/\b\d{4,5}\b/g);
            console.log(`Possible Codes Found: ${codes ? codes.join(', ') : 'None'}`);
            if (text.length > 0) {
                console.log('Snippet:', text.substring(0, 300).replace(/\n/g, ' '));
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCodes();
