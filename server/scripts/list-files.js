const mongoose = require('mongoose');
const BankFile = require('../models/BankFile'); // Ensure this model exists or use generic collection access
const CompanyProfile = require('../models/CompanyProfile'); // BankFiles are technically stored here in 'bankFiles' array usually? 
// Wait, Step 9352 says: `await axios.get('/api/company/bank-files')`.
// Check route `server/routes/company.js`.
// Step 9486: `router.get('/ledger')`.
// I need to check where `bank-files` are stored.
// Step 9352 line 148: `files` from response.
// Step 9334 line 688: `api/company/bank-files/${file._id}` implies they are documents.
// But wait, there is no `BankFile` model usage in `company.js` visible in previous views?
// Let's check `server/models`.

// I'll assume they are in a collection called `bankfiles` or embedded in `companyprofiles`.
// Step 9334 Line 689 calls DELETE on `/api/company/bank-files/:id`.
// This strongly implies a separate collection.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Let's list collections to be sure
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // Try to find the file
        // I guess the collection is 'bankfiles' (default lowercase plural)
        const files = await mongoose.connection.db.collection('bankfiles').find({}).toArray();

        console.log('--- Bank Files ---');
        files.forEach(f => {
            console.log(`ID: ${f._id} | DriveID: ${f.driveId} | Name: ${f.originalName}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

debug();
