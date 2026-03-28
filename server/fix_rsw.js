const m = require('mongoose');
m.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0')
  .then(async () => {
    const db = m.connection.db;
    await db.collection('users').updateOne({username: 'RSW'}, {$set: {role: 'unit'}});
    console.log('RSW role changed to unit');
    process.exit(0);
  });
