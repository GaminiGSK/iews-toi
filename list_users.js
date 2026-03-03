const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./server/models/User');

    const allUsers = await User.find({}, 'username companyCode role loginCode');

    console.log('--- USERS ---');
    allUsers.forEach(u => console.log(`${u.username} (${u.role}) -> ${u.companyCode} [Code: ${u.loginCode}]`));

    process.exit();
}

run();
