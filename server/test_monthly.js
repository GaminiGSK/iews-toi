const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config({ path: 'e:/Antigravity/TOI/server/.env' });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const companyCode = 'GK_SMART_AI'; 
    const AccountCode = require('./models/AccountCode');
    const Transaction = require('./models/Transaction');
    const JournalEntry = require('./models/JournalEntry');

    const codes = await AccountCode.find({ companyCode }).lean();
    const codeMap = {};
    codes.forEach(c => codeMap[c.code] = c);

    const allTransactions = await Transaction.find({ companyCode }).lean();
    const allJournals = await JournalEntry.find({ companyCode }).lean();

    const availableYears = [...new Set([
        ...allTransactions.map(t => new Date(t.date).getFullYear()),
        ...allJournals.map(je => new Date(je.date).getFullYear())
    ])].sort((a, b) => b - a);
    
    let currentYear = availableYears.length > 0 ? availableYears[0] : new Date().getFullYear();

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

    let netControlBS = Array(13).fill(0); 

    allTransactions.forEach(tx => {
        const date = new Date(tx.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; 

        let acId = tx.accountCode;
        if (!acId) return; 

        const acObj = codes.find(c => String(c._id) === String(acId));
        if (!acObj) return;

        const code = acObj.code;
        const amount = parseFloat(tx.amount || 0);

        let signedAmount = amount;
        if (code.startsWith('1')) {
            signedAmount = -amount;
        }

        if (year < currentYear) {
            if (bsData[code]) {
                openingBalances[code] += signedAmount;
            }
            netControlBS[0] += amount;
        } else if (year === currentYear) {
            if (plData[code]) {
                plData[code].months[month] += signedAmount;
                plData[code].months[0] += signedAmount; 
            } else if (bsData[code]) {
                bsData[code].months[month] += signedAmount;
            }
            netControlBS[month] += amount;
        }
    });

    if (bsData['10130']) {
        openingBalances['10130'] += netControlBS[0];
        for (let m = 1; m <= 12; m++) {
            bsData['10130'].months[m] += netControlBS[m];
        }
    }

    allJournals.forEach(je => {
        if (je.status !== 'Posted') return;
        const date = new Date(je.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        je.lines.forEach(line => {
            const acObj = codes.find(c => String(c._id) === String(line.accountCode));
            if (!acObj) return;
            const code = acObj.code;

            let signedAmount = 0;
            if (code.startsWith('1')) {
                signedAmount = line.debit - line.credit;
            } else {
                signedAmount = line.credit - line.debit;
            }

            if (year < currentYear) {
                if (bsData[code]) openingBalances[code] += signedAmount;
            } else if (year === currentYear) {
                if (plData[code]) {
                    plData[code].months[month] += signedAmount;
                    plData[code].months[0] += signedAmount;
                } else if (bsData[code]) {
                    bsData[code].months[month] += signedAmount;
                }
            }
        });
    });

    Object.keys(bsData).forEach(code => {
        let running = openingBalances[code];
        for (let m = 1; m <= 12; m++) {
            running += bsData[code].months[m];
            bsData[code].months[m] = running; 
        }
        bsData[code].months[0] = running;
    });

    const bsResult = Object.values(bsData).filter(r => r.months[0] !== 0 && r.months[12] !== 0);
    console.log("BS rows (original filter):", bsResult.length);
    
    // Better filter
    const bsResultBetter = Object.values(bsData).filter(r => Math.abs(r.months[0]) > 0.01 || r.months.some(v => Math.abs(v) > 0.01));
    console.log("BS rows (better filter):", bsResultBetter.length);
    if(bsResultBetter.length > 0) console.log(bsResultBetter[0]);

    process.exit(0);
}

run();
