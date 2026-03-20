const mongoose = require('mongoose');

async function checkAllCompanies() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    // Check all transactions for amount 460
    let tx460 = await mongoose.connection.collection('transactions').find({ 
        $or: [
            { amount: { $in: [460, "460", "460.00", -460, "-460", "-460.00"] } }
        ]
    }).toArray();
    
    console.log(`Found ${tx460.length} transactions with amount 460:`);
    tx460.forEach(t => {
        console.log(`Company: ${t.companyCode} | Date: ${t.date} | Amount: ${t.amount} | Code: ${t.accountCode}`);
    });
    
    // Check journal entries for exact 460 line credit or debit
    let je = await mongoose.connection.collection('journalentries').find().toArray();
    
    let targets = je.filter(j => j.lines.some(l => 
        l.debit == 460 || l.credit == 460
    ));
    
    console.log(`\nFound ${targets.length} journal entries with line amount 460:`);
    targets.forEach(j => {
        console.log(`Company: ${j.companyCode} | Date: ${j.date} | Memo: ${j.memo}`);
    });

    process.exit(0);
}

checkAllCompanies();
