require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const all = await User.find({}, { companyCode: 1, _id: 0 });
    console.log("ALL USERS:", JSON.stringify(all));
    process.exit(0);
});
