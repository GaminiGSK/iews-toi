require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Check how many transactions have account codes
    const withCode = await db.collection('transactions').countDocuments({ 
        companyCode: 'GK_SMART_AI', 
        code: { $exists: true, $ne: null, $ne: '' } 
    });
    const withoutCode = await db.collection('transactions').countDocuments({ 
        companyCode: 'GK_SMART_AI', 
        $or: [{ code: null }, { code: '' }, { code: { $exists: false } }]
    });
    
    console.log('Transactions WITH account code:', withCode);
    console.log('Transactions WITHOUT account code:', withoutCode);
    
    // Sample a few with codes
    const samples = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI',
        code: { $exists: true, $ne: null }
    }).limit(5).toArray();
    
    console.log('\nSample transactions with codes:');
    samples.forEach(t => {
        console.log(` ${t.date ? t.date.toISOString().substring(0,10) : '?'} | code: ${t.code} | amt: ${t.amount} | in: ${t.moneyIn} | out: ${t.moneyOut} | ${t.description?.substring(0,50)}`);
    });
    
    // Check if any GL entries exist for GK_SMART_AI
    const glCount = await db.collection('journalentries').countDocuments({ companyCode: 'GK_SMART_AI' });
    console.log('\nGL entries for GK_SMART_AI:', glCount);
    
    mongoose.disconnect();
}).catch(e => console.error('DB error:', e.message));
