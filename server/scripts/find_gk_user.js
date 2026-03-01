const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function findGK() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({
        $or: [
            { username: /GK/i },
            { companyCode: /GK/i }
        ]
    });
    console.log("GK USERS FOUND:", JSON.stringify(users, null, 2));
    process.exit(0);
}

findGK();
