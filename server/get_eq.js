const mongoose = require('mongoose');

async function getEquityTx() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    let codes = await mongoose.connection.collection('accountcodes').find({ companyCode: 'TOI-2025' }).toArray();
    let eqCodes = codes.filter(c => c.code && c.code.startsWith('3'));
    
    console.log("Equity codes for TOI-2025:");
    eqCodes.forEach(c => console.log(c.code, c.description, c._id.toString()));
    
    let eqIds = eqCodes.map(c => c._id.toString());
    
    let tx = await mongoose.connection.collection('transactions').find({ 
        companyCode: 'TOI-2025',
        accountCode: { $in: eqIds }
    }).toArray();
    
    console.log(`\nFound ${tx.length} transactions mapped to Equity accounts:`);
    tx.forEach(t => console.log(`${t.date} | ${t.amount} | Code: ${t.accountCode} | Note: ${t.description}`));

    let je = await mongoose.connection.collection('journalentries').find({ 
        companyCode: 'TOI-2025'
    }).toArray();
    
    let jeEq = [];
    je.forEach(j => {
        j.lines.forEach(l => {
            if (eqIds.includes(l.accountCode)) {
                jeEq.push({ date: j.date, memo: j.memo, debit: l.debit, credit: l.credit, code: l.accountCode });
            }
        });
    });

    console.log(`\nFound ${jeEq.length} journal entry lines mapped to Equity accounts:`);
    jeEq.forEach(j => console.log(`${j.date} | DR: ${j.debit} | CR: ${j.credit} | Code: ${j.code} | Memo: ${j.memo}`));

    // Also let's check P&L logic just in case: what's the total P&L in prior years?
    let allTx = await mongoose.connection.collection('transactions').find({ companyCode: 'TOI-2025' }).toArray();
    let plOffset = 0;
    let plIds = codes.filter(c => ['4','5','6','7','8','9'].some(p => c.code && c.code.startsWith(p))).map(c => c._id.toString());
    
    allTx.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() < 2025 && plIds.includes(t.accountCode)) {
            let amount = parseFloat(t.amount || 0);
            plOffset += amount;
        }
    });

    je.forEach(j => {
        const d = new Date(j.date);
        if (d.getFullYear() < 2025) {
            j.lines.forEach(l => {
                if (plIds.includes(l.accountCode)) {
                    plOffset += (parseFloat(l.credit||0) - parseFloat(l.debit||0));
                }
            });
        }
    });

    console.log(`\nPrior Year P&L Offset: ${plOffset}`);

    process.exit(0);
}

getEquityTx();
