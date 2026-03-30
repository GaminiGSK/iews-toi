require('dotenv').config();
const mongoose = require('mongoose');

async function fixUnits() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = require('./models/User');

        // 1. Find admin1 ObjectId
        const admin1 = await User.findOne({ username: 'admin1' });
        if (!admin1) {
            console.error('admin1 not found!');
            process.exit(1);
        }

        // 2. The target explicit units the user requested (plus other known units)
        // Note: the DB has 'coco' (lowercase), 'ARAKAN', etc. We use regex to be safe.
        const unitNames = ['GKSMART', 'TEXLINK', 'RSW', 'COCO', 'ARAKAN', 'CHANG ZHENG', 'IQBL'];
        const matchRegexes = unitNames.map(name => new RegExp('^' + name + '$', 'i'));

        // 3. Perform the bulk update for these specific users (plus any existing 'unit')
        const result1 = await User.updateMany(
            { username: { $in: matchRegexes } }, 
            { 
                $set: { 
                    role: 'unit',
                    createdBy: admin1._id 
                } 
            }
        );
        console.log(`Updated ${result1.modifiedCount} explicitly named units to be role 'unit' and assigned to admin1.`);

        // Also sweep any other existing units and re-assign to admin1 just in case, except test users
        const result2 = await User.updateMany(
            { role: 'unit', username: { $nin: [/test/i, /admin/i] }, createdBy: { $ne: admin1._id } },
            { $set: { createdBy: admin1._id } }
        );
        console.log(`Re-assigned ${result2.modifiedCount} other existing units to admin1.`);

        // Verify that Admin 666666 is superadmin
        await User.updateOne(
            { username: { $in: ['Admin', 'ADMIN' ] } },
            { $set: { role: 'superadmin', loginCode: '666666' } }
        );

        console.log('Fixed unit roles and assignments successfully.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixUnits();
