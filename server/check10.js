require('dotenv').config({path: './server/.env'});
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const T = require('./server/models/Transaction');
    
    // Find missing transactions
    const t10400 = await T.find({amount: 10400});
    console.log("10400 txs:", t10400.length);
    
    const opening = await T.find({description: {$regex: /opening|anchor/i}});
    console.log("Opening/Anchor txs:", opening);
    
    process.exit(0);
}
run();
