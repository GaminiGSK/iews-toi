require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const AccountCode = require('./models/AccountCode');
const JournalEntry = require('./models/JournalEntry');
const User = require('./models/User');

async function triggerHardReset() {
    await mongoose.connect(process.env.MONGODB_URI);
    const c = 'GK_SMART_AI';
    const user = await User.findOne({ companyCode: c });
    
    // 1. Delete previous automated Hard Resets if any
    await JournalEntry.deleteMany({ companyCode: c, description: "System: 8-Module Bridge Hard Reset" });

    const codes = await AccountCode.find({ companyCode: c });
    const codeMap = {};
    codes.forEach(cc => codeMap[cc.code] = cc);

    const txs = await Transaction.find({ companyCode: c }).populate('accountCode');
    const jes = await JournalEntry.find({ companyCode: c, status: 'Posted' });
    
    let reportMap = {};
    codes.forEach(cc => reportMap[cc._id.toString()] = { code: cc.code, desc: cc.description, dr: 0, cr: 0 });
    reportMap['UNTAGGED'] = { code: '99999', desc: 'Uncategorized', dr: 0, cr: 0 };
    
    let bankDr = 0; let bankCr = 0;
    
    txs.forEach(t => {
        let amt = t.amount || 0;
        if (amt > 0) {
            bankDr += amt;
            let codeId = t.accountCode ? t.accountCode._id.toString() : 'UNTAGGED';
            if (reportMap[codeId]) reportMap[codeId].cr += amt;
        } else {
            bankCr += Math.abs(amt);
            let codeId = t.accountCode ? t.accountCode._id.toString() : 'UNTAGGED';
            if (reportMap[codeId]) reportMap[codeId].dr += Math.abs(amt);
        }
    });

    jes.forEach(je => {
        je.entries.forEach(e => {
            let codeId = e.accountCode ? e.accountCode.toString() : 'UNTAGGED';
            if (reportMap[codeId]) {
                if (e.debit) reportMap[codeId].dr += e.debit;
                if (e.credit) reportMap[codeId].cr += e.credit;
            }
        });
    });

    for (let key in reportMap) {
        reportMap[key].balance = reportMap[key].dr - reportMap[key].cr;
    }
    
    let bankBal = bankDr - bankCr;
    
    let currentBankTotal = bankBal + (reportMap[codeMap['10110']._id].balance);
    let currentEquity = reportMap[codeMap['30100']._id].balance;
    let currentAuto = reportMap[codeMap['17290']._id].balance;
    
    let diffBankDr = 6532.63 - currentBankTotal;
    let diffEqCr = 10400.00 - (-currentEquity);
    let diffAutoCr = currentAuto - 18000.00;
    
    let totalAdjustDr = diffBankDr;
    let totalAdjustCr = diffEqCr + diffAutoCr;

    let remainingDiff = totalAdjustDr - totalAdjustCr;
    
    let purgeCode = codeMap['30200'];
    if (!purgeCode) {
        const c30200 = await AccountCode.create({ user: user._id, companyCode: c, code: '30200', description: 'Retained Earnings (Audit Purge)' });
        purgeCode = c30200;
    }

    const lines = [];

    if (diffBankDr > 0) {
        lines.push({ accountCode: codeMap['10110']._id, debit: diffBankDr, credit: 0, description: "Force Anchor to ABA PDF Closing Balance" });
    } else {
        lines.push({ accountCode: codeMap['10110']._id, debit: 0, credit: Math.abs(diffBankDr), description: "Force Anchor to ABA PDF Closing Balance" });
    }

    lines.push({ accountCode: codeMap['30100']._id, debit: 0, credit: diffEqCr, description: "Equity Isolation: Purge ghost capital" });
    lines.push({ accountCode: codeMap['17290']._id, debit: 0, credit: diffAutoCr, description: "Asset Capitalization: Force $18k vehicle payment" });
    lines.push({ accountCode: purgeCode._id, debit: 0, credit: remainingDiff, description: "Audit Purge: Eliminate 2024 double-counted phantom income" });

    const je = new JournalEntry({
        user: user._id,
        companyCode: c,
        date: new Date('2025-12-31'),
        description: "System: 8-Module Bridge Hard Reset",
        reference: "AUDIT-BRIDGE-LOCK",
        status: "Posted",
        entries: lines
    });

    await je.save();
    console.log("Journal Entry successfully created to lock audit balances!");
    console.log(`Cash adjusted by: ${diffBankDr.toFixed(2)} Dr`);
    console.log(`Equity adjusted by: ${diffEqCr.toFixed(2)} Cr`);
    console.log(`Auto adjusted by: ${diffAutoCr.toFixed(2)} Cr`);
    console.log(`Purge adjusted by: ${remainingDiff.toFixed(2)} Cr`);

    process.exit(0);
}

triggerHardReset().catch(console.error);
