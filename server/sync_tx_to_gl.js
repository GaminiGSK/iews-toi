require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Get all tagged transactions for GK_SMART_AI
    const transactions = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI',
        code: { $exists: true, $ne: null, $ne: '' }
    }).toArray();
    
    console.log(`Found ${transactions.length} tagged transactions to sync to GL`);
    
    // Clear existing GL entries for GK_SMART_AI (except the ADM_001 anchors)
    await db.collection('journalentries').deleteMany({ companyCode: 'GK_SMART_AI' });
    console.log('Cleared old GK_SMART_AI GL entries');
    
    // Get account codes mapping
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const codesMap = {};
    accountCodes.forEach(c => codesMap[c.code] = { id: c._id, description: c.description, category: c.category });
    
    // Build GL journal entries from transactions
    const glEntries = transactions.map(t => {
        const codeInfo = codesMap[t.code] || {};
        const amount = parseFloat(t.amount) || 0;
        const moneyIn = parseFloat(t.moneyIn) || 0;
        const moneyOut = parseFloat(t.moneyOut) || 0;
        
        // Determine DR/CR based on amount sign and account code type
        // Money In = Credit to Revenue/Equity (CR), Debit to Cash (DR)
        // Money Out = Debit to Expense/Asset (DR), Credit to Cash (CR)
        const isRevenue = amount > 0;
        
        return {
            companyCode: 'GK_SMART_AI',
            user: t.user,
            date: t.date,
            description: t.description || '',
            accountCode: t.code,
            accountCodeId: t.accountCode || null,
            accountDescription: codeInfo.description || t.code,
            debitAmount: isRevenue ? 0 : moneyOut,
            creditAmount: isRevenue ? moneyIn : 0,
            amount: Math.abs(amount),
            moneyIn: moneyIn,
            moneyOut: moneyOut,
            transactionId: t._id,
            syncedFrom: 'bank_statement_sync',
            createdAt: new Date()
        };
    });
    
    if (glEntries.length > 0) {
        await db.collection('journalentries').insertMany(glEntries);
        console.log(`✅ Synced ${glEntries.length} entries to journalentries (GL)`);
    }
    
    // Verify
    const newGLCount = await db.collection('journalentries').countDocuments({ companyCode: 'GK_SMART_AI' });
    console.log(`GL entries now: ${newGLCount}`);
    
    // Summary by year
    const yr2024 = await db.collection('journalentries').countDocuments({ 
        companyCode: 'GK_SMART_AI',
        date: { $gte: new Date('2024-01-01'), $lt: new Date('2025-01-01') }
    });
    const yr2025 = await db.collection('journalentries').countDocuments({ 
        companyCode: 'GK_SMART_AI',
        date: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') }
    });
    console.log(`  2024: ${yr2024} GL entries`);
    console.log(`  2025: ${yr2025} GL entries`);
    
    mongoose.disconnect();
    console.log('\nDone. Now trigger TB/FS refresh in the app.');
}).catch(e => console.error('DB error:', e.message));
