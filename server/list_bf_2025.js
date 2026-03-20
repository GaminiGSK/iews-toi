const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const bf2025 = await db.collection('bankfiles').find({ dateRange: { $regex: '2025' } }).toArray();
  console.log('2025 Bank Files:');
  for(let bf of bf2025) {
     console.log(`- ${bf.originalName} (${bf.dateRange}): ${bf.transactionCount} tx`);
  }
  process.exit(0);
});
