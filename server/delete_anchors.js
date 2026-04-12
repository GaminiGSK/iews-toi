// One-time cleanup: delete all AUDIT-ANCHOR journal entries from ALL companies
// Run with: node server/delete_anchors.js
require('dotenv').config({ path: 'e:\\Antigravity\\TOI\\server\\.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const JournalEntry = require('./models/JournalEntry');
    
    const result = await JournalEntry.deleteMany({
        reference: { $in: ['AUDIT-ANCHOR-001', 'AUDIT-ANCHOR-002'] }
    });

    console.log(`✅ Deleted ${result.deletedCount} AUDIT-ANCHOR journal entries from all companies.`);
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
