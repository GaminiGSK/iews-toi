const mongoose = require('mongoose');

async function cleanMockData() {
    let uri = 'mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0';
    await mongoose.connect(uri);
    
    let db = mongoose.connection.collection('transactions');
    
    // The previous clean up failed because the auto-tagger changed the tags and tagSource
    let result = await db.deleteMany({ 
        accountCode: new mongoose.Types.ObjectId('6970edb1b37508ea419035d7'), 
        companyCode: 'GK_SMART_AI', 
        amount: { $in: [1000, 2000] },
        tagSource: 'ai'
    });
    
    console.log(`Deleted ${result.deletedCount} re-tagged mock transactions from Cash on Hand.`);
    process.exit(0);
}

cleanMockData();
