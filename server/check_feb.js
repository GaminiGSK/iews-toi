const mongoose = require('mongoose');

async function checkFeb() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    let codes = await mongoose.connection.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    let codeMap = {};
    codes.forEach(c => codeMap[c._id.toString()] = { desc: c.description, code: c.code });
    
    let allTx = await mongoose.connection.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    
    let febMoneyIn = allTx.filter(t => {
        let d = new Date(t.date);
        return d.getFullYear() === 2025 && d.getMonth() === 1 && parseFloat(t.amount) > 0;
    });
    
    console.log(`Found ${febMoneyIn.length} transactions for Feb money in:`);
    febMoneyIn.forEach(t => {
        let c = codeMap[t.accountCode];
        console.log(`Date: ${t.date} | Amount: ${t.amount} | Acc: ${c?c.code:'unassigned'} - ${c?c.desc:'unassigned'} | Note: ${t.description}`);
    });

    process.exit(0);
}

checkFeb();
