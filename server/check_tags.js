const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const tx2025 = await db.collection('transactions').find({
    date: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') }
  }).toArray();
  
  const tags = new Set();
  tx2025.forEach(tx => tags.add(tx.tagSource || 'NONE'));
  
  console.log('2025 TX Tag Sources:', Array.from(tags));
  if (tags.has('bankFileId') || tx2025.some(t => t.bankFileId)) {
     console.log('Some have bankFileId');
  }

  // list some samples of different tagSources
  tags.forEach(tag => {
     console.log('Sample for tag', tag, tx2025.find(t => t.tagSource === tag || (!t.tagSource && tag === 'NONE')));
  });

  process.exit(0);
});
