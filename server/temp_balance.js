const mongoose = require('mongoose');
const s = new mongoose.Schema({}, { strict: false });
const T = mongoose.model('Transaction', s);

mongoose.connect('mongodb+srv://developer:fD0E5p72M5vEw1A4@cluster0.z5p1b.mongodb.net/gksmart_db').then(async () => {
  const txs = await T.find({ companyCode: 'RSW', date: { $gte: new Date('2025-01-01'), $lte: new Date('2025-12-31') } }).sort({ date: 1 }).lean();
  const first = txs[0];
  const last = txs[txs.length - 1];
  console.log('First Tx:', 'Amount:', first?.amount, 'Balance:', first?.balance, 'Desc:', first?.description);
  console.log('Last Tx:', 'Amount:', last?.amount, 'Balance:', last?.balance, 'Desc:', last?.description);
  console.log('Calculated net movement:', txs.reduce((a, b) => a + (b.amount||0), 0));
  
  // also find any obvious problem transactions like dupes?
  const amounts = {};
  txs.forEach(t => {
      amounts[t.amount] = (amounts[t.amount] || 0) + 1;
  });
  process.exit(0);
});
