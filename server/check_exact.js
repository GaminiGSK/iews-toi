require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const u = await User.find({ companyCode: 'ARAKAN' });
    console.log("IS IT HERE?", JSON.stringify(u, null, 2));
    process.exit(0);
});
