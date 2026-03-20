const mongoose = require('mongoose');

async function debugOpeningBalances() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    // Simulate company.js opening balance calculation
    let allTx = await mongoose.connection.collection('transactions').find({ companyCode: 'TOI-2025' }).toArray();
    let codes = await mongoose.connection.collection('accountcodes').find({ companyCode: 'TOI-2025' }).toArray();
    
    let retainedEarningsOffset = 0;
    let plDataCodes = codes.filter(c => ['4', '5', '6', '7', '8', '9'].some(p => c.code.startsWith(p))).map(c => c._id.toString());
    let bsDataCodes = codes.filter(c => ['1', '2', '3'].some(p => c.code.startsWith(p))).map(c => c._id.toString());
    
    let bsBalances = {};
    codes.forEach(c => bsBalances[c.code] = 0);
    
    allTx.forEach(tx => {
        const d = new Date(tx.date);
        if (d.getFullYear() < 2025) {
            let acObj = codes.find(c => String(c._id) === String(tx.accountCode));
            if (!acObj) return;
            
            let amount = parseFloat(tx.amount || 0);
            let code = acObj.code;
            
            let signedAmount = amount;
            if (['1', '5', '6', '7', '8', '9'].some(p => code.startsWith(p))) {
                signedAmount = -amount;
            }
            
            if (bsDataCodes.includes(acObj._id.toString())) {
                bsBalances[code] += signedAmount;
            } else if (plDataCodes.includes(acObj._id.toString())) {
                retainedEarningsOffset += amount;
            }
        }
    });
    
    let allJournals = await mongoose.connection.collection('journalentries').find({ companyCode: 'TOI-2025' }).toArray();
    allJournals.forEach(je => {
        if (je.status !== 'Posted') return;
        const d = new Date(je.date);
        if (d.getFullYear() < 2025) {
            je.lines.forEach(line => {
                let acObj = codes.find(c => String(c._id) === String(line.accountCode));
                if (!acObj) return;
                
                let code = acObj.code;
                let signedAmount = 0;
                if (['1', '5', '6', '7', '8', '9'].some(p => code.startsWith(p))) {
                    signedAmount = line.debit - line.credit;
                } else {
                    signedAmount = line.credit - line.debit;
                }
                
                if (bsDataCodes.includes(acObj._id.toString())) {
                    bsBalances[code] += signedAmount;
                } else if (plDataCodes.includes(acObj._id.toString())) {
                    retainedEarningsOffset += (line.credit - line.debit);
                }
            });
        }
    });

    console.log(`Retained Earnings Offset (Prior Year PL): ${retainedEarningsOffset}`);
    
    console.log("BS Balances from Prior Years:");
    for (let code in bsBalances) {
        if (bsBalances[code] !== 0) {
            console.log(`${code} (${codes.find(c=>c.code===code).description}): ${bsBalances[code]}`);
        }
    }

    process.exit(0);
}

debugOpeningBalances();
