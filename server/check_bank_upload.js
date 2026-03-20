const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const bf2025 = await db.collection('bankfiles').find({ originalName: '1 jan march.jpg' }).toArray();
  console.log('BankFile obj:', JSON.stringify(bf2025, null, 2));

  process.exit(0);
});
