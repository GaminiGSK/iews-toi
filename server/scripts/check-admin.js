const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');
        const admin = await User.findOne({ companyCode: 'ADMIN01' });
        if (admin) {
            console.log('✅ ADMIN01 Found!');
            console.log('Role:', admin.role);
            console.log('Password Hash:', admin.password ? 'Present' : 'MISSING');
        } else {
            console.log('❌ ADMIN01 NOT FOUND.');
        }
        process.exit();
    })
    .catch(err => console.error(err));
