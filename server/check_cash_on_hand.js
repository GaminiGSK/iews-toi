const mongoose = require('mongoose');

async function checkCashOnHand() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    // Check TOI-2025 and GK_SMART_AI for Cash on Hand
    let codes = await mongoose.connection.collection('accountcodes').find({
        $or: [
            { code: '10110' },
            { description: /CASH ON HAND/i }
        ]
    }).toArray();
    
    console.log("Account Codes found:");
    codes.forEach(c => console.log(`${c.companyCode}: ${c.code} - ${c.description} - ID: ${c._id}`));

    let codeIds = codes.map(c => c._id.toString());
    
    let txs = await mongoose.connection.collection('transactions').find({
        accountCode: { $in: codeIds }
    }).toArray();
    
    console.log(`\nFound ${txs.length} transactions mapped to Cash on Hand:`);
    
    let companyTotals = {};
    txs.forEach(t => {
        if (!companyTotals[t.companyCode]) {
            companyTotals[t.companyCode] = 0;
        }
        companyTotals[t.companyCode] += parseFloat(t.amount || 0);
    });
    
    console.log("Totals by company from transactions:");
    console.log(companyTotals);
    
    let jes = await mongoose.connection.collection('journalentries').find({
        "lines.accountCode": { $in: codeIds }
    }).toArray();
    
    console.log(`\nFound ${jes.length} journal entries affecting Cash on Hand:`);
    jes.forEach(j => {
        j.lines.forEach(l => {
            if (codeIds.includes(l.accountCode)) {
                 console.log(`Company: ${j.companyCode} | Date: ${j.date} | DR: ${l.debit} | CR: ${l.credit}`);
            }
        });
    });

    // Also check what company.js outputs to verify where -3000 comes from
    process.exit(0);
}

checkCashOnHand();
