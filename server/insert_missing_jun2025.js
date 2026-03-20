const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Get one existing transaction to copy user/companyCode
  const sample = await db.collection('transactions').findOne({
    date: { $gte: new Date('2025-06-01') }
  });

  if (!sample) {
    console.log('ERROR: No sample transaction found');
    process.exit(1);
  }

  console.log('Using companyCode:', sample.companyCode);
  console.log('Using user:', sample.user);

  // The 3 missing June 2025 transactions from the physical ABA bank statement
  // Statement period: Apr 1 - Jun 30, 2025 (Page 3/3)
  const missingTx = [
    {
      user: sample.user,
      companyCode: sample.companyCode,
      date: new Date('2025-06-11T08:08:00.000Z'),
      description: 'TRF from/to other A/C in ABA. FUNDS RECEIVED FROM GUNASINGHA KASSAPA GAMINI (009 165 879) ORIGINAL AMOUNT 5,400.00 USD REF# 100FT34761159591 - Owners Capital',
      amount: 5400.00,   // POSITIVE = Money In
      currency: 'USD',
      transactionId: '100FT34761159591',
      tagSource: 'manual'
    },
    {
      user: sample.user,
      companyCode: sample.companyCode,
      date: new Date('2025-06-11T08:15:00.000Z'),
      description: 'Single transfer from/to ABA account. FUNDS TRANSFERRED TO GUNASINGHA KASSAPA GAMINI 000100117 ORIGINAL AMOUNT 1,000.00 USD REF# 100FT34761205167 - owner capital take back',
      amount: -1000.00,  // NEGATIVE = Money Out
      currency: 'USD',
      transactionId: '100FT34761205167',
      tagSource: 'manual'
    },
    {
      user: sample.user,
      companyCode: sample.companyCode,
      date: new Date('2025-06-16T10:55:00.000Z'),
      description: 'Single transfer from/to ABA account. FUNDS TRANSFERRED TO GUNASINGHA KASSAPA GAMINI 000100117 ORIGINAL AMOUNT 100.00 USD REF# 100FT34797185734 - owner capital take back',
      amount: -100.00,   // NEGATIVE = Money Out
      currency: 'USD',
      transactionId: '100FT34797185734',
      tagSource: 'manual'
    }
  ];

  const result = await db.collection('transactions').insertMany(missingTx);
  console.log('Inserted', result.insertedCount, 'missing transactions');

  // Verify new Q2 total
  const q2 = await db.collection('transactions').find({
    companyCode: sample.companyCode,
    date: { $gte: new Date('2025-04-01'), $lt: new Date('2025-07-01') }
  }).toArray();

  const inTotal = q2.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const outTotal = q2.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
  
  console.log('\n=== Q2 2025 VERIFICATION ===');
  console.log('Total TX in Q2:', q2.length);
  console.log('Money In:', inTotal.toFixed(2), '(bank says: 23,000.10)');
  console.log('Money Out:', outTotal.toFixed(2), '(bank says: 16,270.65)');
  const openingQ2 = 4179.13;
  const computedEnding = openingQ2 + inTotal - outTotal;
  console.log('Computed Ending Balance:', computedEnding.toFixed(2), '(bank says: 10,908.58)');

  process.exit(0);
});
