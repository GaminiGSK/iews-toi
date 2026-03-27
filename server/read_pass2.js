require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const CompanyProfile = require('./models/CompanyProfile');
        const doc = await CompanyProfile.findOne({ gdtUsername: 'gamini@ggmt.sg' });
        console.log("PASS:", doc ? doc.gdtPassword : "Not found");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
