const mongoose = require('mongoose');

async function checkAllCompaniesEq() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    // Check all transactions for ANY equity code in ANY company to trace the 460
    
    let codes = await mongoose.connection.collection('accountcodes').find({}).toArray();
    let codeMap = {};
    codes.forEach(c => codeMap[c._id.toString()] = { comp: c.companyCode, code: c.code, desc: c.description });
    
    let allTx = await mongoose.connection.collection('transactions').find({}).toArray();
    
    let compBalances = {};
    
    allTx.forEach(tx => {
        let codeInfo = codeMap[tx.accountCode];
        if (!codeInfo) return;
        let p = String(codeInfo.code);
        if (p.startsWith('3')) { // Equity
            let comp = codeInfo.comp;
            if (!compBalances[comp]) compBalances[comp] = {};
            if (!compBalances[comp][p]) compBalances[comp][p] = { desc: codeInfo.desc, balance: 0 };
            
            let amount = parseFloat(tx.amount || 0);
            compBalances[comp][p].balance += amount; // Simplified direction for test
        }
    });
    
    for (let comp in compBalances) {
        console.log(`Company: ${comp}`);
        for (let code in compBalances[comp]) {
            console.log(`  ${code} - ${compBalances[comp][code].desc}: ${compBalances[comp][code].balance}`);
        }
    }
    
    let allJournals = await mongoose.connection.collection('journalentries').find().toArray();
    let compJe = {};
    allJournals.forEach(je => {
        if (je.status !== 'Posted') return;
        je.lines.forEach(line => {
             let codeInfo = codeMap[line.accountCode];
             if (!codeInfo) return;
             let p = String(codeInfo.code);
             if (p.startsWith('3')) {
                  let comp = codeInfo.comp;
                  if (!compJe[comp]) compJe[comp] = {};
                  if (!compJe[comp][p]) compJe[comp][p] = { desc: codeInfo.desc, balance: 0 };
                  compJe[comp][p].balance += (parseFloat(line.credit||0) - parseFloat(line.debit||0));
             }
        });
    });

    console.log("\nJournal Entries Equity:");
    for (let comp in compJe) {
        console.log(`Company: ${comp}`);
        for (let code in compJe[comp]) {
            console.log(`  ${code} - ${compJe[comp][code].desc}: ${compJe[comp][code].balance}`);
        }
    }

    process.exit(0);
}

checkAllCompaniesEq();
