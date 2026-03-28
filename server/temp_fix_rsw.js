const m = require('mongoose');
m.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0')
  .then(async () => {
    const db = m.connection.db;
    const res = await db.collection('users').updateOne({username: 'RSW'}, {$set: {role: 'unit'}});
    console.log(res);
    process.exit(0);
  });
