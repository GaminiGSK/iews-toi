require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    
    let query = {
        role: { $in: ['unit', 'user'] },
        username: { $nin: ['Admin', 'ADMIN'] }
    };
    query.createdBy = '69c14dd89f5873871ce045f7';
    
    const users = await User.find(query).select('username companyName loginCode createdAt role createdBy');
    console.log(users);
    process.exit(0);
});
