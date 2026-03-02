const mongoose = require('mongoose');
require('dotenv').config();
const ExcelDocument = require('../models/ExcelDocument');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const docs = await ExcelDocument.find({});
        console.log(`ExcelDocument count: ${docs.length}`);

        docs.slice(0, 10).forEach(d => {
            console.log(`- ${d.originalName} | Status: ${d.status}`);
        });

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
