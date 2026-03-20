require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Show exactly what's in the Income Statement (expenses only)
    const expenseTx = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI',
        $or: [
            { code: { $regex: '^6' } },  // 6xxxx = expense codes
        ],
        moneyOut: { $gt: 0 }
    }).sort({ date: 1 }).toArray();
    
    console.log(`=== EXPENSE TRANSACTIONS (going to Income Statement) ===`);
    console.log(`Total: ${expenseTx.length} transactions\n`);
    
    let total = 0;
    expenseTx.forEach(t => {
        const d = new Date(t.date);
        const yr = d.getFullYear();
        if (yr === 2025) {
            console.log(`  ${d.toISOString().substring(0,10)} | ${t.code} | $${t.moneyOut} | ${t.description?.substring(0,70)}`);
            total += t.moneyOut || 0;
        }
    });
    console.log(`\n2025 Expense Total: $${total.toFixed(2)}`);
    
    // Compare income
    const incomeTx = await db.collection('transactions').find({
        companyCode: 'GK_SMART_AI',
        code: '30100',
        moneyIn: { $gt: 0 }
    }).toArray();
    
    const income2025 = incomeTx
        .filter(t => new Date(t.date).getFullYear() === 2025)
        .reduce((s, t) => s + (t.moneyIn || 0), 0);
    
    console.log(`\n=== INCOME (all tagged as 30100 Share Capital - NOT in P&L) ===`);
    console.log(`2025 Capital Injections from Gunasingha: $${income2025.toFixed(2)}`);
    console.log(`\n⚠️  PROBLEM: Capital in goes to EQUITY (Balance Sheet)`);
    console.log(`⚠️  PROBLEM: Many "expenses" are actually GUNASINGHA DRAWINGS or ASSET PURCHASES`);
    
    // What % of 61241 are Gunasingha transfers (owner drawings)?
    const drawings = await db.collection('transactions').find({
        companyCode: 'GK_SMART_AI',
        code: '61241',
        description: { $regex: 'GUNASINGHA|GAMINI', $options: 'i' }
    }).toArray();
    
    const drawings2025 = drawings.filter(t => new Date(t.date).getFullYear() === 2025);
    const drawingsTotal = drawings2025.reduce((s, t) => s + (t.moneyOut || 0), 0);
    
    console.log(`\n=== 61241 "Business Register" that are actually OWNER DRAWINGS ===`);
    console.log(`Count (2025): ${drawings2025.length} transactions totaling $${drawingsTotal.toFixed(2)}`);
    console.log(`These are "FUNDS TRANSFERRED TO GUNASINGHA" - owner taking money back`);
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
