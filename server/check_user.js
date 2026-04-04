const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function testUser() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({ username: { $regex: /rsw/i } });
    console.log(`Found ${users.length} RSW users`);
    users.forEach(u => {
        console.log(`- Username: ${u.username}, companyCode: '${u.companyCode}'`);
    });
    process.exit(0);
}
testUser();
