require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Check FS7 collection
    const fs7Count = await db.collection('fs7s').countDocuments();
    const fs7Sample = await db.collection('fs7s').find({}).limit(3).toArray();
    
    // Check TB collection
    const tbCount = await db.collection('trialbals').countDocuments();
    
    // Check GL entries count
    const glCount = await db.collection('journalentries').countDocuments();
    const gl2025 = await db.collection('journalentries').countDocuments({ 
        date: { $gte: new Date('2025-01-01'), $lte: new Date('2025-12-31') } 
    });
    
    // Check if there's a specific companyCode issue
    const companies = await db.collection('journalentries').distinct('companyCode');
    
    console.log('=== DB STATUS ===');
    console.log('FS7 records:', fs7Count);
    console.log('TB records:', tbCount);
    console.log('GL total:', glCount);
    console.log('GL 2025:', gl2025);
    console.log('Company codes in GL:', companies);
    
    if (fs7Sample.length > 0) {
        console.log('\nFS7 sample:');
        fs7Sample.forEach(s => {
            console.log(' companyCode:', s.companyCode, '| year:', s.year, '| month:', s.month);
            console.log('   totalAssets:', s.totalAssets, '| totalEquity:', s.totalEquity, '| totalLiabilities:', s.totalLiabilities);
        });
    }
    
    mongoose.disconnect();
});
