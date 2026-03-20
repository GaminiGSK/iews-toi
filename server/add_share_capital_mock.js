const mongoose = require('mongoose');

async function addMock() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    const db = mongoose.connection.collection('transactions');
    
    // Account "30100" is "Share Capital / Paid-in Capital" in GK_SMART_AI
    const acId = new mongoose.Types.ObjectId("69accc7868bdad71f5c1d747");
    
    // Note: since Share Capital is equity, Money In means Credit.
    // In our backend logic, Money IN means positive amount for transactions.
    
    const tx1 = {
        companyCode: 'GK_SMART_AI',
        date: '2025-01-10',
        description: 'Received $1000 as Share Capital Investment',
        amount: 1000,
        accountCode: acId,
        tagSource: 'auto',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const tx2 = {
        companyCode: 'GK_SMART_AI',
        date: '2025-01-25',
        description: 'Received additional $2000 as Share Capital Investment',
        amount: 2000,
        accountCode: acId,
        tagSource: 'auto',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    // To ensure balances match in Bank, we also need to debit the Bank Account (10130 usually, or similar)
    // Actually, `company.js` handles money IN as adding to Bank Account (10130) automatically.
    
    await db.insertOne(tx1);
    await db.insertOne(tx2);
    
    console.log("Successfully inserted $1000 and $2000 Share Capital into Jan 2025!");
    process.exit(0);
}

addMock();
