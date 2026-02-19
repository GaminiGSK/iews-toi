const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TaxPackage = require('../models/TaxPackage');
const ExcelDocument = require('../models/ExcelDocument');
const TaxTemplate = require('../models/TaxTemplate');

async function reset() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear all legacy content
        await TaxPackage.deleteMany({});
        await ExcelDocument.deleteMany({});
        await TaxTemplate.deleteMany({});
        console.log('Cleared existing packages, excel docs, and templates');

        // Add TOI FORM (The new primary structure)
        const toiFoam = new TaxPackage({
            year: 'TOI FORM',
            status: 'Draft',
            progress: 0
        });
        await toiFoam.save();
        console.log('Added TOI FORM package');

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

reset();
