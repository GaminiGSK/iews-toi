require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Build code string → ObjectId map from accountcodes collection  
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const codeToId = {};
    accountCodes.forEach(ac => codeToId[ac.code] = ac._id);
    
    console.log('Account code → ObjectId map:');
    Object.entries(codeToId).sort((a,b) => a[0].localeCompare(b[0])).forEach(([code, id]) => {
        console.log(`  ${code} → ${id}`);
    });
    
    // Get all transactions with a code string
    const transactions = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI',
        code: { $exists: true, $nin: [null, ''] }
    }).toArray();
    
    console.log(`\nFixing accountCode ObjectId for ${transactions.length} transactions...`);
    
    const ops = [];
    let fixed = 0;
    let notFound = 0;
    
    for (const t of transactions) {
        const correctId = codeToId[t.code];
        if (!correctId) {
            console.log(`  WARNING: code "${t.code}" not in accountcodes for tx ${t._id}`);
            notFound++;
            continue;
        }
        
        const currentAcId = t.accountCode ? t.accountCode.toString() : 'null';
        const correctIdStr = correctId.toString();
        
        if (currentAcId !== correctIdStr) {
            ops.push({
                updateOne: {
                    filter: { _id: t._id },
                    update: { $set: { accountCode: correctId } }
                }
            });
            fixed++;
        }
    }
    
    if (ops.length > 0) {
        await db.collection('transactions').bulkWrite(ops);
        console.log(`✅ Fixed accountCode ObjectId for ${fixed} transactions`);
    } else {
        console.log('All accountCode ObjectIds already correct');
    }
    
    if (notFound > 0) {
        console.log(`⚠️  ${notFound} transactions had codes not found in accountcodes`);
    }
    
    // Verify final state
    const finalTotals = await db.collection('transactions').aggregate([
        { $match: { companyCode: 'GK_SMART_AI' } },
        { $group: { _id: '$code', totalIn: { $sum: '$moneyIn' }, totalOut: { $sum: '$moneyOut' }, count: { $sum: 1 } }},
        { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n=== FINAL VERIFIED TOTALS ===');
    finalTotals.forEach(t => {
        if (t.totalIn > 0 || t.totalOut > 0)
            console.log(`  ${t._id}: count=${t.count} | In=$${t.totalIn?.toFixed(2)} | Out=$${t.totalOut?.toFixed(2)}`);
    });
    
    const totalIn = finalTotals.reduce((s, t) => s + (t.totalIn || 0), 0);
    const totalOut = finalTotals.reduce((s, t) => s + (t.totalOut || 0), 0);
    console.log(`\n  TOTAL: In=$${totalIn.toFixed(2)} | Out=$${totalOut.toFixed(2)} | Net=$${(totalIn - totalOut).toFixed(2)}`);
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
