const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const start2025 = new Date('2025-01-01');
  const end2025 = new Date('2026-01-01');

  // Let's check Transactions for 2025
  const tx2025 = await db.collection('transactions').find({ 
    $or: [
      { date: { $gte: start2025, $lt: end2025 } },
      { date: { $regex: '2025' } }
    ]
  }).toArray();
  console.log('2025 GL TX count:', tx2025.length);
  if(tx2025.length > 0) {
    console.log('Sample TX:', tx2025[0]);
  }

  // Check BankStatement for 2025
  const bs2025 = await db.collection('bankstatements').find({ 
    $or: [
      { date: { $gte: start2025, $lt: end2025 } },
      { date: { $regex: '2025' } }
    ]
  }).toArray();
  console.log('2025 BS count:', bs2025.length);
  if(bs2025.length > 0) {
    console.log('Sample BS:', bs2025[0]);
  }
  
  process.exit(0);
});
