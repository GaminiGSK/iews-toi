require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const u = await User.findById('69c14dd89f5873871ce045f7');
    console.log("WHO IS THIS?", u ? u.username : 'DOES NOT EXIST');
    process.exit(0);
});
