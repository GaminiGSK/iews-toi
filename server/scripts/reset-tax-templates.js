const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });
const TaxTemplate = require('../models/TaxTemplate');

const reset = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB...");

        const result = await TaxTemplate.deleteMany({});
        console.log(`Deleted ${result.deletedCount} templates.`);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

reset();
