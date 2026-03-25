require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    
    // Find admin1 directly
    const admin = await User.findOne({ username: 'admin1' });
    console.log("admin1 ID:", admin._id, "Role:", admin.role);

    // Exact query logic from auth.js line 174
    let query = {
        role: { $in: ['unit', 'user'] },
        username: { $nin: ['Admin', 'ADMIN'] }
    };
    
    if (admin.role === 'admin') {
        query.createdBy = admin._id.toString(); // JWT gives a string ID
    }
    
    console.log("QUERY EXECUTING:", JSON.stringify(query));

    const users = await User.find(query).select('username companyName loginCode createdAt role createdBy');
    console.log("RESULTS COUNT:", users.length);
    console.log("RESULTS:", users.map(u => u.username));

    process.exit(0);
});
