const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function debugLogin() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const code = '666666';
        console.log(`Searching for loginCode: ${code}...`);

        let user = await User.findOne({ loginCode: code });

        if (!user) {
            console.log('User not found by loginCode. Trying fallback by role...');
            user = await User.findOne({ role: 'user' });
        }

        if (user) {
            console.log('User Found:', {
                id: user._id,
                companyCode: user.companyCode,
                role: user.role,
                loginCode: user.loginCode
            });

            // Test Payload generation
            const payload = {
                id: user._id,
                role: user.role,
                isFirstLogin: user.isFirstLogin,
                companyCode: user.companyCode
            };
            console.log('Payload generated:', payload);

            const jwt = require('jsonwebtoken');
            const token = jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1d' });
            console.log('JWT Sign Success.');
        } else {
            console.log('No user found at all.');
        }

        process.exit(0);
    } catch (err) {
        console.error('DEBUG ERROR:', err);
        process.exit(1);
    }
}

debugLogin();
