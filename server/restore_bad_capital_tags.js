const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Find the account code for 30100
    const ac = await db.collection('accountcodes').findOne({ code: '30100', companyCode: 'GK_SMART_AI' });
    
    // Specifically finding the 4 that we just un-tagged (which had 'capital take back' in description)
    const txs = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI', 
        description: { $regex: /owner capital take back/i }
    }).toArray();
    
    for (const t of txs) {
        if (!t.accountCode) { // Only re-add if I unset it
            console.log(`Re-tagging exactly back as before: ${t.description}`);
            await db.collection('transactions').updateOne(
                { _id: t._id },
                { $set: { accountCode: ac._id, tagSource: 'ai', code: '30100' } }
            );
        }
    }
    
    // And there was one other, the '61241' ones, but I didn't touch them, I only touched amount < 0 with accountCode ac._id. So it was only the 4.
    console.log(`Restored transactions.`);
    process.exit(0);
});
