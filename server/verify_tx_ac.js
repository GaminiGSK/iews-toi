require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const axios = require('axios');

// Test the trial-balance API directly to see what the FS page is actually receiving
// First check that accountCode ObjectIds are correct in the transactions

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Check accountCode field in transactions - is it populated to correct codes?
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const idToCode = {}, codeToId = {};
    accountCodes.forEach(ac => { idToCode[ac._id.toString()] = ac.code; codeToId[ac.code] = ac._id.toString(); });
    
    const transactions = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    
    console.log('=== TRANSACTION ACCOUNTCODE FIELD VERIFICATION ===');
    let correct = 0, wrong = 0, missing = 0;
    
    const summary = {};
    for (const t of transactions) {
        if (!t.accountCode) { missing++; continue; }
        const acId = t.accountCode.toString();
        const resolvedCode = idToCode[acId];
        const codeStr = t.code;
        
        if (!resolvedCode) { wrong++; console.log(`  MISSING: accountCode ObjectId ${acId} not in accountcodes`); continue; }
        if (resolvedCode !== codeStr) {
            wrong++;
            console.log(`  MISMATCH: tx ${t._id} | code="${codeStr}" but accountCode resolves to "${resolvedCode}"`);
        } else {
            correct++;
        }
        
        if (!summary[codeStr]) summary[codeStr] = { count: 0, in: 0, out: 0 };
        summary[codeStr].count++;
        summary[codeStr].in += t.moneyIn || 0;
        summary[codeStr].out += t.moneyOut || 0;
    }
    
    console.log(`\n✅ Correct: ${correct} | ❌ Mismatch: ${wrong} | ⚠️ Missing: ${missing}`);
    console.log('\nExpected FS output (from transactions via populate):');
    Object.entries(summary).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([code, v]) => {
        if (v.in > 0 || v.out > 0)
            console.log(`  ${code}: count=${v.count} | In=$${v.in.toFixed(2)} | Out=$${v.out.toFixed(2)}`);
    });
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
