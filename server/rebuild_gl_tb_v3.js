require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // The code string field is the CORRECT account code (set by user via dropdown)
    // The accountCode ObjectId is stale/broken - IGNORE IT
    
    const transactions = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI',
        code: { $exists: true, $ne: null, $nin: [null, '', 'UNTAGGED'] }
    }).toArray();
    
    console.log(`Building correct GL from ${transactions.length} transactions using code string field...`);
    
    // Get account descriptions from accountcodes by CODE STRING (not ObjectId)
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const codeDesc = {};
    accountCodes.forEach(ac => codeDesc[ac.code] = ac.description);
    
    // Rebuild GL entries using the correct code string
    await db.collection('journalentries').deleteMany({ companyCode: 'GK_SMART_AI' });
    
    const glEntries = transactions.map(t => ({
        companyCode: 'GK_SMART_AI',
        user: t.user,
        date: t.date,
        description: t.description || '',
        accountCode: t.code,           // USE CODE STRING - correct
        accountDescription: codeDesc[t.code] || t.code,
        debitAmount: t.moneyOut || 0,
        creditAmount: t.moneyIn || 0,
        amount: Math.abs(t.amount || 0),
        moneyIn: t.moneyIn || 0,
        moneyOut: t.moneyOut || 0,
        transactionId: t._id,
        syncedFrom: 'bank_statement_sync_v3',
        createdAt: new Date()
    }));
    
    await db.collection('journalentries').insertMany(glEntries);
    console.log(`✅ GL synced: ${glEntries.length} entries`);
    
    // Rebuild TB - group by code string + year + month
    const tbMap = {};
    for (const entry of glEntries) {
        const d = new Date(entry.date);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const code = entry.accountCode;
        const key = `${code}_${year}_${month}`;
        if (!tbMap[key]) {
            tbMap[key] = {
                companyCode: 'GK_SMART_AI',
                accountCode: code,
                accountDescription: entry.accountDescription,
                year, month,
                debit: 0, credit: 0,
                moneyIn: 0, moneyOut: 0, count: 0
            };
        }
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
    
    // Final summary
    const byCode = {};
    tbRecords.forEach(r => {
        if (!byCode[r.accountCode]) byCode[r.accountCode] = { in: 0, out: 0, desc: r.accountDescription };
        byCode[r.accountCode].in += r.moneyIn;
        byCode[r.accountCode].out += r.moneyOut;
    });
    
    const grandIn = Object.values(byCode).reduce((s, v) => s + v.in, 0);
    const grandOut = Object.values(byCode).reduce((s, v) => s + v.out, 0);
    
    console.log('\n=== CORRECTED TB BY ACCOUNT CODE ===');
    Object.entries(byCode).sort((a,b) => a[0].localeCompare(b[0])).forEach(([code, v]) => {
        if (v.in > 0 || v.out > 0) {
            console.log(`  ${code} (${v.desc?.substring(0,35)}): In=$${v.in.toFixed(2)} | Out=$${v.out.toFixed(2)}`);
        }
    });
    console.log(`\n  GRAND TOTAL: In=$${grandIn.toFixed(2)} | Out=$${grandOut.toFixed(2)} | Net=$${(grandIn - grandOut).toFixed(2)}`);
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
