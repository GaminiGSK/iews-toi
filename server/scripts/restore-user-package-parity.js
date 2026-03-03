const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const TaxTemplate = require('../models/TaxTemplate');
const TaxPackage = require('../models/TaxPackage');

async function restoreUserPackage() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to DB");

        // 1. Get all 27 sync'd master templates
        const templates = await TaxTemplate.find({}).sort({ pageNumber: 1 });
        if (templates.length !== 27) {
            console.error(`❌ Mismatch: Found ${templates.length} templates (Expected 27)`);
            process.exit(1);
        }

        // 2. Find or create the 2024 TaxPackage
        let pkg = await TaxPackage.findOne({ year: '2024' });
        if (!pkg) {
            console.log("Creating new 2024 TaxPackage...");
            pkg = new TaxPackage({
                year: '2024',
                status: 'Draft',
                progress: 0,
                documents: []
            });
        }

        // 3. Update the documents array to have 100% parity with templates
        console.log("Parity Check: Matching User Package documents to Admin Master Templates...");

        const packageDocs = templates.map(t => ({
            name: t.name,
            status: 'Ready',
            updatedAt: new Date()
        }));

        pkg.documents = packageDocs;
        pkg.progress = 100; // Ready for work
        pkg.updatedAt = new Date();

        await pkg.save();
        console.log(`✅ User Package '2024' updated with ${pkg.documents.length} pages.`);

        // 4. Update the 'TOI FORM' package as well if it exists
        let toiFormPkg = await TaxPackage.findOne({ year: 'TOI FORM' });
        if (toiFormPkg) {
            toiFormPkg.documents = packageDocs;
            await toiFormPkg.save();
            console.log(`✅ User Package 'TOI FORM' updated with ${toiFormPkg.documents.length} pages.`);
        }

        console.log("🏁 Restoration complete! Admin and User packages are 100% matched.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

restoreUserPackage();
