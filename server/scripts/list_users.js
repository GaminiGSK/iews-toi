const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'username companyCode loginCode role');
        console.log('Users in DB:');
        users.forEach(u => console.log(`- Username: ${u.username} | Code: ${u.companyCode} | LoginCode: ${u.loginCode} | Role: ${u.role}`));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

listUsers();
