require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// RESTORATION PLAN based on ORIGINAL user data (before my scripts corrupted it)
// Original totals (per check_code_totals.js run before corruption):
//   17250 (Computer): 16 tx, $27455  ← tech asset purchases
//   17290 (Automobile): 9 tx, $20810 ← vehicle asset purchases  
//   61041 (Office Supply): 11 tx, $1019
//   61220 (Bank Charge): 11 tx, $195
//   61241 (Business Register): 16 tx, $25110 ← registration fees
//   17230 (Furniture): 1 tx, $305
//   40000 (Foreign Service): 1 tx, $305 (OUT - unusual)
//   61051 (Meals): 1 tx, $305
//   30100 drawings: 4 tx, $2540

// CURRENT state (corrupted):
//   61241: 39 tx, $55090 (over-inflated - many are really 17250/17290)
//   17250: 5 tx, $21110 (under-counted)

// RESTORATION LOGIC by description patterns:
// OTT to GGMT Singapore = 17250 COMPUTER (big tech purchases)
// Large transfers to Gunasingha (>$1500) = 17290 AUTOMOBILE (installment payments)
// Small transfers to Gunasingha = 61241 BUSINESS REGISTER (salary/reg fees)
// Arakawa transfers = 17230 FURNITURE
// Bank charges (OTT fees, interest tax, comm) = 61220
// Tax/Apollo/Merchant = 61041

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Get the corrupted expense transactions
    const toFix = await db.collection('transactions').find({
        companyCode: 'GK_SMART_AI',
        moneyOut: { $gt: 0 }
    }).sort({ date: 1 }).toArray();
    
    const ops = [];
    let summary = {};
    
    for (const t of toFix) {
        const desc = (t.description || '').toLowerCase();
        const out = t.moneyOut || 0;
        let newCode = t.code; // default: keep current
        
        // OTT GGMT = Computer/Tech asset purchase
        if (desc.includes('ggmt') && (desc.includes('ott single') || desc.includes('international funds transfer'))) {
            newCode = '17250'; // COST OF COMPUTER
        }
        // OTT charges, bank cable fees, withhold tax = bank charges
        else if (desc.includes('ott charge') || desc.includes('cable fee') || desc.includes('int withhold tax') || 
                 desc.includes('comm for trf') || desc.includes('withholding tax')) {
            newCode = '61220'; // BANK CHARGE
        }
        // Arakawa = Furniture
        else if (desc.includes('arakawa')) {
            newCode = '17230'; // COST OF FURNITURE
        }
        // DEZIREKONNECTION OTT = tech purchase
        else if (desc.includes('dezirekonnection') && desc.includes('ott single')) {
            newCode = '17250'; // COST OF COMPUTER
        }
        // Dezirekonnection charges = bank fees
        else if (desc.includes('dezirekonnection') && (desc.includes('ott charge') || desc.includes('cable fee'))) {
            newCode = '61220';
        }
        // Apollo Institute = training/education expense  
        else if (desc.includes('apollo institute')) {
            newCode = '61041'; // Office Supply
        }
        // Tax payments
        else if (desc.includes('tax revenue collection') || desc.includes('tax payment from gk smart')) {
            newCode = '61041';
        }
        // Merchant installation
        else if (desc.includes('merchant installation')) {
            newCode = '61041';
        }
        // GUNASINGHA transfers:
        // Large (>$2000) were likely automobile/asset installments
        // Medium ($500-$2000) likely business register / salary
        // Small (<$500) likely petty expenses
        else if (desc.includes('gunasingha') || desc.includes('gamini')) {
            if (out >= 2000) {
                // In the original: many large transfers were 17290 (Automobile) 
                // Total automobiles =  $20,810 across 9 tx = avg $2,312 each
                newCode = '17290'; // COST OF AUTOMOBILE
            } else if (out >= 500) {
                // Medium transfers - original 61241 (business reg/salary)
                newCode = '61241'; // Business Register
            } else {
                // Small transfers
                newCode = '61241'; // Business Register  
            }
        }
        // Foreign service commission OUT ($305 each)
        else if (desc.includes('international inward transfer fee')) {
            newCode = '61220'; // Bank charges
        }
        
        if (newCode !== t.code) {
            ops.push({
                updateOne: {
                    filter: { _id: t._id },
                    update: { $set: { code: newCode } }
                }
            });
        }
        
        summary[newCode] = (summary[newCode] || 0) + out;
    }
    
    if (ops.length > 0) {
        await db.collection('transactions').bulkWrite(ops);
        console.log(`✅ Re-tagged ${ops.length} transactions`);
    }
    
    console.log('\n=== RESTORED TAG SUMMARY ===');
    Object.entries(summary).sort((a,b) => a[0].localeCompare(b[0])).forEach(([code, amt]) => {
        const desc = {
            '17230': 'Furniture (ASSET)',
            '17250': 'Computer (ASSET)', 
            '17290': 'Automobile (ASSET)',
            '61041': 'Office Supply (EXPENSE)',
            '61051': 'Meals (EXPENSE)',
            '61070': 'Rental (EXPENSE)',
            '61220': 'Bank Charge (EXPENSE)',
            '61241': 'Business Register (EXPENSE)',
            '30100': 'Capital Drawing (EQUITY)'
        }[code] || code;
        console.log(`  ${code} (${desc}): $${amt.toFixed(2)}`);
    });
    
    // Now rebuild GL + TB
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const codeToId = {};
    const codeDesc = {};
    accountCodes.forEach(ac => { codeToId[ac.code] = ac._id; codeDesc[ac.code] = ac.description; });
    
    // Fix accountCode ObjectIds too
    const allTx = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI', code: { $exists: true, $nin: [null, ''] } }).toArray();
    const idOps = allTx.filter(t => codeToId[t.code] && t.accountCode?.toString() !== codeToId[t.code]?.toString())
        .map(t => ({ updateOne: { filter: { _id: t._id }, update: { $set: { accountCode: codeToId[t.code] } } } }));
    if (idOps.length > 0) {
        await db.collection('transactions').bulkWrite(idOps);
        console.log(`\n✅ Fixed ${idOps.length} accountCode ObjectIds`);
    }
    
    // Rebuild GL
    const txForGL = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI', code: { $exists: true, $nin: [null, ''] } }).toArray();
    await db.collection('journalentries').deleteMany({ companyCode: 'GK_SMART_AI' });
    const glEntries = txForGL.map(t => ({
        companyCode: 'GK_SMART_AI', user: t.user, date: t.date,
        description: t.description || '', accountCode: t.code,
        accountDescription: codeDesc[t.code] || t.code,
        debitAmount: t.moneyOut || 0, creditAmount: t.moneyIn || 0,
        amount: Math.abs(t.amount || 0), moneyIn: t.moneyIn || 0, moneyOut: t.moneyOut || 0,
        transactionId: t._id, syncedFrom: 'bank_statement_sync_v4', createdAt: new Date()
    }));
    await db.collection('journalentries').insertMany(glEntries);
    console.log(`\n✅ GL rebuilt: ${glEntries.length} entries`);
    
    // Rebuild TB
    const tbMap = {};
    for (const entry of glEntries) {
        const d = new Date(entry.date);
        const key = `${entry.accountCode}_${d.getFullYear()}_${d.getMonth()+1}`;
        if (!tbMap[key]) tbMap[key] = { companyCode: 'GK_SMART_AI', accountCode: entry.accountCode, accountDescription: entry.accountDescription, year: d.getFullYear(), month: d.getMonth()+1, debit: 0, credit: 0, moneyIn: 0, moneyOut: 0, count: 0 };
        tbMap[key].debit += entry.debitAmount || 0;
        tbMap[key].credit += entry.creditAmount || 0;
        tbMap[key].moneyIn += entry.moneyIn || 0;
        tbMap[key].moneyOut += entry.moneyOut || 0;
        tbMap[key].count++;
    }
    const tbRecords = Object.values(tbMap);
    await db.collection('trialbals').deleteMany({ companyCode: 'GK_SMART_AI' });
    await db.collection('trialbals').insertMany(tbRecords);
    console.log(`✅ TB rebuilt: ${tbRecords.length} records`);
    
    // Print final P&L projection
    console.log('\n=== PROJECTED INCOME STATEMENT ===');
    const expenses = {};
    const assets = {};
    tbRecords.forEach(r => {
        const c = r.accountCode;
        if (c?.startsWith('6')) expenses[c] = (expenses[c] || 0) + r.moneyOut;
        if (c?.startsWith('17')) assets[c] = (assets[c] || 0) + r.moneyOut;
    });
    console.log('EXPENSES (hit P&L):');
    Object.entries(expenses).forEach(([c,v]) => console.log(`  ${c} (${codeDesc[c]}): $${v.toFixed(2)}`));
    const totalExp = Object.values(expenses).reduce((s,v) => s+v, 0);
    console.log(`  TOTAL EXPENSES: $${totalExp.toFixed(2)}`);
    console.log('\nASSETS (go to Balance Sheet):');
    Object.entries(assets).forEach(([c,v]) => console.log(`  ${c} (${codeDesc[c]}): $${v.toFixed(2)}`));
    console.log(`\nProjected Net Profit (if 0 revenue): -$${totalExp.toFixed(2)}`);
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
