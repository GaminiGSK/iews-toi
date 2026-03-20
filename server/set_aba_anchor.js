const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Set the verified ABA pre-import opening balance for GK SMART
  // Physical bank statement confirmed: Account had $148.85 on Apr 1, 2024
  // before any transactions were imported into this system
  const result = await db.collection('companyprofiles').updateOne(
    {},
    { $set: { abaOpeningBalance: 148.85 } }
  );
  console.log('Updated:', result.modifiedCount, 'profile(s)');
  
  const profile = await db.collection('companyprofiles').findOne({});
  console.log('Company:', profile.companyNameEn || profile.companyCode);
  console.log('ABA Opening Balance set to: $', profile.abaOpeningBalance);
  console.log('Expected 2025 opening: $148.85 + (-$99.77 net 2024) = $49.08');
  process.exit(0);
});
