require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    // Find admin1
    const admin1 = await User.findOne({ username: 'admin1' }).lean();
    if (!admin1) { console.log('admin1 not found'); process.exit(1); }
    console.log('admin1 id:', admin1._id, '| role:', admin1.role, '| companyCode:', admin1.companyCode);

    // Find ALL non-superadmin users to understand the full picture
    const allUnits = await User.find({ role: { $in: ['unit', 'user', 'admin'] } })
        .select('username role companyCode createdBy').lean();

    console.log('\n===== ALL UNITS IN DB =====');
    allUnits.forEach(u => {
        const createdBy = u.createdBy ? u.createdBy.toString() : 'null';
        const isAdmin1Unit = createdBy === admin1._id.toString();
        console.log(`  ${isAdmin1Unit ? '✓' : ' '} ${u.username} | role:${u.role} | createdBy:${createdBy}`);
    });

    // Specifically find units where createdBy = admin1._id
    const admin1Units = await User.find({ createdBy: admin1._id }).select('username role companyCode').lean();
    console.log('\n===== UNITS WITH createdBy = admin1 =====');
    admin1Units.forEach(u => console.log(' ', u.username, '|', u.role, '|', u.companyCode));
    console.log('Total:', admin1Units.length);

    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
