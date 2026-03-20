const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Find Jun 01 2025 $0.10 interest entries
  const jun01 = await db.collection('transactions').find({
    date: { $gte: new Date('2025-06-01'), $lt: new Date('2025-06-02') },
    amount: 0.10
  }).toArray();

  console.log('Jun 01 interest entries in DB:', jun01.length);
  jun01.forEach(t => console.log(t._id, t.amount, t.description));

  if (jun01.length > 1) {
    // Remove the extra duplicate (keep first, delete second)
    const toDelete = jun01[1]._id;
    await db.collection('transactions').deleteOne({ _id: toDelete });
    console.log('Deleted duplicate:', toDelete);
  }

  // Final Q2 verification
  const q2 = await db.collection('transactions').find({
    date: { $gte: new Date('2025-04-01'), $lt: new Date('2025-07-01') }
  }).toArray();

  const inTotal = q2.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const outTotal = q2.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
  const openingQ2 = 4179.13;
  const computedEnding = openingQ2 + inTotal - outTotal;

  console.log('\n=== Q2 FINAL VERIFICATION ===');
  console.log('Money In:', inTotal.toFixed(2), '| bank: 23,000.10', inTotal.toFixed(2) === '23000.10' ? '✅' : '❌');
  console.log('Money Out:', outTotal.toFixed(2), '| bank: 16,270.65', outTotal.toFixed(2) === '16270.65' ? '✅' : '❌');
  console.log('Ending Balance:', computedEnding.toFixed(2), '| bank: 10,908.58', computedEnding.toFixed(2) === '10908.58' ? '✅' : '❌');

  process.exit(0);
});
