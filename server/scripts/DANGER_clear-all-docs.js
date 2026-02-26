require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const CompanyProfile = require('../models/CompanyProfile');

const clearDocs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Find the Main Profile (GGMT)
        // Adjust filter if needed, or clear ALL.
        // Assuming user wants to clear THEIR profile.
        // I'll clear all documents for profiles that have documents.

        // Target valid user profile only to avoid validation errors on junk data
        const profiles = await CompanyProfile.find({ user: '696df1830c93b0f4a5a6505f' });
        console.log(`Found ${profiles.length} profiles with documents.`);

        for (const p of profiles) {
            console.log(`Clearing ${p.documents.length} docs for Company: ${p.companyCode}`);
            p.documents = []; // WIPE
            // Also reset fields if needed?
            // "fully empty" might mean just the files list.
            await p.save();
            console.log('Cleared.');
        }

        console.log('All Clean.');
        process.exit();

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

clearDocs();
