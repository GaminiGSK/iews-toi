const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const users = await User.find({});
        users.forEach(u => {
            console.log(`User: ${u.companyName} | Code: ${u.loginCode} | Role: ${u.role}`);
        });
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
