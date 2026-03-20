require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Build ObjectId -> code string map
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const idToCode = {};
    const idToDesc = {};
    accountCodes.forEach(ac => {
        idToCode[ac._id.toString()] = ac.code;
        idToDesc[ac._id.toString()] = ac.description;
    });
    
    console.log('Account code map built:', Object.keys(idToCode).length, 'entries');
    
    // Get all transactions for GK_SMART_AI
    const transactions = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    console.log(`Processing ${transactions.length} transactions...`);
    
    // Rebuild GL entries using accountCode ObjectId → real code string
    await db.collection('journalentries').deleteMany({ companyCode: 'GK_SMART_AI' });
    
    const glEntries = transactions.map(t => {
        const acId = t.accountCode ? t.accountCode.toString() : null;
        const realCode = acId ? (idToCode[acId] || t.code || 'UNTAGGED') : (t.code || 'UNTAGGED');
        const realDesc = acId ? (idToDesc[acId] || t.description) : t.description;
        
        return {
            companyCode: 'GK_SMART_AI',
            user: t.user,
            date: t.date,
            description: t.description || '',
            accountCode: realCode,
            accountCodeId: t.accountCode || null,
            accountDescription: realDesc || realCode,
            debitAmount: t.moneyOut || 0,
            creditAmount: t.moneyIn || 0,
            amount: Math.abs(t.amount || 0),
            moneyIn: t.moneyIn || 0,
            moneyOut: t.moneyOut || 0,
            transactionId: t._id,
            syncedFrom: 'bank_statement_sync_v2',
            createdAt: new Date()
        };
    });
    
    await db.collection('journalentries').insertMany(glEntries);
    console.log(`✅ Synced ${glEntries.length} entries to GL using ObjectId→Code mapping`);
    
    // Now rebuild TB from corrected GL
    const tbMap = {};
    for (const entry of glEntries) {
        const d = new Date(entry.date);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const code = entry.accountCode;
        if (!code || code === 'UNTAGGED') continue;
        
        const key = `${code}_${year}_${month}`;
        if (!tbMap[key]) {
            tbMap[key] = {
                companyCode: 'GK_SMART_AI',
                accountCode: code,
                accountDescription: entry.accountDescription || code,
                year, month,
                debit: 0, credit: 0,
                moneyIn: 0, moneyOut: 0,
                count: 0
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
    if (tbRecords.length > 0) {
        await db.collection('trialbals').insertMany(tbRecords);
    }
    
    console.log(`✅ TB rebuilt with ${tbRecords.length} records`);
    
    // Summary by account
    const byCode = {};
    tbRecords.forEach(r => {
        if (!byCode[r.accountCode]) byCode[r.accountCode] = { in: 0, out: 0, desc: r.accountDescription };
        byCode[r.accountCode].in += r.moneyIn;
        byCode[r.accountCode].out += r.moneyOut;
    });
    
    console.log('\n=== CORRECTED TB Summary ===');
    Object.entries(byCode).sort((a,b) => a[0].localeCompare(b[0])).forEach(([code, v]) => {
        console.log(`  ${code} (${v.desc?.substring(0,35)}): In=$${v.in.toFixed(2)} | Out=$${v.out.toFixed(2)}`);
    });
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
