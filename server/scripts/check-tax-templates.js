const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const TaxTemplate = require('../models/TaxTemplate');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB...");

        const count = await TaxTemplate.countDocuments();
        console.log(`Total Tax Templates in DB: ${count}`);

        const templates = await TaxTemplate.find();
        console.log(JSON.stringify(templates, null, 2));

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
