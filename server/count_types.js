const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const db = mongoose.connection.db;
  
  const allTxs = await db.collection('transactions').find({}).toArray();
  const accSet = new Set();
  allTxs.forEach(t => {
      if (t.debitAccount) accSet.add(t.debitAccount);
      if (t.creditAccount) accSet.add(t.creditAccount);
      if (t.bank && t.bank.bankName) accSet.add('Bank: ' + t.bank.bankName);
  });
  console.log('Unique Accounts:', Array.from(accSet).sort());

  const nativeBookings = await db.collection('transactions').countDocuments({ type: 'native_booking' });
  const bankBookings = await db.collection('transactions').countDocuments({ type: 'bank_statement' });
  
  console.log('native bookings:', nativeBookings);
  console.log('bank statement bookings:', bankBookings);

  // Group by type if possible
  const types = await db.collection('transactions').distinct('type');
  console.log('Types of transactions:', types);

  process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
