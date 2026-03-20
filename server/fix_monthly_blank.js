require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const codeToId = {};
    accountCodes.forEach(ac => { codeToId[ac.code] = ac._id; });
    
    const transactions = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    
    console.log(`=== CHECK accountCode field types ===`);
    let types = {};
    transactions.forEach(t => {
        const type = t.accountCode ? t.accountCode.constructor.name : 'null';
        if (!types[type]) types[type] = 0;
        types[type]++;
    });
    console.log('Types found:', types);

    // Check: does the accountCode ObjectId actually match any _id in accountcodes?
    let matched = 0, unmatched = 0, missing = 0;
    const unmatchedSample = [];
    transactions.forEach(t => {
        if (!t.accountCode) { missing++; return; }
        const acId = t.accountCode.toString();
        const found = accountCodes.find(ac => ac._id.toString() === acId);
        if (found) matched++;
        else { unmatched++; if (unmatchedSample.length < 5) unmatchedSample.push({ acId, code: t.code, desc: t.description?.substring(0,40) }); }
    });
    console.log(`\nMatched to accountcodes._id: ${matched} | Unmatched: ${unmatched} | No accountCode: ${missing}`);
    if (unmatchedSample.length) {
        console.log('\nUnmatched samples:');
        unmatchedSample.forEach(s => console.log(`  accountCode=${s.acId} | code=${s.code} | desc=${s.desc}`));
    }
    
    // Fix: ensure all accountCode fields are proper ObjectIds matching the code string
    if (unmatched > 0) {
        console.log(`\n🔧 Fixing ${unmatched} unmatched accountCode ObjectIds...`);
        const ops = [];
        transactions.forEach(t => {
            if (!t.accountCode || !t.code) return;
            const found = accountCodes.find(ac => ac._id.toString() === t.accountCode.toString());
            if (!found && codeToId[t.code]) {
                ops.push({
                    updateOne: {
                        filter: { _id: t._id },
                        update: { $set: { accountCode: codeToId[t.code] } }
                    }
                });
            }
        });
        if (ops.length > 0) {
            await db.collection('transactions').bulkWrite(ops);
            console.log(`✅ Fixed ${ops.length} transactions`);
        }
    }
    
    // Final verify
    const after = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI', accountCode: { $exists: true } }).toArray();
    let ok = 0, bad = 0;
    after.forEach(t => {
        const found = accountCodes.find(ac => ac._id.toString() === t.accountCode.toString());
        if (found) ok++; else bad++;
    });
    console.log(`\n✅ After fix: ${ok} correct | ${bad} bad accountCode ObjectIds`);
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
