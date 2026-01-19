const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');

        const companyCode = 'GGMT';
        const password = 'ggmt1235#';
        const email = 'gamini@ggmt.sg';

        // Check if exists
        let user = await User.findOne({ companyCode });
        if (user) {
            console.log('User already exists. Updating password...');
        } else {
            console.log('Creating new user...');
            user = new User({ companyCode, email, role: 'user' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.loginCode = '666666'; // Simple 6-digit code for "Access Code" login
        user.isFirstLogin = true;

        await user.save();
        console.log(`✅ User ${companyCode} created/updated successfully!`);

        // Create or Link Company Profile
        const CompanyProfile = require('../models/CompanyProfile');

        // Check for existing profile by companyCode (even if user is different/deleted)
        let profile = await CompanyProfile.findOne({ companyCode: companyCode });

        if (profile) {
            console.log('Found existing Company Profile. Re-linking to new User ID...');
            profile.user = user._id;
            await profile.save();
            console.log('✅ Company Profile re-linked!');
        } else {
            console.log('Creating default Company Profile...');
            profile = new CompanyProfile({
                user: user._id,
                companyNameKh: 'GK SMART TECH',
                companyNameEn: 'GK SMART',
                companyCode: companyCode,
            });
            await profile.save();
            console.log('✅ Company Profile created!');
        }

        process.exit();
    })
    .catch(err => console.error(err));
