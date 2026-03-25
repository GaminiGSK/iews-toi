require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const all = await User.find({ createdBy: '69c14dd89f5873871ce045f7' });
    console.log(all.map(u => `${u.username} - role: ${u.role}`));
    process.exit(0);
});
