const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });
const TaxTemplate = require('../models/TaxTemplate');
const fs = require('fs');

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // 1. Create Dummy
        const base64Pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
        const filename = `test-${Date.now()}.png`;

        const t = new TaxTemplate({
            name: 'Test Pixel',
            filename: filename,
            path: '/tmp/dummy',
            data: base64Pixel,
            status: 'New'
        });
        await t.save();
        console.log("Saved Template:", t._id);

        // 2. Fetch Back
        const found = await TaxTemplate.findOne({ filename: filename });
        if (found && found.data === base64Pixel) {
            console.log("SUCCESS: Image Data persisted correctly.");
        } else {
            console.error("FAILURE: Data lost or mismatch.");
        }

        // 3. Clean up
        await TaxTemplate.findByIdAndDelete(t._id);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

test();
