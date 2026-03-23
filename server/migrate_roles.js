/**
 * migrate_roles.js
 * Safe, non-destructive migration:
 * - Upgrades 'Admin' user → superadmin role
 * - Keeps all 'user' roles as-is (backward compat)
 * - Sets createdBy = Admin._id for GKSMART, RSW, TEXLINK
 * Run: node server/migrate_roles.js
 */
require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const db = mongoose.connection.db;
    const users = db.collection('users');

    console.log('\n=== RBAC MIGRATION — Safe Mode ===\n');

    // Step 1: Upgrade 'Admin' (username=Admin, role=admin) → superadmin
    const adminUser = await users.findOne({ username: { $regex: /^admin$/i } });
    if (!adminUser) { console.log('❌ Admin user not found'); process.exit(1); }
    console.log(`Found Admin user: ${adminUser.username} (role: ${adminUser.role})`);

    if (adminUser.role !== 'superadmin') {
        await users.updateOne(
            { _id: adminUser._id },
            { $set: { role: 'superadmin' } }
        );
        console.log('✅ Admin → superadmin');
    } else {
        console.log('✅ Already superadmin — skipping');
    }

    // Step 2: Assign GK SMART, RSW, TEXLINK createdBy = Admin._id
    const units = ['GKSMART', 'RSW', 'TEXLINK'];
    for (const name of units) {
        const unit = await users.findOne({ username: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (!unit) { console.log(`⚠️  Unit ${name} not found — skipping`); continue; }
        await users.updateOne(
            { _id: unit._id },
            { $set: { createdBy: adminUser._id } }
        );
        console.log(`✅ ${name} → createdBy = Admin._id`);
    }

    // Step 3: Status report
    console.log('\n=== Final Role Distribution ===');
    const roleCounts = await users.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray();
    roleCounts.forEach(r => console.log(`  ${r._id || 'null'}: ${r.count} users`));

    console.log('\n✅ Migration complete — no data deleted, all existing data preserved');
    process.exit(0);
}

run().catch(e => { console.error('Migration Error:', e.message); process.exit(1); });
