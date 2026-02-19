const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iews_toi';

async function checkUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        const users = await User.find({}, 'username role loginCode _id');
        console.log('Available Users:');
        users.forEach(u => {
            console.log(`- ${u.username} (${u.role}): Code ${u.loginCode} (ID: ${u._id})`);
        });
        process.exit(0);
    } catch (err) {
        console.error('FAILED TO CONNECT OR FETCH:', err);
        process.exit(1);
    }
}

checkUsers();
