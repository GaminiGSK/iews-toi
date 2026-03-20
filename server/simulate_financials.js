const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const companyCode = 'GK_SMART_AI';
    const currentYear = 2025;
    
    const codes = await db.collection('accountcodes').find({ companyCode }).toArray();
    const allTransactions = await db.collection('transactions').find({ companyCode }).toArray();
    const allJournals = [];

    const plData = {};
    const bsData = {};
    const openingBalances = {};

    codes.forEach(c => {
        if (['4', '5', '6', '7', '8', '9'].some(p => c.code.startsWith(p))) {
            plData[c.code] = { description: c.description, code: c.code, months: Array(13).fill(0) }; // 0=Total, 1-12=Months
        } else {
            bsData[c.code] = { description: c.description, code: c.code, months: Array(13).fill(0) };
            openingBalances[c.code] = parseFloat(c.priorYearDr || 0) - parseFloat(c.priorYearCr || 0);
            if (['2', '3'].some(p => c.code.startsWith(p))) {
                openingBalances[c.code] = parseFloat(c.priorYearCr || 0) - parseFloat(c.priorYearDr || 0);
            }
        }
    });

    let netControlBS = Array(13).fill(0); // Bank offset
    let retainedEarningsOffset = 0;

    allTransactions.forEach(tx => {
        const date = new Date(tx.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12

        let acId = tx.accountCode;
        if (!acId) return; // Skip untagged

        const acObj = codes.find(c => String(c._id) === String(acId));
        if (!acObj) return;

        const code = acObj.code;
        const amount = parseFloat(tx.amount || 0);

        let signedAmount = amount;
        if (['1', '5', '6', '7', '8', '9'].some(p => code.startsWith(p))) {
            signedAmount = -amount;
        }

        if (year < currentYear) {
            if (bsData[code]) {
                openingBalances[code] += signedAmount;
            } else if (plData[code]) {
                retainedEarningsOffset += amount;
            }
            netControlBS[0] += amount;
        } else if (year === currentYear) {
            if (plData[code]) {
                plData[code].months[month] += signedAmount;
                plData[code].months[0] += signedAmount; // Total
            } else if (bsData[code]) {
                bsData[code].months[month] += signedAmount;
            }
            netControlBS[month] += amount;
        }
    });

    // Add to Bank Account (10130)
    if (bsData['10130']) {
        openingBalances['10130'] += netControlBS[0];
        for (let m = 1; m <= 12; m++) {
            bsData['10130'].months[m] += netControlBS[m];
        }
    }

    Object.keys(bsData).forEach(code => {
        let running = openingBalances[code];
        for (let m = 1; m <= 12; m++) {
            running += bsData[code].months[m];
            bsData[code].months[m] = running; // Replace Activity with Balance
        }
        bsData[code].months[0] = running; // Total/Ending Balance
    });

    console.log("CASH ON HAND (10110) DATA:");
    console.log("Opening Balance:", openingBalances['10110']);
    console.log("Months:", bsData['10110']?.months);

    process.exit(0);
});
