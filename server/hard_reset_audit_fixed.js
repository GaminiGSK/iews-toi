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
    
    // Accumulate transaction data properly
    txs.forEach(t => {
        let amt = t.amount || 0;
        let targetDr = 'dr';
        let targetCr = 'cr';
        
        let codeId = t.accountCode ? t.accountCode._id.toString() : 'UNTAGGED';
        
        if (amt > 0) {
            // Money In -> Tag is Credit
            bankDr += amt; // Money went into bank
            reportMap[codeId].cr += Math.abs(amt);
        } else {
            // Money Out -> Tag is Debit
            bankCr += Math.abs(amt); // Money left bank
            reportMap[codeId].dr += Math.abs(amt);
        }
    });

    jes.forEach(je => {
        if (!je.lines) return; // defensive
        je.lines.forEach(e => {
            let codeId = e.accountCode ? e.accountCode.toString() : 'UNTAGGED';
            if (reportMap[codeId]) {
                if (e.debit) reportMap[codeId].dr += e.debit;
                if (e.credit) reportMap[codeId].cr += e.credit;
            }
        });
    });

    // Bank Control calculated total (10130)
    let bankNetDr = 0;
    let bankNetCr = 0;
    let bankControlVal = bankDr - bankCr;
    if (bankControlVal > 0) {
        bankNetDr = bankControlVal;
    } else {
        bankNetCr = Math.abs(bankControlVal);
    }
    
    if (reportMap[codeMap['10130']._id]) {
        reportMap[codeMap['10130']._id].dr += bankNetDr;
        reportMap[codeMap['10130']._id].cr += bankNetCr;
    }

    for (let key in reportMap) {
        reportMap[key].balanceDr = reportMap[key].dr - reportMap[key].cr;
        reportMap[key].balanceCr = reportMap[key].cr - reportMap[key].dr;
    }
    
    // Check Current Status
    let currentBankTotalDr = reportMap[codeMap['10130']._id].balanceDr + reportMap[codeMap['10110']._id].balanceDr;
    let currentEquityCr = reportMap[codeMap['30100']._id].balanceCr;
    let currentAutoDr = reportMap[codeMap['17290']._id].balanceDr;
    
    console.log(`Current Bank Balance: ${currentBankTotalDr.toFixed(2)} Dr`);
    console.log(`Current Equity: ${currentEquityCr.toFixed(2)} Cr`);
    console.log(`Current Auto: ${currentAutoDr.toFixed(2)} Dr`);

    // Target Balances based on Audit Report
    // 10110 Cash + 10130 Bank Control = $6532.63 Dr
    // 30100 Equity = $10400.00 Cr
    // 17290 Auto = $18000.00 Dr
    
    let diffBankDr = 6532.63 - currentBankTotalDr;
    let diffEqCr = 10400.00 - currentEquityCr;
    let diffAutoDr = 18000.00 - currentAutoDr; // if < 0, it means it's overstated and we need to credit it.
    
    // Adjustments required (to be posted to the JE)
    const linesToPost = [];

    // 1. Bank
    if (diffBankDr > 0) {
        linesToPost.push({ accountCode: codeMap['10110']._id, debit: diffBankDr, credit: 0, description: "Force Anchor to ABA PDF Closing Balance" });
    } else if (diffBankDr < 0) {
        linesToPost.push({ accountCode: codeMap['10110']._id, debit: 0, credit: Math.abs(diffBankDr), description: "Force Anchor to ABA PDF Closing Balance" });
    }

    // 2. Equity
    if (diffEqCr > 0) {
        linesToPost.push({ accountCode: codeMap['30100']._id, debit: 0, credit: diffEqCr, description: "Equity Isolation: Purge ghost capital" });
    } else if (diffEqCr < 0) {
        linesToPost.push({ accountCode: codeMap['30100']._id, debit: Math.abs(diffEqCr), credit: 0, description: "Equity Isolation: Purge ghost capital" });
    }

    // 3. Auto
    if (diffAutoDr > 0) {
        linesToPost.push({ accountCode: codeMap['17290']._id, debit: diffAutoDr, credit: 0, description: "Asset Capitalization: Force vehicle payment" });
    } else if (diffAutoDr < 0) {
        linesToPost.push({ accountCode: codeMap['17290']._id, debit: 0, credit: Math.abs(diffAutoDr), description: "Asset Capitalization: Force vehicle payment" });
    }
    
    // 4. Balancing (Purge Account)
    let totalAdjustDr = linesToPost.reduce((sum, l) => sum + l.debit, 0);
    let totalAdjustCr = linesToPost.reduce((sum, l) => sum + l.credit, 0);

    let remainingDiff = totalAdjustDr - totalAdjustCr;
    
    let purgeCode = codeMap['30200'];
    if (!purgeCode) {
        const c30200 = await AccountCode.create({ user: user._id, companyCode: c, code: '30200', description: 'Retained Earnings (Audit Purge)' });
        purgeCode = c30200;
    }

    if (remainingDiff > 0) {
        linesToPost.push({ accountCode: purgeCode._id, debit: 0, credit: remainingDiff, description: "Audit Purge Balancing" });
    } else if (remainingDiff < 0) {
        linesToPost.push({ accountCode: purgeCode._id, debit: Math.abs(remainingDiff), credit: 0, description: "Audit Purge Balancing" });
    }

    if (linesToPost.length > 0) {
        const je = new JournalEntry({
            user: user._id,
            companyCode: c,
            date: new Date('2025-12-31'),
            description: "System: 8-Module Bridge Hard Reset",
            reference: "AUDIT-BRIDGE-LOCK",
            status: "Posted",
            lines: linesToPost // Fixed field name!
        });

        await je.save();
        console.log("Journal Entry successfully created to lock audit balances!");
        linesToPost.forEach(l => {
            console.log(`  Code ${l.accountCode} | Dr ${l.debit.toFixed(2)} | Cr ${l.credit.toFixed(2)} | ${l.description}`);
        });
    } else {
        console.log("No adjustments needed.");
    }

    process.exit(0);
}

triggerHardReset().catch(console.error);
