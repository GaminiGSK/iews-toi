require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Check what accountCode ObjectId the 30100 code has
    const ac30100 = await db.collection('accountcodes').findOne({ code: '30100', companyCode: 'GK_SMART_AI' });
    const ac10110 = await db.collection('accountcodes').findOne({ code: '10110', companyCode: 'GK_SMART_AI' });
    
    console.log('30100 account doc:', JSON.stringify(ac30100, null, 2));
    console.log('10110 account doc:', JSON.stringify(ac10110, null, 2));
    
    // Check what the transactions store in accountCode vs code fields
    const tx30100Sample = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI', code: '30100' 
    }).toArray();
    
    console.log('\n30100 transactions accountCode field:');
    tx30100Sample.forEach(t => console.log(' code:', t.code, '| accountCode:', t.accountCode, '| moneyIn:', t.moneyIn, '| moneyOut:', t.moneyOut));
    
    // Check what field the GL module (bank statements route) filters by
    // Look at one of the 10110 transactions to see the accountCode ObjectId
    const tx10110Sample = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI', code: '10110' 
    }).limit(3).toArray();
    
    console.log('\n10110 transactions:');
    tx10110Sample.forEach(t => console.log(' code:', t.code, '| accountCode ObjectId:', t.accountCode, '| moneyIn:', t.moneyIn));
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
