const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixMapping() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.connection.db.collection('users');

        console.log('Updating GKSMART company code to GK_SMART_AI...');
        const res = await User.updateOne(
            { username: 'GKSMART' },
            { $set: { companyCode: 'GK_SMART_AI' } }
        );

        console.log(`✅ Updated ${res.modifiedCount} user.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
fixMapping();
