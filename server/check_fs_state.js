require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    const fs7Count = await db.collection('fs7s').countDocuments();
    const tbCount = await db.collection('trialbals').countDocuments();
    const glCount = await db.collection('journalentries').countDocuments();
    const gl2025 = await db.collection('journalentries').countDocuments({ 
        date: { $gte: new Date('2025-01-01'), $lte: new Date('2025-12-31') } 
    });
    const companies = await db.collection('journalentries').distinct('companyCode');
    
    console.log('=== DB STATUS ===');
    console.log('FS7 records:', fs7Count);
    console.log('TB records:', tbCount);
    console.log('GL total:', glCount);
    console.log('GL 2025:', gl2025);
    console.log('Company codes in GL:', companies);
    
    // Sample FS7
    const fs7Sample = await db.collection('fs7s').find({}).limit(5).toArray();
    if (fs7Sample.length > 0) {
        console.log('\nFS7 sample:');
        fs7Sample.forEach(s => {
            console.log(' companyCode:', s.companyCode, '| year:', s.year, '| month:', s.month);
            const ta = typeof s.totalAssets === 'object' ? JSON.stringify(s.totalAssets).substring(0,60) : s.totalAssets;
            console.log('   totalAssets:', ta);
        });
    } else {
        console.log('NO FS7 records found!');
    }
    
    mongoose.disconnect();
}).catch(e => console.error('DB error:', e.message));
