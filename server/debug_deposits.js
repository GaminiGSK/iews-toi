const mongoose = require('mongoose');

async function debugBank() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    // Check TOI-2025 Bank Statements
    let allBs = await mongoose.connection.collection('bankstatements').find({ companyCode: 'TOI-2025' }).toArray();
    let moneyInBs = allBs.filter(b => parseFloat(b.amountIn || 0) > 0);
    
    // Check TOI-2025 Transactions
    let allTx = await mongoose.connection.collection('transactions').find({ companyCode: 'TOI-2025' }).toArray();
    let moneyInTx = allTx.filter(t => parseFloat(t.amount || 0) > 0);
    
    console.log(`\n=== TOI-2025 ===`);
    console.log(`Bank Statement deposits found: ${moneyInBs.length}`);
    console.log(`General Ledger deposits found: ${moneyInTx.length}`);

    // Check GK_SMART_AI Bank Statements
    let allBsGk = await mongoose.connection.collection('bankstatements').find({ companyCode: 'GK_SMART_AI' }).toArray();
    let moneyInBsGk = allBsGk.filter(b => parseFloat(b.amountIn || 0) > 0);
    
    // Check GK_SMART_AI Transactions
    let allTxGk = await mongoose.connection.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    let moneyInTxGk = allTxGk.filter(t => parseFloat(t.amount || 0) > 0);
    
    console.log(`\n=== GK_SMART_AI ===`);
    console.log(`Bank Statement deposits found: ${moneyInBsGk.length}`);
    console.log(`General Ledger deposits found: ${moneyInTxGk.length}`);
    
    // Print out the GK_SMART_AI General Ledger deposits
    console.log(`\nSample of GK_SMART_AI General Ledger Deposits (Money In):`);
    let codes = await mongoose.connection.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    let codeMap = {};
    codes.forEach(c => codeMap[c._id.toString()] = { code: c.code, desc: c.description });
    
    moneyInTxGk.slice(0, 5).forEach(t => {
        let codeInfo = codeMap[t.accountCode];
        console.log(`Date: ${t.date} | Amount: ${t.amount} | Code: ${codeInfo?.code} - ${codeInfo?.desc}`);
    });

    process.exit(0);
}

debugBank();
