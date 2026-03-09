const mongoose = require('mongoose');
const AccountCode = require('./models/AccountCode');
const Transaction = require('./models/Transaction');
const URI = 'mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0';

async function fixDB() {
    await mongoose.connect(URI);
    console.log('Connected to DB');

    const updates = [
        { code: '30100', description: 'Share Capital / Paid-in Capital', matchDescription: 'Shareholder Capital Injection, Kassapa Gamini Gunasingha', toiCode: '30100' },
        { code: '30200', description: 'Share Premium', matchDescription: 'Premium over par value on shares', toiCode: '30200' },
        { code: '21100', description: 'Liability (Related Party)', matchDescription: 'Shareholder Loan, Inter-company Advance', toiCode: '21100' },
        { code: '21500', description: 'Due to Shareholders', matchDescription: 'Shareholder loan to company', toiCode: '21500' },
        { code: '20400', description: 'Short-term Bank Borrowings', matchDescription: 'Bank borrowing under 1 year', toiCode: '20400' },
        { code: '21300', description: 'Long-term Bank Borrowings', matchDescription: 'Bank borrowing over 1 year', toiCode: '21300' },
        { code: '40000', description: 'Foreign Service Income', matchDescription: 'Sales/Service Revenue - Overseas, Foreign transfer', toiCode: '40000' },
        { code: '42100', description: 'Dividend Income', matchDescription: 'Receiving profits from foreign subsidiary', toiCode: '42100' }
    ];

    // Need user for account codes
    const userSample = await AccountCode.findOne({ companyCode: 'GK_SMART_AI' });
    const userId = userSample ? userSample.user : new mongoose.Types.ObjectId();

    for (let u of updates) {
        await AccountCode.updateOne(
            { companyCode: 'GK_SMART_AI', code: u.code },
            { $set: { user: userId, description: u.description, matchDescription: u.matchDescription, toiCode: u.toiCode } },
            { upsert: true }
        );
        console.log('Processed account code: ' + u.code);
    }

    // Find the ObjectId for 30100
    const ac30100 = await AccountCode.findOne({ companyCode: 'GK_SMART_AI', code: '30100' });
    const ac30000 = await AccountCode.findOne({ companyCode: 'GK_SMART_AI', code: '30000' });

    // Update Kassapa Gamini Gunasingha to 30100
    let res = await Transaction.updateMany(
        { companyCode: 'GK_SMART_AI', description: { $regex: 'Kassapa Gamini Gunasingha', $options: 'i' } },
        { $set: { description: 'Shareholder Capital Injection', accountCode: ac30100._id } }
    );
    console.log('Fixed Kassapa transactions by regex: ' + res.modifiedCount);

    if (ac30000) {
        let res2 = await Transaction.updateMany(
            { companyCode: 'GK_SMART_AI', accountCode: ac30000._id },
            { $set: { accountCode: ac30100._id } }
        );
        console.log('Moved any other 30000 transactions to 30100: ' + res2.modifiedCount);

        await AccountCode.deleteOne({ _id: ac30000._id });
        console.log('Deleted legacy 30000 account code');
    }

    process.exit(0);
}
fixDB().catch(console.error);
