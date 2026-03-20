require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const companyCode = 'GK_SMART_AI';

    const accountCodes = await db.collection('accountcodes').find({ companyCode }).toArray();
    const codes = accountCodes;
    
    const codeMap = {};
    codes.forEach(c => codeMap[c.code] = c);

    const allTransactions = await db.collection('transactions').find({ companyCode }).toArray();

    // 2.5 Resolve Reporting Year (same logic as the route)
    const availableYears = [...new Set([
        ...allTransactions.map(t => new Date(t.date).getFullYear())
    ])].sort((a, b) => b - a);
    
    const currentYear = availableYears[0];
    console.log(`Available years: ${availableYears}`);
    console.log(`Current year selected: ${currentYear}`);

    // Initialize data structures
    const plData = {};
    const bsData = {};
    const openingBalances = {};

    codes.forEach(c => {
        if (['4', '5', '6', '7', '8', '9'].some(p => c.code.startsWith(p))) {
            plData[c.code] = { description: c.description, code: c.code, months: Array(13).fill(0) };
        } else {
            bsData[c.code] = { description: c.description, code: c.code, months: Array(13).fill(0) };
            openingBalances[c.code] = 0;
        }
    });

    console.log(`\nBS codes (assets/equity/liab): ${Object.keys(bsData).sort().join(', ')}`);
    console.log(`PL codes (income/expense): ${Object.keys(plData).sort().join(', ')}`);

    // Process transactions
    let matched = 0, skipped = 0;
    allTransactions.forEach(tx => {
        const date = new Date(tx.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        let acId = tx.accountCode;
        if (!acId) { skipped++; return; }

        const acObj = codes.find(c => String(c._id) === String(acId));
        if (!acObj) { 
            skipped++; 
            console.log(`  SKIP: tx code=${tx.code} accountCode=${acId} — not found in accountcodes`);
            return; 
        }

        const code = acObj.code;
        const amount = parseFloat(tx.amount || 0);
        
        let signedAmount = amount;
        if (code.startsWith('1')) signedAmount = -amount;

        if (year < currentYear) {
            if (bsData[code]) openingBalances[code] += signedAmount;
        } else if (year === currentYear) {
            if (plData[code]) {
                plData[code].months[month] += Math.abs(signedAmount);
                plData[code].months[0] += Math.abs(signedAmount);
            } else if (bsData[code]) {
                bsData[code].months[month] += signedAmount;
            }
            matched++;
        }
    });

    console.log(`\nProcessed: ${matched} in currentYear, ${skipped} skipped`);
    console.log(`\n=== BS DATA AFTER PROCESSING ===`);
    Object.entries(bsData).forEach(([code, v]) => {
        const hasData = v.months.some(m => m !== 0) || openingBalances[code] !== 0;
        if (hasData) console.log(`  ${code} (${v.description}): opening=${openingBalances[code].toFixed(2)} | months=${v.months.slice(1).map(m=>m.toFixed(0)).join(',')}`);
    });
    
    console.log(`\n=== PL DATA AFTER PROCESSING ===`);
    Object.entries(plData).forEach(([code, v]) => {
        if (v.months[0] !== 0) console.log(`  ${code} (${v.description}): total=${v.months[0].toFixed(2)} | months=${v.months.slice(1).map(m=>m.toFixed(0)).join(',')}`);
    });

    mongoose.disconnect();
}).catch(e => console.error(e.message));
