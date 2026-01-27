const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');

        const companyName = 'GK SMART';
        const companyCode = 'GK_SMART';
        const password = '666666'; // User provided
        const email = 'info@gksmart.com'; // Mock email

        // Check if exists
        let user = await User.findOne({ companyCode });
        if (user) {
            console.log('User already exists. Updating password...');
        } else {
            console.log('Creating new user...');
            user = new User({
                companyCode,
                companyName,
                email,
                role: 'user',
                loginCode: password
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.isFirstLogin = true;

        await user.save();
        console.log(`✅ User ${companyCode} (${companyName}) created/updated successfully!`);
        console.log(`Password set to: ${password}`);

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
