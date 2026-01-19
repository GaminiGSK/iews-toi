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
        user.isFirstLogin = true;

        await user.save();
        console.log(`✅ User ${companyCode} created/updated successfully!`);

        // Create Default Company Profile
        const CompanyProfile = require('../models/CompanyProfile');
        let profile = await CompanyProfile.findOne({ user: user._id });
        if (!profile) {
            console.log('Creating default Company Profile...');
            profile = new CompanyProfile({
                user: user._id,
                companyNameKh: 'GK SMART TECH',
                companyNameEn: 'GK SMART',
                companyCode: companyCode,
            });
            await profile.save();
            console.log('✅ Company Profile created!');
        } else {
            console.log('Company Profile already exists.');
        }

        process.exit();
    })
    .catch(err => console.error(err));
