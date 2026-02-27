const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function cleanup() {
    try {
        console.log('Connecting to MongoDB...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to:', mongoose.connection.name);

        const CompanyProfile = require('../models/CompanyProfile');

        const count = await CompanyProfile.countDocuments();
        console.log(`Found ${count} company profiles.`);

        if (count > 0) {
            console.log('Cleaning up company profiles...');
            const result = await CompanyProfile.deleteMany({});
            console.log(`Successfully deleted ${result.deletedCount} company profiles.`);
        } else {
            console.log('No company profiles to clean up.');
        }

        // Just in case, let's also check if there's any data in other collections we should clean up
        // based on "company profile content". 
        // We will leave Users alone unless specified, but we wanted a "total clean up" of profile content.

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    } catch (err) {
        console.error('Cleanup failed:', err);
    }
}

cleanup();
