const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');

async function checkDuplicates() {
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

        console.log(`Document Count: ${profile.documents.length}`);

        const counts = {};
        profile.documents.forEach(doc => {
            counts[doc.originalName] = (counts[doc.originalName] || 0) + 1;
        });

        console.log('\n--- Duplicate Check ---');
        let hasDuplicates = false;
        for (const [name, count] of Object.entries(counts)) {
            if (count > 1) {
                console.log(`Duplicate: "${name}" (${count} copies)`);
                hasDuplicates = true;
            }
        }

        if (!hasDuplicates) {
            console.log('No duplicates found by filename.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkDuplicates();
