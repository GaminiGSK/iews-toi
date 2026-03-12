const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    console.log("Reading tmp_audit_export.json...");
    const rawData = fs.readFileSync(path.join(__dirname, '../tmp_audit_export.json'), 'utf8');
    const backup = JSON.parse(rawData);
    
    const logs = backup.data.TransactionLogs;
    if (!logs || logs.length === 0) {
        console.log("No TransactionLogs found in backup.");
        process.exit(0);
    }

    console.log(`Found ${logs.length} backed up transactions. Starting restoration...`);

    // Get needed Account Codes
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const codesMap = {};
    accountCodes.forEach(c => codesMap[c.code] = c._id);

    // 1. CLEAR existing mock Transactions and Journal Entries to revert the previous sync
    await db.collection('transactions').deleteMany({ companyCode: 'GK_SMART_AI' });
    await db.collection('journalentries').deleteMany({ companyCode: 'GK_SMART_AI' });
    console.log("Cleared mock sync data.");

    // 2. Map and Insert Backup Data
    const restoredTransactions = logs.map((log) => {
        const rawCode = log.account ? log.account.split(' - ')[0] : 'uncategorized';
        const accountCodeId = codesMap[rawCode] || null;

        const amountNum = parseFloat(log.amount);

        return {
            companyCode: 'GK_SMART_AI',
            user: new mongoose.Types.ObjectId('698ee86ca61b7e7a5b415550'),
            date: new Date(log.date),
            description: log.description,
            amount: amountNum,
            moneyIn: amountNum > 0 ? amountNum : 0,
            moneyOut: amountNum < 0 ? Math.abs(amountNum) : 0,
            code: rawCode,
            accountCode: accountCodeId,
            tagSource: 'bank_statement_restore'
        };
    });

    await db.collection('transactions').insertMany(restoredTransactions);

    console.log(`Restored ${restoredTransactions.length} transactions successfully.`);
    process.exit(0);
}).catch(console.error);
