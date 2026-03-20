require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Get all GL entries for GK_SMART_AI
    const glEntries = await db.collection('journalentries').find({ companyCode: 'GK_SMART_AI' }).toArray();
    console.log(`Building TB from ${glEntries.length} GL entries...`);
    
    // Group by accountCode + year + month
    const tbMap = {};
    
    for (const entry of glEntries) {
        const d = new Date(entry.date);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-12
        const code = entry.accountCode;
        if (!code) continue;
        
        const key = `${code}_${year}_${month}`;
        if (!tbMap[key]) {
            tbMap[key] = {
                companyCode: 'GK_SMART_AI',
                accountCode: code,
                accountDescription: entry.accountDescription || code,
                year,
                month,
                debit: 0,
                credit: 0,
                moneyIn: 0,
                moneyOut: 0,
                count: 0
            };
        }
        tbMap[key].debit += parseFloat(entry.debitAmount) || 0;
        tbMap[key].credit += parseFloat(entry.creditAmount) || 0;
        tbMap[key].moneyIn += parseFloat(entry.moneyIn) || 0;
        tbMap[key].moneyOut += parseFloat(entry.moneyOut) || 0;
        tbMap[key].count++;
    }
    
    const tbRecords = Object.values(tbMap);
    console.log(`Generated ${tbRecords.length} TB records`);
    
    // Clear and insert TB
    await db.collection('trialbals').deleteMany({ companyCode: 'GK_SMART_AI' });
    if (tbRecords.length > 0) {
        await db.collection('trialbals').insertMany(tbRecords);
    }
    
    console.log(`✅ TB rebuilt with ${tbRecords.length} records`);
    
    // Show summary by account
    const byCode = {};
    tbRecords.forEach(r => {
        if (!byCode[r.accountCode]) byCode[r.accountCode] = { in: 0, out: 0, desc: r.accountDescription };
        byCode[r.accountCode].in += r.moneyIn;
        byCode[r.accountCode].out += r.moneyOut;
    });
    
    console.log('\nTB Summary by Account Code:');
    Object.entries(byCode).sort((a,b) => a[0].localeCompare(b[0])).forEach(([code, v]) => {
        console.log(`  ${code} (${v.desc?.substring(0,30)}): In $${v.in.toFixed(2)} | Out $${v.out.toFixed(2)}`);
    });
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
