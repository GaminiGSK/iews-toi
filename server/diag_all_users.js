/**
 * TEMPORARY DIAGNOSTIC ROUTE — add to server.js or a temp file
 * GET /api/debug/whoowns
 * Requires superadmin token
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Try to load from the server's env
const MONGO_URI = process.env.MONGODB_URI;

async function run() {
    await mongoose.connect(MONGO_URI);
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    
    const allUsers = await User.find({}).select('username role companyCode createdBy').lean();
    
    console.log('\n====== ALL USERS IN DATABASE ======');
    allUsers.forEach(u => {
        console.log(`  username:${u.username} | role:${u.role} | companyCode:${u.companyCode} | createdBy:${u.createdBy || 'null'}`);
    });
    
    console.log('\nTotal users:', allUsers.length);
    process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
