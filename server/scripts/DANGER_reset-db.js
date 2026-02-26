const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

console.log('Connecting to:', process.env.MONGODB_URI); // Debug log

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        console.log('Deleting all users...');
        await User.deleteMany({});
        console.log('All users deleted.');

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
