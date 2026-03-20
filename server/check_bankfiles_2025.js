const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const bfAll = await db.collection('bankfiles').find({}).toArray();
  const bf2025 = bfAll.filter(f => JSON.stringify(f).includes('2025'));
  
  console.log('Total Bank Files:', bfAll.length);
  console.log('2025 Bank Files:', bf2025.length);
  if(bf2025.length > 0) {
    console.log('Sample 2025 BF:', bf2025[0]);
  }
  process.exit(0);
});
