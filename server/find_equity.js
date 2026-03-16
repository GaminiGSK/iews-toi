require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const AccountCode = require('./models/AccountCode');
    
    const codes = await AccountCode.find({}).lean();
    codes.forEach(c => {
        if (/capital|equity|retained/i.test(c.description)) {
            console.log(c.code, c.description, c._id);
        }
    });
    
    process.exit(0);
});
