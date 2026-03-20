const mongoose = require('mongoose');

async function checkGk() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    // Check all transactions for GK_SMART_AI on account "30100"
    let codes = await mongoose.connection.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    let shareCap = codes.find(c => c.code === '30100' || c.description.includes('Share Capital'));
    
    let allTx = await mongoose.connection.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI',
        accountCode: shareCap._id.toString()
    }).toArray();
    
    console.log(`Found ${allTx.length} transactions for Share Capital in GK_SMART_AI:`);
    allTx.forEach(t => {
        console.log(`Date: ${t.date} | Amount: ${t.amount}`);
    });
    
    process.exit(0);
}

checkGk();
