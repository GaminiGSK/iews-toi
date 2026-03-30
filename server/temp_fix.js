require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const users = await User.find({});
    console.log("All users:");
    users.forEach(u => {
        console.log(`- ${u.username} (${u.role}) [creator: ${u.createdBy}] code: ${u.loginCode}`);
    });
    
    // Change all units' createdBy to admin1's ID.
    const admin1 = await User.findOne({ username: 'admin1' });
    if (admin1) {
        console.log(`Admin1 ID: ${admin1._id}`);
        const updateRes = await User.updateMany(
            { role: 'unit', createdBy: { $ne: admin1._id } },
            { $set: { createdBy: admin1._id } }
        );
        console.log(`Updated units to be under Admin1: ${updateRes.modifiedCount}`);
    } else {
        console.log('Admin1 not found!');
    }
    
    process.exit(0);
}).catch(console.error);
