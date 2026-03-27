require('dotenv').config();
const mongoose = require('mongoose');

async function debugTB() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Transaction = require('./models/Transaction');
    const JournalEntry = require('./models/JournalEntry');
    const AccountCode = require('./models/AccountCode');
    const ExchangeRate = require('./models/ExchangeRate');

    const companyCode = 'GK_SMART_AI';
    const year = 2025;

    const glMap = {};
    const accumulate = (tc, dr, cr) => {
        if (!tc) return;
        if (!glMap[tc]) glMap[tc] = { dr: 0, cr: 0 };
        glMap[tc].dr += dr || 0;
        glMap[tc].cr += cr || 0;
    };

    const rates = await ExchangeRate.find({ companyCode }).lean();
    const getRate = (d) => {
        const y = new Date(d).getFullYear();
        const r = rates.find(rt => rt.year === y);
        return r ? r.rate : 4083;
    };

    const txns = await Transaction.find({ companyCode, date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } }).populate('accountCode');
    for (const tx of txns) {
        if (!tx.accountCode) continue;
        const tc = tx.accountCode.toiCode;
        if (!tc) continue;
        const amt = Math.abs(tx.amount) * getRate(tx.date);
        if (tx.amount > 0) accumulate(tc, amt, 0);
        else accumulate(tc, 0, amt);
    }

    const jes = await JournalEntry.find({ companyCode, status: 'Posted', date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } }).populate('lines.accountCode');
    for (const je of jes) {
        const r = getRate(je.date);
        for (const ln of je.lines) {
            const tc = ln.accountCode?.toiCode;
            if (!tc) continue;
            accumulate(tc, ln.debit * r, ln.credit * r);
        }
    }

    console.log("GL MAP (ToiCodes):", glMap);
    
    // Net profit
    const glExp = (tc) => Math.max(glMap[tc]?.dr || 0, glMap[tc]?.cr || 0);
    const revenue = Math.max((glMap['I02']?.cr||0) - (glMap['I02']?.dr||0), (glMap['I02']?.dr||0) - (glMap['I02']?.cr||0)) || 0;
    const salary = glExp('B23') + glExp('B24') + glExp('B25');
    const dep = glExp('B27') + glExp('B36') + glExp('E30');
    
    const b41 = glExp('B41');
    const b33 = glExp('B33');
    const other = b41 + b33;

    console.log("Revenue (I02):", revenue);
    console.log("Salary (B23+):", salary);
    console.log("Depreciation (E30+):", dep);
    console.log("B41:", b41, "B33:", b33);
    console.log("Other (Bnn):", other);
    console.log("Profit:", revenue - (salary + dep + other));
    
    process.exit();
}
debugTB();
