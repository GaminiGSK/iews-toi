require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');

    // Find admin1
    const admin = await User.findOne({ companyCode: 'ADMIN1' });
    if (!admin) {
        console.log("NO ADMIN1 FOUND");
        process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt); // Default generic

    const newUser = new User({
        username: 'ARAKAN',
        companyCode: 'ARAKAN',
        password: hashedPassword,
        companyName: 'ARAKAN',
        role: 'unit',
        createdBy: admin._id
    });

    try {
        await newUser.save();
        console.log("Restored ARAKAN under ADMIN1");
    } catch(err) {
        console.log("Error:", err.message);
    }
    process.exit(0);
});
