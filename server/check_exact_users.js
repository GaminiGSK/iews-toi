require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const u1 = await User.find({ companyCode: 'ARKAN' });
    const u2 = await User.find({ companyCode: 'ARAKAN' });
    console.log("ARKAN Users:", u1.map(u => u.email));
    console.log("ARAKAN Users:", u2.map(u => u.email));
    process.exit(0);
});
