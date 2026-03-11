const mongoose = require('mongoose');
const Bridge = require('./models/Bridge');
require('dotenv').config({ path: './.env' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Bridge.countDocuments({ status: 'unread' });
    const entries = await Bridge.find({ status: 'unread' }).sort({ createdAt:-1 }).limit(10);
    console.log("Unread count:", count);
    console.log(JSON.stringify(entries, null, 2));
    process.exit(0);
}
check();
