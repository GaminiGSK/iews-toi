const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const activateUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const result = await User.findOneAndUpdate(
            { companyCode: 'GGMT' },
            { isFirstLogin: false },
            { new: true }
        );

        if (result) {
            console.log(`Updated user ${result.companyCode}: isFirstLogin = ${result.isFirstLogin}`);
        } else {
            console.log('User GGMT not found.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

activateUser();
