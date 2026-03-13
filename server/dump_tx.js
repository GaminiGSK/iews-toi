const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const db = mongoose.connection.db;
  const t1 = await db.collection('transactions').findOne({});
  console.log(t1);
  process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
