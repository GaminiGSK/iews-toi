const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const db = mongoose.connection.db;
  
  const bankStatements = await db.collection('transactions').countDocuments({ tagSource: 'bank_statement_restore' });
  const total = await db.collection('transactions').countDocuments();
  
  console.log('Total transactions in GL:', total);
  console.log('Transactions imported from Bank Statements:', bankStatements);

  process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
