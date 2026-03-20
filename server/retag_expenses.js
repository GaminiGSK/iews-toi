require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Get all corrupted expense transactions (now wrongly tagged as 17270)
    const expensesTx = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI', code: '17270' 
    }).toArray();
    
    console.log(`Re-tagging ${expensesTx.length} expense transactions by description pattern...`);
    
    const ops = [];
    
    for (const t of expensesTx) {
        const desc = (t.description || '').toLowerCase();
        let newCode = '61241'; // default: Business Register / drawings
        
        // OTT = International transfers to GGMT = Computer purchases (17250)
        if (desc.includes('ott single') || 
            (desc.includes('international funds transfer') && desc.includes('ggmt'))) {
            newCode = '17250'; // COST OF COMPUTER / Tech assets
        }
        // OTT Charges / Cable / Commission / Bank fees = Bank Charge (61220)
        else if (desc.includes('ott charge') || 
                 desc.includes('cable fee') || 
                 desc.includes('int withhold tax') ||
                 desc.includes('comm for trf') ||
                 desc.includes('withholding tax')) {
            newCode = '61220'; // BANK CHARGE
        }
        // Arakawa = Office Furniture (17230)
        else if (desc.includes('arakawa')) {
            newCode = '17230'; // COST OF FURNITURE
        }
        // Tax payment = (61041) Office Supply / Tax
        else if (desc.includes('tax revenue collection') || 
                 desc.includes('tax payment from gk smart') ||
                 desc.includes('merchant installation') ||
                 desc.includes('apollo institute')) {
            newCode = '61041'; // Office Supply
        }
        // FUNDS TRANSFERRED TO GUNASINGHA = Capital drawings (61241)
        else if (desc.includes('funds transferred to gunasingha') ||
                 desc.includes('funds transferred to') && desc.includes('gamini')) {
            newCode = '61241'; // Business Register / Capital drawings
        }
        // Transfers to DEZIREKONNECTION = International transfers (17250)
        else if (desc.includes('dezirekonnection')) {
            newCode = '17250'; // COST OF COMPUTER / Tech assets (OTT transfer)
        }
        // Transfer to Gunasingha in July (personal) = 61241
        else {
            newCode = '61241'; // Default: Business expense / drawings
        }
        
        ops.push({
            updateOne: {
                filter: { _id: t._id },
                update: { $set: { code: newCode } }
            }
        });
        
        console.log(`  ${new Date(t.date).toISOString().substring(0,10)} | $${t.moneyOut} → ${newCode} | ${t.description?.substring(0,60)}`);
    }
    
    await db.collection('transactions').bulkWrite(ops);
    console.log(`\n✅ Re-tagged ${ops.length} transactions`);
    
    // Show final totals by code
    const totals = await db.collection('transactions').aggregate([
        { $match: { companyCode: 'GK_SMART_AI' } },
        { $group: { _id: '$code', totalIn: { $sum: '$moneyIn' }, totalOut: { $sum: '$moneyOut' }, count: { $sum: 1 } }},
        { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n=== FINAL TRANSACTION TOTALS BY CODE ===');
    totals.forEach(t => {
        if (t.totalIn > 0 || t.totalOut > 0)
            console.log(`  ${t._id}: count=${t.count} | In=$${t.totalIn?.toFixed(2)} | Out=$${t.totalOut?.toFixed(2)}`);
    });
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
