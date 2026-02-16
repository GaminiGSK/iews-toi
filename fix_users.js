const mongoose = require('./server/node_modules/mongoose');
const User = require('./server/models/User');

const MONGODB_URI = 'mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/test?appName=Cluster0';

async function fixUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        // 1. Remove corrupted user entries (missing username)
        const deleted = await User.deleteMany({ username: { $exists: false } });
        console.log(`Deleted ${deleted.deletedCount} corrupted user records.`);

        // 2. Ensure Master Admin exists
        const admin = await User.findOneAndUpdate(
            { username: 'Admin' },
            {
                role: 'admin',
                loginCode: '999999',
                companyCode: 'ADM_001',
                password: 'placeholder_password', // server requires a password field but auth uses loginCode
                companyName: 'GK System Administrator'
            },
            { upsert: true, new: true }
        );
        console.log('Verified Admin User:', admin.username, 'Code:', admin.loginCode);

        // 3. Ensure Master User (GKSMART) exists
        const gksmart = await User.findOneAndUpdate(
            { username: 'GKSMART' },
            {
                role: 'user',
                loginCode: '666666',
                companyCode: 'GK_SMART_AI',
                password: 'placeholder_password',
                companyName: 'GK SMART & Ai User'
            },
            { upsert: true, new: true }
        );
        console.log('Verified User account:', gksmart.username, 'Code:', gksmart.loginCode);

        process.exit(0);
    } catch (err) {
        console.error('Error fixing users:', err);
        process.exit(1);
    }
}

fixUsers();
