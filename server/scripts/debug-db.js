const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');
        const users = await User.find({});
        console.log('Current Users:', JSON.stringify(users, null, 2));
        console.log('Admin Count:', await User.countDocuments({ role: 'admin' }));

        // Force delete if users exist
        if (users.length > 0) {
            console.log('Deleting all users now...');
            await User.deleteMany({});
            console.log('All users deleted.');
        }

        process.exit();
    })
    .catch(err => console.error(err));
