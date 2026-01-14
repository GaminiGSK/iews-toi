const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');

        const companyCode = 'GGMT';
        const user = await User.findOne({ companyCode });
        if (user) {
            user.isFirstLogin = false;
            await user.save();
            console.log(`Updated ${companyCode}: isFirstLogin = false`);
        } else {
            console.log('User not found.');
        }

        process.exit();
    })
    .catch(err => console.error(err));
