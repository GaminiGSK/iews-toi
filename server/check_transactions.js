require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Check transactions collection structure
    const txSample = await db.collection('transactions').find({}).limit(5).toArray();
    console.log('=== TRANSACTIONS SAMPLE ===');
    txSample.forEach(t => {
        console.log(JSON.stringify(t, null, 2).substring(0, 400));
        console.log('---');
    });
    
    // Get distinct companies
    const txCompanies = await db.collection('transactions').distinct('companyCode');
    console.log('TX company codes:', txCompanies);
    
    // Count by company
    for (const c of txCompanies) {
        const cnt = await db.collection('transactions').countDocuments({ companyCode: c });
        const yr2025 = await db.collection('transactions').countDocuments({ 
            companyCode: c,
            date: { $gte: new Date('2025-01-01'), $lte: new Date('2025-12-31') }
        });
        console.log(`  ${c}: ${cnt} total, ${yr2025} in 2025`);
    }
    
    // Check companyprofiles
    const profiles = await db.collection('companyprofiles').find({}).toArray();
    console.log('\n=== COMPANY PROFILES ===');
    profiles.forEach(p => console.log(' ', p.companyCode, '|', p.nameEn || p.companyName, '| company:', p.companyCode));
    
    mongoose.disconnect();
}).catch(e => console.error('DB error:', e.message));
