require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Get REAL totals directly from transactions by account code
    const totals = await db.collection('transactions').aggregate([
        { $match: { companyCode: 'GK_SMART_AI' } },
        { $group: {
            _id: '$code',
            totalMoneyIn: { $sum: '$moneyIn' },
            totalMoneyOut: { $sum: '$moneyOut' },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('=== ACTUAL TOTALS BY ACCOUNT CODE (from transactions) ===');
    totals.forEach(t => {
        console.log(`  ${t._id || 'NO CODE'}: Count=${t.count} | In=$${t.totalMoneyIn.toFixed(2)} | Out=$${t.totalMoneyOut.toFixed(2)}`);
    });
    
    // Grand totals
    const grand = await db.collection('transactions').aggregate([
        { $match: { companyCode: 'GK_SMART_AI' } },
        { $group: { _id: null, totalIn: { $sum: '$moneyIn' }, totalOut: { $sum: '$moneyOut' }, count: { $sum: 1 } }}
    ]).toArray();
    
    if (grand[0]) {
        console.log(`\nGRAND TOTAL: ${grand[0].count} tx | In=$${grand[0].totalIn.toFixed(2)} | Out=$${grand[0].totalOut.toFixed(2)} | Net=$${(grand[0].totalIn - grand[0].totalOut).toFixed(2)}`);
    }
    
    // Show 30100 transactions specifically
    const cap = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI', code: '30100' }).sort({ date: 1 }).toArray();
    console.log(`\n=== 30100 Share Capital transactions (${cap.length} total) ===`);
    cap.forEach(t => {
        const d = new Date(t.date).toISOString().substring(0, 10);
        console.log(`  ${d} | In=$${t.moneyIn || 0} | Out=$${t.moneyOut || 0} | ${t.description?.substring(0, 60)}`);
    });
    
    // Show 10110 transactions
    const cash = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI', code: '10110' }).sort({ date: 1 }).toArray();
    console.log(`\n=== 10110 Cash transactions (${cash.length} total) ===`);
    cash.forEach(t => {
        const d = new Date(t.date).toISOString().substring(0, 10);
        console.log(`  ${d} | In=$${t.moneyIn || 0} | Out=$${t.moneyOut || 0} | ${t.description?.substring(0, 60)}`);
    });
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
