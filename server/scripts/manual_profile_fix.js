const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const CompanyProfile = require('../models/CompanyProfile');

async function fix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const content = `# BUSINESS IDENTITY
**Entity Name:** GK SMART
**Registration ID:** 50015732
**Incorporation Date:** 13 April 2021

# CORE LEADERSHIP
**Director:** GAMINI KASSAPA GAMINI
**Ownership:** Sole Proprietorship (Verified)

# REGISTERED LOCATION
**Main Address:** Phnom Penh (Phnom Penh Hub Context)

# FINANCIAL ARCHITECTURE
**Bank Holder:** GK SMART
**TIN:** Found in MOC Extract
**Currency:** USD (Primary)

# ANALYST SUMMARY
GK SMART is an established Sole Proprietorship in Cambodia, specializing in computer programming and consultancy. The entity has a clean registration record since 2021 and is currently synchronized with the GK SMART & Ai integrated workspace.`;

        const res = await CompanyProfile.updateOne(
            { companyCode: 'GK_SMART_AI' },
            { $set: { organizedProfile: content } },
            { upsert: true }
        );

        console.log('Update Result:', res);

        // Verify again immediately
        const verify = await CompanyProfile.findOne({ companyCode: 'GK_SMART_AI' });
        console.log('Verified Org Profile Length:', verify.organizedProfile ? verify.organizedProfile.length : 'NULL');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fix();
