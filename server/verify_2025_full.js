const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const allTx = await db.collection('transactions').find({
    date: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') }
  }).sort({ date: 1 }).toArray();

  // Group by month and show totals
  const months = {};
  allTx.forEach(t => {
    const m = new Date(t.date).getMonth() + 1;
    if (!months[m]) months[m] = { in: 0, out: 0, endBalance: 0 };
    if (t.amount > 0) months[m].in += t.amount;
    else months[m].out += Math.abs(t.amount);
  });

  console.log('=== 2025 BY MONTH (from DB) ===');
  const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let running = 49.08; // Verified anchor

  for (let m = 1; m <= 12; m++) {
    const d = months[m] || { in: 0, out: 0 };
    running += d.in - d.out;
    console.log(`${monthNames[m]}: IN=$${d.in.toFixed(2)} | OUT=$${d.out.toFixed(2)} | Ending Balance=$${running.toFixed(2)}`);
  }

  console.log('\n=== DETAILED TX LIST ===');
  allTx.forEach(t => {
    const d = new Date(t.date).toISOString().split('T')[0];
    const amt = parseFloat(t.amount || 0);
    console.log(`${d} | ${amt > 0 ? 'IN ' : 'OUT'} | $${Math.abs(amt).toFixed(2)}`);
  });

  process.exit(0);
});
