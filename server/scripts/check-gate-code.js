const mongoose = require('mongoose');
const SystemSetting = require('../models/SystemSetting');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const checkCodes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const settings = await SystemSetting.find({});
        console.log('--- Current System Settings ---');
        settings.forEach(s => console.log(`${s.key}: ${s.value}`));
        console.log('-------------------------------');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkCodes();
