const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkGGMT() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const sourceConn = await mongoose.createConnection(process.env.MONGODB_URI.replace('/gksmart_live?', '/test?')).asPromise();

        const count = await sourceConn.db.collection('bankfiles').countDocuments({ companyCode: 'GGMT' });
        console.log('GGMT Bank Files in test: ' + count);

        const allCodes = await sourceConn.db.collection('bankfiles').distinct('companyCode');
        console.log('All company codes in test bankfiles: ' + allCodes.join(', '));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkGGMT();
