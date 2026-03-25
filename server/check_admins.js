require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const AuditSession = require('./models/AuditSession'); // If session tracking exists
    const User = require('./models/User');
    const all = await User.find({ role: 'admin' });
    console.log(all.map(u => ({ u: u.username, id: u._id })));
    process.exit(0);
});
