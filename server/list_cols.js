const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const colls = await db.listCollections().toArray();
  console.log('Collections:', colls.map(c => c.name));
  process.exit(0);
});
