const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0').then(async () => {
    const Transaction = require('../models/Transaction');
    const txs = await Transaction.find({ companyCode: 'GKSMART' });
    let totalIn = 0, totalOut = 0;
    const details = [];
    txs.forEach(t => {
        let amtStr = String(t.amount);
        let parsed = Number(amtStr.replace(/[^0-9.-]+/g, ''));
        if (isNaN(parsed)) parsed = 0;
        
        if(parsed > 5000) {
            details.push(`High Value TX: ${t.date} | ${t.description} | ${t.amount} -> ${parsed}`);
        }

        if (parsed > 0) totalIn += parsed;
        else totalOut += Math.abs(parsed);
    });
    console.log('Txs count: ', txs.length);
    console.log('In: ', totalIn);
    console.log('Out: ', totalOut);
    console.log(details.join('\n'));
    process.exit(0);
});
