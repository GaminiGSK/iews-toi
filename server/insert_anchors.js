require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const JournalEntry = require('./models/JournalEntry');
    const User = require('./models/User');
    
    // Find the primary user to attach these to
    const admin = await User.findOne({ role: 'admin' });
    const companyCode = admin ? admin.companyCode : 'GKS';

    // 10130 ABA
    const ABA_ID = '6970edb1b37508ea419035d8';
    
    // 17290 COST OF AUTOMOBILE
    const AUTO_ID = '6970edb2b37508ea419035e5';
    
    // 17250 COST OF COMPUTER
    const COMP_ID = '6970edb1b37508ea419035e1';
    
    // 30100 Share Capital / Paid-in Capital
    const EQUITY_ID = '69accc7868bdad71f5c1d747';

    console.log("Pinning the auditor-verified assets and anchors...");

    const entry1 = new JournalEntry({
        user: admin ? admin._id : null,
        companyCode: companyCode,
        date: '2025-01-01',
        description: 'Auditor Anchor: Jan 1 Opening Balance',
        reference: 'AUDIT-ANCHOR-001',
        status: 'Posted',
        createdBy: 'GK SMART System (Auditor Script)',
        lines: [
            { accountCode: ABA_ID, debit: 49.08, credit: 0 },
            { accountCode: EQUITY_ID, debit: 0, credit: 49.08 }
        ]
    });

    const entry2 = new JournalEntry({
        user: admin ? admin._id : null,
        companyCode: companyCode,
        date: '2025-01-01', // Putting these at the start of the year as anchored capital assets
        description: 'Auditor Anchor: Pin $19,000 Automobile & $44,137 Tech Assets',
        reference: 'AUDIT-ANCHOR-002',
        status: 'Posted',
        createdBy: 'GK SMART System (Auditor Script)',
        lines: [
            { accountCode: AUTO_ID, debit: 19000, credit: 0 },
            { accountCode: COMP_ID, debit: 44137, credit: 0 },
            { accountCode: EQUITY_ID, debit: 0, credit: 63137 }
        ]
    });

    await JournalEntry.deleteMany({ reference: { $in: ['AUDIT-ANCHOR-001', 'AUDIT-ANCHOR-002'] } }); // Clean up any existing
    await entry1.save();
    await entry2.save();

    console.log("Successfully pinned anchors to GL Journal.");
    process.exit(0);
});
