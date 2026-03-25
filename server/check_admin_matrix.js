require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');

    const admin = await User.findOne({ companyCode: 'RSW' });
    const arkan = await User.findOne({ companyCode: 'ARAKAN' });
    
    console.log("RSW createdBy:", admin ? admin.createdBy : 'Not Found');
    console.log("ARAKAN createdBy:", arkan ? arkan.createdBy : 'Not Found');

    process.exit(0);
});
