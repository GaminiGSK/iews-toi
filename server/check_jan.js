const mongoose = require('mongoose');

async function checkJanMoneyIn() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    // Transactions
    let allTx = await mongoose.connection.collection('transactions').find({ companyCode: 'TOI-2025' }).toArray();
    
    // BankStatements
    let allBS = await mongoose.connection.collection('bankstatements').find({ companyCode: 'TOI-2025' }).toArray();

    console.log(`=== TRANSACTIONS (GL) Jan 2025 ===`);
    allTx.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === 2025 && d.getMonth() === 0) {
            console.log(`GL: ${t.date} | ${t.amount} | ${t.description} | AC: ${t.accountCode}`);
        }
    });

    console.log(`=== BANK STATEMENTS Jan 2025 ===`);
    allBS.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === 2025 && d.getMonth() === 0) {
             console.log(`Bank: ${t.date} | In: ${t.amountIn} | Out: ${t.amountOut} | AC: ${t.accountCode} | Note: ${t.note}`);
        }
    });
    
    process.exit(0);
}

checkJanMoneyIn();
