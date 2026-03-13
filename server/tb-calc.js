require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const AccountCode = require('./models/AccountCode');
const JournalEntry = require('./models/JournalEntry');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const c = 'GK_SMART_AI';
    const txs = await Transaction.find({companyCode: c}).populate('accountCode');
    const codes = await AccountCode.find({companyCode: c});
    const jes = await JournalEntry.find({companyCode: c, status: 'Posted'});
    
    let reportMap = {};
    codes.forEach(cc => reportMap[cc._id.toString()] = {code: cc.code, desc: cc.description, dr: 0, cr: 0});
    reportMap['UNTAGGED'] = {code: '99999', desc: 'Uncategorized', dr: 0, cr: 0};
    
    let bankDr = 0; let bankCr = 0;
    
    txs.forEach(t => {
        let amt = t.amount || 0;
        if(amt > 0) {
            bankDr += amt;
            let codeId = t.accountCode ? t.accountCode._id.toString() : 'UNTAGGED';
            reportMap[codeId].cr += amt;
        } else {
            bankCr += Math.abs(amt);
            let codeId = t.accountCode ? t.accountCode._id.toString() : 'UNTAGGED';
            reportMap[codeId].dr += Math.abs(amt);
        }
    });

    jes.forEach(je => {
        je.entries.forEach(e => {
            let codeId = e.accountCode ? e.accountCode.toString() : 'UNTAGGED';
            if(reportMap[codeId]) {
                if(e.debit) reportMap[codeId].dr += e.debit;
                if(e.credit) reportMap[codeId].cr += e.credit;
            }
        });
    });
    
    let assets = [];
    Object.values(reportMap).forEach(r => {
        if(r.code.startsWith('1')) {
            assets.push({name: r.desc, size: r.dr - r.cr, code: r.code});
        }
    });
    // Add Bank manually
    assets.push({name: 'Bank Control', size: bankDr - bankCr, code: '10130'});
    
    console.log("ASSETS:", Object.values(assets).filter(a => a.size !== 0));
    
    let liab = [];
    Object.values(reportMap).forEach(r => {
        if(r.code.startsWith('2')) {
            liab.push({name: r.desc, size: r.cr - r.dr, code: r.code});
        }
    });
    
    console.log("LIABILITIES:", Object.values(liab).filter(a => a.size !== 0));
    
    let inc = 0; let exp = 0;
    Object.values(reportMap).forEach(r => {
        if(r.code.startsWith('4') || r.code.startsWith('7') || r.code.startsWith('8') || r.code.startsWith('9')) {
            inc += (r.cr - r.dr);
        }
        if(r.code.startsWith('5') || r.code.startsWith('6')) {
            exp += (r.dr - r.cr);
        }
    });
    let netProfit = inc - exp;
    
    let eq = [];
    Object.values(reportMap).forEach(r => {
        if(r.code.startsWith('3')) {
            eq.push({name: r.desc, size: r.cr - r.dr, code: r.code});
        }
    });
    eq.push({name: 'Net Profit', size: netProfit, code: 'N/A'});
    console.log("EQUITY:", Object.values(eq).filter(a => a.size !== 0));

    console.log("Net Income:", inc, "Expense:", exp, "Profit:", netProfit);
    
    process.exit(0);
});
