const mongoose = require('mongoose');
const s = new mongoose.Schema({}, { strict: false });
const T = mongoose.model('Transaction', s);

mongoose.connect('mongodb+srv://developer:fD0E5p72M5vEw1A4@cluster0.z5p1b.mongodb.net/gksmart_db').then(async () => {
  const txs = await T.find({
    companyCode: 'RSW',
    date: { $gte: new Date('2025-01-01'), $lte: new Date('2025-12-31') }
  }).sort({ date: 1 }).lean();

  const inSum = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const outSum = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  console.log('Count:', txs.length);
  console.log('IN:', inSum);
  console.log('OUT:', outSum);
  console.log('Diff:', inSum - outSum);
  console.log('First 3:', txs.slice(0, 3).map(t => ({ d: t.date, a: t.amount })));
  console.log('Last 3:', txs.slice(-3).map(t => ({ d: t.date, a: t.amount })));
  process.exit(0);
});
