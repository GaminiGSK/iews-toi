require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const u = await User.find({}, { username: 1, companyCode: 1, createdBy: 1 });
    console.log(u);
    process.exit(0);
});
