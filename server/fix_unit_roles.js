/**
 * fix_unit_roles.js
 * Diagnoses and fixes units that have been assigned wrong roles.
 * TEXLINK was found with role 'admin' — it must be 'unit' to appear in the admin dashboard.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const FINANCIAL_UNITS = ['GKSMART', 'TEXLINK', 'RSW', 'COCO', 'ARAKAN', 'CHANG ZHENG'];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    
    console.log('\n========== CURRENT USER STATUS ==========');
    const allUsers = await User.find({}).select('username companyName role loginCode createdBy');
    allUsers.forEach(u => {
        const flag = FINANCIAL_UNITS.includes(u.username.toUpperCase()) && u.role !== 'unit' ? ' ❌ WRONG ROLE' : '';
        console.log(`  ${u.username} | role: ${u.role} | code: ${u.loginCode}${flag}`);
    });

    console.log('\n========== FIXING WRONG ROLES ==========');
    
    // Find admin1 to assign as creator
    const admin1 = await User.findOne({ username: 'admin1' });
    if (!admin1) {
        console.log('❌ admin1 not found! Cannot proceed.');
        process.exit(1);
    }
    console.log(`✅ admin1 found: ${admin1._id}`);

    // Fix any financial unit that has the wrong role
    const wrongRoleUnits = await User.find({
        username: { $in: FINANCIAL_UNITS },
        role: { $ne: 'unit' }
    });

    if (wrongRoleUnits.length === 0) {
        console.log('✅ All financial units already have correct role: unit');
    } else {
        for (const u of wrongRoleUnits) {
            console.log(`  Fixing ${u.username}: ${u.role} → unit`);
            u.role = 'unit';
            u.createdBy = admin1._id;
            await u.save();
            console.log(`  ✅ ${u.username} fixed`);
        }
    }

    // Also ensure all financial units point to admin1 as creator
    const updateResult = await User.updateMany(
        { username: { $in: FINANCIAL_UNITS } },
        { $set: { createdBy: admin1._id } }
    );
    console.log(`\n✅ Ensured all ${FINANCIAL_UNITS.length} units point to admin1. Updated: ${updateResult.modifiedCount}`);

    console.log('\n========== FINAL STATUS ==========');
    const finalUsers = await User.find({ username: { $in: FINANCIAL_UNITS } }).select('username role createdBy loginCode');
    finalUsers.forEach(u => {
        const isGood = u.role === 'unit';
        console.log(`  ${isGood ? '✅' : '❌'} ${u.username} | role: ${u.role} | code: ${u.loginCode}`);
    });

    console.log('\n✅ Done. Deploy not required — DB changes take effect immediately.');
    process.exit(0);
}).catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
});
