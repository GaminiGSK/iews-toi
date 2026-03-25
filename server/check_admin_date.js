require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const u = await User.findOne({ username: 'admin1' });
    console.log(`admin1 created at: ${u.createdAt}`);
    process.exit(0);
});
