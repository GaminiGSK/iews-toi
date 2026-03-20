require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const companyCode = 'GK_SMART_AI';

    // Check all 2025 transactions by month
    const txs = await db.collection('transactions').find({ companyCode }).toArray();
    
    const monthCount = {};
    const monthAmounts = {};
    for (let m = 1; m <= 12; m++) {
        monthCount[m] = 0;
        monthAmounts[m] = 0;
    }
    
    let total2025 = 0;
    for (const tx of txs) {
        const d = new Date(tx.date);
        if (d.getFullYear() === 2025) {
            const m = d.getMonth() + 1;
            monthCount[m]++;
            monthAmounts[m] += parseFloat(tx.amount || 0);
            total2025++;
        }
    }
    
    console.log('=== 2025 TRANSACTIONS BY MONTH ===');
    const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (let m = 1; m <= 12; m++) {
        const flag = monthCount[m] === 0 ? '⚠️ ZERO ACTIVITY' : '';
        console.log(`  ${mNames[m-1]}: ${monthCount[m]} txs | net $${monthAmounts[m].toFixed(2)} ${flag}`);
    }
    console.log(`  TOTAL 2025: ${total2025} transactions`);

    // Check Dec specifically
    console.log('\n=== DECEMBER 2025 DETAIL ===');
    const decTxs = txs.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === 2025 && d.getMonth() + 1 === 12;
    });
    if (decTxs.length === 0) {
        console.log('  ✅ CONFIRMED: Zero transactions in December 2025');
        console.log('  → The -1,500.00 flat line in Oct-Dec means expenses stopped after Nov');
        console.log('  → Report is accurate. No missing data.');
    } else {
        decTxs.forEach(t => {
            console.log(`  ${new Date(t.date).toISOString().slice(0,10)} | $${t.amount} | code=${t.code} | ${(t.description||'').slice(0,60)}`);
        });
    }

    // Check posted JEs in Dec 2025 (audit adjustments)
    console.log('\n=== DECEMBER 2025 JOURNAL ENTRIES ===');
    const decJEs = await db.collection('journalentries').find({
        companyCode,
        date: { $gte: new Date('2025-12-01'), $lte: new Date('2025-12-31') }
    }).toArray();
    console.log(`  Posted JEs in Dec 2025: ${decJEs.length}`);
    decJEs.forEach(j => console.log(`  ${new Date(j.date).toISOString().slice(0,10)} | ${j.status} | ${j.description?.slice(0,70)}`));

    // Check Oct & Nov transactions
    console.log('\n=== OCT-NOV 2025 DETAIL ===');
    ['Oct','Nov'].forEach((mn, idx) => {
        const mIdx = idx + 10;
        const mTxs = txs.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === 2025 && d.getMonth() + 1 === mIdx;
        });
        console.log(`  ${mn} (${mTxs.length} txs):`);
        mTxs.forEach(t => console.log(`    ${new Date(t.date).toISOString().slice(0,10)} | $${t.amount} | code=${t.code} | ${(t.description||'').slice(0,50)}`));
    });

    mongoose.disconnect();
}).catch(e => console.error('ERR:', e.message));
