---
description: Check the Bridge for incoming instructions from external Gemini chats
---

1. Check for unread bridge entries
// turbo
2. Run a script to fetch and display unread bridge data
```powershell
node -e "
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
"
```
3. Acknowledge the entries after reading them
// turbo
4. Run a script to mark entries as acknowledged
```powershell
node -e "
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
"
```
5. Based on the extracted instructions, proceed with the requested coding or monitoring tasks.
