const mongoose = require('mongoose');
const Bridge = require('./server/models/Bridge');
require('dotenv').config({ path: './server/.env' });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const entries = await Bridge.find({ status: 'unread' });
    if (entries.length === 0) {
        console.log('No unread bridge entries found.');
    } else {
        console.log('--- UNREAD BRIDGE ENTRIES ---');
        entries.forEach(e => {
            console.log(`[${e.type}] from ${e.source}: ${JSON.stringify(e.content, null, 2)}`);
        });
    }
    process.exit(0);
}
check();
