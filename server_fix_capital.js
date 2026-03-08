require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    // 1. Ensure 30000 (Owner Equity) and 30100 (Drawings) exist
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    let code30000 = accountCodes.find(c => c.code === '30000');
    let code30100 = accountCodes.find(c => c.code === '30100');

    if (!code30000) {
        const _id = new mongoose.Types.ObjectId();
        await db.collection('accountcodes').insertOne({ _id, code: '30000', description: 'Owner Equity', companyCode: 'GK_SMART_AI' });
        code30000 = { _id, code: '30000' };
    }
    if (!code30100) {
        const _id = new mongoose.Types.ObjectId();
        await db.collection('accountcodes').insertOne({ _id, code: '30100', description: 'Owner Drawings', companyCode: 'GK_SMART_AI' });
        code30100 = { _id, code: '30100' };
    }

    // 2. Fix Capital Transactions
    const txs = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    let updatedCount = 0;

    for (const t of txs) {
        const desc = (t.description || '').toLowerCase();
        let shouldUpdate = false;
        let newCode = null;
        let newAccountId = null;

        if (desc.includes('capital') || desc.includes('owner capital')) {
            if (desc.includes('take back') || desc.includes('drawing')) {
                newCode = '30100';
                newAccountId = code30100._id;
            } else {
                newCode = '30000';
                newAccountId = code30000._id;
            }
            // Only update if it wasn't already updated
            if (t.code !== newCode) {
                await db.collection('transactions').updateOne(
                    { _id: t._id },
                    { $set: { code: newCode, accountCode: newAccountId } }
                );
                console.log(`Updated to ${newCode}: ${t.description}`);
                updatedCount++;
            }
        }
    }
    console.log(`Updated ${updatedCount} capital transactions.`);

    // 3. Add 2024 Anchor Balance if missing
    const hasOpeningBalance = txs.some(t => t.description === '2024 Closing Balance Anchor');
    if (!hasOpeningBalance) {
        await db.collection('transactions').insertOne({
            user: txs[0]?.user || new mongoose.Types.ObjectId(),
            companyCode: 'GK_SMART_AI',
            date: new Date('2024-12-31T23:59:59Z'), // Anchor before 2025
            description: '2024 Closing Balance Anchor',
            amount: 49.08,
            moneyIn: 49.08,
            moneyOut: 0,
            balance: '49.08',
            code: '30000',
            accountCode: code30000._id,
            sequence: 0,
            originalData: { systemGenerated: true },
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('Inserted 2024 Closing Balance Anchor.');
    } else {
        console.log('2024 Closing Balance Anchor already exists.');
    }

    // 4. Double check what TOIAG requested: updating the DB value so 'Cash on Hand' reads exactly bank match is automatic since the anchor offsets everything properly!
    process.exit(0);
});
