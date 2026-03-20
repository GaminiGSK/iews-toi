const mongoose = require('mongoose');

async function fixDates() {
    let uri = 'mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0';
    await mongoose.connect(uri);
    
    // Find bank statements where date is a string instead of a strict Date object
    let bs = await mongoose.connection.collection('bankstatements').find({ 
        date: { $type: "string" } 
    }).toArray();
    
    console.log(`Found ${bs.length} BankStatements with string dates.`);
    
    for (let doc of bs) {
        let d = new Date(doc.date);
        if(!isNaN(d.getTime())) {
            await mongoose.connection.collection('bankstatements').updateOne(
                { _id: doc._id }, 
                { $set: { date: d } }
            );
        }
    }

    // Find transactions where date is a string instead of a strict Date object
    let tx = await mongoose.connection.collection('transactions').find({ 
        date: { $type: "string" } 
    }).toArray();
    
    console.log(`Found ${tx.length} Transactions with string dates.`);

    for (let doc of tx) {
        let d = new Date(doc.date);
        if(!isNaN(d.getTime())) {
            await mongoose.connection.collection('transactions').updateOne(
                { _id: doc._id }, 
                { $set: { date: d } }
            );
        }
    }

    console.log('Successfully coerced all dates to secure ISODate objects.');
    process.exit(0);
}

fixDates();
