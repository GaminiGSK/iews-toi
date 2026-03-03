const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const TaxPackage = require('../models/TaxPackage');

async function create() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to DB");

        const year = "2024";
        const existing = await TaxPackage.findOne({ year });
        if (existing) {
            console.log(`⏩ Package for ${year} already exists.`);
            process.exit(0);
        }

        const pkg = new TaxPackage({
            year,
            status: 'Draft',
            progress: 0,
            data: {}
        });

        await pkg.save();
        console.log(`✅ Created ${year} package.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

create();
