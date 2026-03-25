require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const u = await User.find({ username: 'admin1' });
    console.log(`NUMBER OF admin1 users: ${u.length}`);
    console.log(u.map(x => ({ id: x._id, role: x.role, code: x.loginCode })));
    process.exit(0);
});
