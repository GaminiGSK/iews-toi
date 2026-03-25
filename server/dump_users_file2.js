require('dotenv').config();
const fs = require('fs');
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const all = await User.find({}, { companyCode: 1, username: 1, createdBy: 1, _id: 0 });
    fs.writeFileSync('C:\\tmp\\all_users.json', JSON.stringify(all, null, 2));
    process.exit(0);
});
