const mongoose = require('mongoose');
const Bridge = require('./server/models/Bridge');
require('dotenv').config({ path: './server/.env' });

async function ack() {
    await mongoose.connect(process.env.MONGODB_URI);
    await Bridge.updateMany({ status: 'unread' }, { status: 'acknowledged' });
    console.log('Acknowledged all unread entries.');
    process.exit(0);
}
ack();
