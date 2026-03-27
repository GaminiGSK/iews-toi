/**
 * fix_admin1_role.js
 * One-shot script to set admin1's role to 'admin' in MongoDB.
 * Run from: e:\Antigravity\TOI\server
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixAdmin1() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
        console.log('[Fix] MongoDB Connected');

        // Find admin1 by loginCode 111111
        const admin1ByCode = await User.findOne({ loginCode: '111111' });
        if (admin1ByCode) {
            console.log(`[Fix] Found user with code 111111: username="${admin1ByCode.username}" role="${admin1ByCode.role}"`);
            const result = await User.updateOne(
                { _id: admin1ByCode._id },
                { $set: { role: 'admin' } }
            );
            console.log(`[Fix] Updated: ${result.modifiedCount} record(s) → role now 'admin'`);
        } else {
            console.log('[Fix] No user found with loginCode 111111. Checking for username "admin1"...');
            const admin1ByName = await User.findOne({ username: { $regex: /^admin1$/i } });
            if (admin1ByName) {
                console.log(`[Fix] Found user by name: username="${admin1ByName.username}" role="${admin1ByName.role}"`);
                await User.updateOne({ _id: admin1ByName._id }, { $set: { role: 'admin' } });
                console.log(`[Fix] Updated role → 'admin'`);
            } else {
                console.log('[Fix] No user found. Listing all users:');
                const all = await User.find({}, { username: 1, loginCode: 1, role: 1 });
                all.forEach(u => console.log(`  - ${u.username} | code: ${u.loginCode} | role: ${u.role}`));
            }
        }

        await mongoose.disconnect();
        console.log('[Fix] Done.');
    } catch (err) {
        console.error('[Fix] Error:', err.message);
        process.exit(1);
    }
}

fixAdmin1();
