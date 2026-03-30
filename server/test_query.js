require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const users = await User.find({
        role: { $nin: ['admin', 'superadmin'] },
        username: { $nin: ['Admin', 'ADMIN', 'superadmin', 'TEST', 'test', 'admin1'] }
    });
    console.log(users.map(u => u.username));
    
    // Also, find out WHY IQBL or TEXLINK might be missing?
    const iqbl = await User.findOne({ username: 'IQBL' });
    console.log('IQBL:', iqbl ? { username: iqbl.username, role: iqbl.role, createdBy: iqbl.createdBy } : 'Not found');
    
    // Check if the dashboard code filter depends on something we modified in AccountCodes?
    // No, dashboard is just auth/users. The query is literally what we just ran.
    process.exit(0);
});
