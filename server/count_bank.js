const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const db = mongoose.connection.db;
  
  // Account 10100 represents Cash in Bank
  const bankTxCount = await db.collection('transactions').countDocuments({
     $or: [ { debitAccount: '10100' }, { creditAccount: '10100' } ]
  });

  const totalTxs = await db.collection('transactions').countDocuments();

  console.log('Total general ledger transactions:', totalTxs);
  console.log('Number of bank account (10100) transactions in the DB:', bankTxCount);

  process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
