const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const tx2025 = await db.collection('transactions').find({
    date: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') }
  }).toArray();
  
  console.log('2025 TXs:', tx2025.length);
  // summarize by code and what months they appear in
  const summary = {};
  for(let tx of tx2025) {
    const month = (tx.date.getMonth() + 1).toString().padStart(2, '0');
    if(!summary[tx.code]) summary[tx.code] = {};
    if(!summary[tx.code][month]) summary[tx.code][month] = 0;
    summary[tx.code][month] += tx.amount;
  }
  console.log(JSON.stringify(summary, null, 2));

  process.exit(0);
});
