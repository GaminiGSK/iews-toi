require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const CompanyProfile = require('../models/CompanyProfile');

const checkDB = async () => {
    // Hardcoded for reliable testing since .env pathing was flaky
    const uri = 'mongodb://localhost:27017/toi_platform';
    try {
        console.log('Connecting to MongoDB at:', uri);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected! Checking for Company Profile...');

        const companyCode = 'GGMT'; // The temp user code we are using
        const profile = await CompanyProfile.findOne({ companyCode });

        if (profile) {
            console.log('\n[FOUND] Profile exists in Database:');
            console.log('-----------------------------------');
            console.log('Company Name (En):', profile.companyNameEn);
            console.log('Registration Num:', profile.registrationNumber);
            console.log('Structure Type:', profile.companyType);
            console.log('Incorporation Date:', profile.incorporationDate);
            console.log('-----------------------------------');
        } else {
            console.log('\n[NOT FOUND] No profile found for code:', companyCode);
            console.log('This confirms the data is currently only in the UI (Bypass Mode), not saved to disk.');
        }

    } catch (err) {
        console.error('\n[ERROR] Could not connect to Database:', err.message);
        console.log('Reason: The MongoDB service is likely not running on your computer.');
    } finally {
        await mongoose.disconnect();
    }
};

checkDB();
