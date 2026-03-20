require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    console.log('=== ALL COLLECTIONS ===');
    for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`  ${col.name}: ${count} records`);
    }
    
    // Check the 2 GL entries
    const glEntries = await db.collection('journalentries').find({}).toArray();
    console.log('\n=== 2 GL Entries ===');
    glEntries.forEach(e => {
        console.log(' ', e.date, '|', e.description, '| DR:', e.debitAmount, '| CR:', e.creditAmount, '| company:', e.companyCode);
    });
    
    // Check users
    const users = await db.collection('users').find({}, { projection: { email: 1, companyCode: 1, role: 1 } }).toArray();
    console.log('\n=== USERS ===');
    users.forEach(u => console.log(' ', u.email, '| company:', u.companyCode, '| role:', u.role));
    
    mongoose.disconnect();
}).catch(e => console.error('DB error:', e.message));
