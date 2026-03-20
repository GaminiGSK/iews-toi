const mongoose = require('mongoose');

async function testApiAgain() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    // Test the API emulation to verify the fix works for Share Capital
    
    let allTx = await mongoose.connection.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    let codes = await mongoose.connection.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
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
        if (!code) return;
        
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

    Object.keys(bsData).forEach(code => {
        let running = openingBalances[code];
        for (let m = 1; m <= 12; m++) {
            running += bsData[code].months[m];
            bsData[code].months[m] = running;
        }
        bsData[code].months[0] = running;
    });
    
    console.log("=== EQUITY BALANCES FOR GK_SMART_AI (2025) ===");
    let eqKeys = Object.keys(bsData).filter(k => k.startsWith('3'));
    eqKeys.forEach(k => {
        console.log(bsData[k].description, bsData[k].months.map(m=>m.toFixed(2)).slice(0, 5));
    });

    process.exit(0);
}

testApiAgain();
