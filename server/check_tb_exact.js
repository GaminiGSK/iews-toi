require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const AccountCode = require('./models/AccountCode');
const JournalEntry = require('./models/JournalEntry');

async function getTb() {
    await mongoose.connect(process.env.MONGODB_URI);
    const c = 'GK_SMART_AI';
    
    const codes = await AccountCode.find({ companyCode: c });
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
        let r = reportMap[key];
        r.balance = r.dr - r.cr;
        if (['10110', '30100', '17290', '10130', '10110'].includes(r.code)) {
            console.log(`${r.code} - ${r.desc}: Dr ${r.dr.toFixed(2)} | Cr ${r.cr.toFixed(2)} | Bal (Dr-Cr) ${r.balance.toFixed(2)}`);
        }
    }
    
    let bankBal = bankDr - bankCr;
    console.log(`10130 - Bank Control (Computed across all): Dr ${bankDr.toFixed(2)} | Cr ${bankCr.toFixed(2)} | Bal ${bankBal.toFixed(2)}`);
    console.log(`TOTAL LIQ (Bank Control + 10110 Cash): ${(bankBal + reportMap[codes.find(c=>c.code==='10110')._id].balance).toFixed(2)}`);

    process.exit(0);
}
getTb().catch(console.error);
