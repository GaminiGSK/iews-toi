const mongoose = require('mongoose');
require('dotenv').config();
const ProfileTemplate = require('../models/ProfileTemplate');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const template = await ProfileTemplate.findOne();
        console.log(JSON.stringify(template, null, 2));
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
