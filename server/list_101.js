const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const accs = await db.collection('accountcodes').find({ 
        companyCode: 'GK_SMART_AI'
    }).toArray();
    
    // Sort or filter for cash codes
    accs.filter(a => a.code.startsWith('101')).forEach(a => console.log(a.code, a.name || a.description));

    process.exit(0);
});
