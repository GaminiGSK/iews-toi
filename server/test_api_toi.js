const mongoose = require('mongoose');

async function testApi() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    // Simulate what the UI endpoint gets exactly for TOI-2025 year 2025
    
    let allTx = await mongoose.connection.collection('transactions').find({ companyCode: 'TOI-2025' }).toArray();
    let codes = await mongoose.connection.collection('accountcodes').find({ companyCode: 'TOI-2025' }).toArray();
    let openingBalances = {};
    let bsData = {};
    
    codes.forEach(c => {
        if (c.code && typeof c.code === 'string' && ['1', '2', '3'].includes(c.code.charAt(0))) {
            bsData[c.code] = { description: c.description, code: c.code, months: Array(13).fill(0) };
            openingBalances[c.code] = 0;
        }
    });
    
    let retainedEarningsOffset = 0;
    
    allTx.forEach(tx => {
        let acObj = codes.find(c => String(c._id) === String(tx.accountCode));
        if (!acObj) return;
        
        let d = new Date(tx.date);
        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        
        let code = acObj.code;
        if (!code || typeof code !== 'string') return;
        
        let amount = parseFloat(tx.amount || 0);
        let signedAmount = amount;
        
        if (['1', '5', '6', '7', '8', '9'].some(p => code.startsWith(p))) signedAmount = -amount;
        
        if (year < 2025) {
            if (bsData[code]) openingBalances[code] += signedAmount;
            else retainedEarningsOffset += amount;
        } else if (year === 2025) {
            if (bsData[code]) {
                bsData[code].months[month] += signedAmount;
                bsData[code].months[0] += signedAmount;
            }
        }
    });
    
    let allJournals = await mongoose.connection.collection('journalentries').find({ companyCode: 'TOI-2025' }).toArray();
    allJournals.forEach(je => {
        if (je.status !== 'Posted') return;
        let d = new Date(je.date);
        let year = d.getFullYear();
        let month = d.getMonth() + 1;
        
        je.lines.forEach(line => {
            let acObj = codes.find(c => String(c._id) === String(line.accountCode));
            if (!acObj) return;
            let code = acObj.code;
            if (!code || typeof code !== 'string') return;
            
            let signedAmount = 0;
            if (['1', '5', '6', '7', '8', '9'].some(p => code.startsWith(p))) signedAmount = (parseFloat(line.debit||0) - parseFloat(line.credit||0));
            else signedAmount = (parseFloat(line.credit||0) - parseFloat(line.debit||0));
            
            if (year < 2025) {
                if (bsData[code]) openingBalances[code] += signedAmount;
                else retainedEarningsOffset += (parseFloat(line.credit||0) - parseFloat(line.debit||0));
            } else if (year === 2025) {
                if (bsData[code]) {
                    bsData[code].months[month] += signedAmount;
                    bsData[code].months[0] += signedAmount;
                }
            }
        });
    });
    
    let reCode = codes.find(c => c.code === '33000' || c.code === '30000' || (c.description || '').toLowerCase().includes('retained earnings'))?.code;
    if (!reCode) {
        reCode = '33000-VIRTUAL';
        bsData[reCode] = { description: 'RETAINED EARNINGS (AUTO)', code: '33000', months: Array(13).fill(0) };
        openingBalances[reCode] = 0;
    }
    
    if (openingBalances[reCode] !== undefined) openingBalances[reCode] += retainedEarningsOffset;
    
    Object.keys(bsData).forEach(code => {
        let running = openingBalances[code] || 0;
        for (let m = 1; m <= 12; m++) {
            running += bsData[code].months[m];
            bsData[code].months[m] = running;
        }
        bsData[code].months[0] = running;
    });
    
    console.log("=== EQUITY BALANCES FOR TOI-2025 ===");
    let eqKeys = Object.keys(bsData).filter(k => k.startsWith('3'));
    eqKeys.forEach(k => {
        if (bsData[k].description || sum(bsData[k].months) !== 0) {
            console.log(bsData[k].description, bsData[k].months.slice(0, 4));
        }
    });

    process.exit(0);
}

function sum(arr) { return arr.reduce((a,b)=>a+b, 0); }

testApi();
