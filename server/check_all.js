const mongoose = require('mongoose');

async function checkMoneyIn() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    let allTx = await mongoose.connection.collection('transactions').find({ companyCode: 'TOI-2025' }).toArray();
    let codes = await mongoose.connection.collection('accountcodes').find({ companyCode: 'TOI-2025' }).toArray();
    let codeMap = {};
    codes.forEach(c => codeMap[c._id.toString()] = c.description);

    const moneyIn = allTx.filter(t => parseFloat(t.amount) > 0);

    console.log(`Found ${moneyIn.length} total Money-In transactions in DB:`);
    moneyIn.forEach(t => {
        let acName = codeMap[t.accountCode] || 'Unassigned';
        console.log(`${t.date} | $${t.amount} | AC: ${acName} | Desc: ${t.description.substring(0, 30)}`);
    });
    
    process.exit(0);
}

checkMoneyIn();
