require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const AccountCode = require('./models/AccountCode');
const JournalEntry = require('./models/JournalEntry');

async function testTB() {
    await mongoose.connect(process.env.MONGODB_URI);
    const c = 'GK_SMART_AI';
    const currentYear = 2025;
    const isAllYears = false;

    const codes = await AccountCode.find({ companyCode: c }).lean();
    const transactions = await Transaction.find({ companyCode: c }).populate('accountCode').lean();
    const journalEntries = await JournalEntry.find({ companyCode: c, status: 'Posted' }).lean();

    const reportMap = {};
    codes.forEach(c => {
        reportMap[c._id.toString()] = { 
            code: c.code, 
            description: c.description,
            drUSD: 0, 
            crUSD: 0 
        };
    });

    let netControlUSD = 0;

    transactions.forEach(tx => {
        const amtUSD = tx.amount;
        if (amtUSD === undefined) return;
        const txYear = new Date(tx.date).getFullYear();

        if (txYear === currentYear) {
            netControlUSD += amtUSD;
        } else {
            return;
        }

        let codeId = tx.accountCode ? tx.accountCode._id.toString() : 'UNTAGGED';
        if (!reportMap[codeId]) return;

        if (amtUSD > 0) {
            reportMap[codeId].crUSD += Math.abs(amtUSD);
        } else {
            reportMap[codeId].drUSD += Math.abs(amtUSD);
        }
    });

    journalEntries.forEach(je => {
        const jeYear = new Date(je.date).getFullYear();
        if (jeYear !== currentYear) return;

        je.lines.forEach(line => {
            const codeId = line.accountCode.toString();
            if (!reportMap[codeId]) return;

            if (line.debit > 0) {
                reportMap[codeId].drUSD += line.debit;
            }
            if (line.credit > 0) {
                reportMap[codeId].crUSD += line.credit;
            }
        });
    });

    const bankCode = codes.find(c => c.code === '10130');
    if (bankCode && reportMap[bankCode._id.toString()]) {
        if (netControlUSD > 0) {
            reportMap[bankCode._id.toString()].drUSD += netControlUSD;
        } else {
            reportMap[bankCode._id.toString()].crUSD += Math.abs(netControlUSD);
        }
    }

    const report = Object.values(reportMap);
    let totalAssets = 0;
    report.filter(r => r.code.startsWith('1')).forEach(r => {
        totalAssets += (r.drUSD - r.crUSD);
    });

    let totalEquity = 0;
    report.filter(r => r.code.startsWith('3')).forEach(r => {
        totalEquity += (r.crUSD - r.drUSD);
    });

    console.log("Assets:", totalAssets);
    console.log("Equity:", totalEquity);

    process.exit(0);
}

testTB().catch(console.error);
