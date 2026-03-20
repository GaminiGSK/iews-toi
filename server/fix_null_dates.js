const mongoose = require('mongoose');

async function fixDates() {
    let uri = 'mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0';
    await mongoose.connect(uri);
    
    // Check for fully missing dates
    let bsCol = mongoose.connection.collection('bankstatements');
    let txCol = mongoose.connection.collection('transactions');
    
    let allBs = await bsCol.find({}).toArray();
    let bsNoDate = allBs.filter(b => !b.date);
    console.log(`BS missing date: ${bsNoDate.length}`);
    
    for (let b of bsNoDate) {
        await bsCol.deleteOne({ _id: b._id });
        console.log(`Deleted invalid BS without date: ${b._id}`);
    }

    let allTx = await txCol.find({}).toArray();
    let txNoDate = allTx.filter(t => !t.date);
    let txInvalidDate = allTx.filter(t => t.date && isNaN(new Date(t.date).getTime()));
    
    console.log(`TX missing date: ${txNoDate.length}`);
    console.log(`TX invalid date string: ${txInvalidDate.length}`);
    
    for (let t of txNoDate) {
        await txCol.deleteOne({ _id: t._id });
        console.log(`Deleted invalid TX without date: ${t._id}`);
    }
    
    for (let t of txInvalidDate) {
        // Just arbitrarily set it to today so it stops crashing the aggregate
        await txCol.updateOne({ _id: t._id }, { $set: { date: new Date() }});
        console.log(`Fixed totally invalid TX date string: ${t._id}`);
    }

    console.log('Done scanning for absolute invalid dates.');
    process.exit(0);
}

fixDates();
