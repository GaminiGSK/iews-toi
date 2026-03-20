require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Show ALL unique accountCode ObjectIds and their code strings
    const txList = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    
    const acMap = {};
    txList.forEach(t => {
        const acId = t.accountCode ? t.accountCode.toString() : 'NULL';
        const code = t.code || 'NO_CODE';
        const key = `${acId}___${code}`;
        if (!acMap[key]) acMap[key] = { acId, code, count: 0, in: 0, out: 0 };
        acMap[key].count++;
        acMap[key].in += t.moneyIn || 0;
        acMap[key].out += t.moneyOut || 0;
    });
    
    console.log('=== ObjectId → code string mapping in transactions ===');
    Object.values(acMap).sort((a,b) => a.code.localeCompare(b.code)).forEach(v => {
        console.log(`  AccountCode ObjectId: ${v.acId} | code string: "${v.code}" | count: ${v.count} | in: $${v.in.toFixed(2)} | out: $${v.out.toFixed(2)}`);
    });
    
    // Also map ObjectId to AccountCode document code
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const idToCode = {};
    accountCodes.forEach(ac => idToCode[ac._id.toString()] = ac.code + ' - ' + ac.description);
    
    console.log('\n=== What each ObjectId ACTUALLY IS ===');
    Object.values(acMap).forEach(v => {
        const real = idToCode[v.acId] || 'NOT FOUND IN ACCOUNTCODES';
        if (v.acId !== 'NULL') {
            console.log(`  ${v.acId} → AccountCode doc: ${real}`);
        }
    });
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
