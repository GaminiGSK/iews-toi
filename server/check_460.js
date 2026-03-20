const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    let tx = await mongoose.connection.collection('transactions').find({ 
        companyCode: 'TOI-2025'
    }).toArray();
    
    // Check for 460
    let tx460 = tx.filter(t => Math.abs(parseFloat(t.amount || 0)) === 460);
    console.log(`Found ${tx460.length} transactions with amount exactly 460:`);
    tx460.forEach(t => console.log(t));
    
    let codes = await mongoose.connection.collection('accountcodes').find({ 
        companyCode: 'TOI-2025'
    }).toArray();
    
    let shareCapCode = codes.find(c => c.description && c.description.toLowerCase().includes('share capital'));
    
    if (shareCapCode) {
        console.log(`\nShare Capital account ID: ${shareCapCode._id}`);
        
        let scTx = tx.filter(t => t.accountCode === shareCapCode._id.toString());
        console.log(`Found ${scTx.length} transactions mapped to Share Capital:`);
        scTx.forEach(t => console.log(t));
    } else {
        console.log('No Share Capital account found for TOI-2025.');
    }
    
    process.exit(0);
}

check();
