const mongoose = require('mongoose');
const Bridge = require('../models/Bridge');
require('dotenv').config({ path: './.env' });

async function monitorLiveChat() {
    console.log("📡 Connecting to Datacenter...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Established Live Connection to Bridge. Monitoring for AI responses...\n");

    let lastCheckedTime = new Date();

    setInterval(async () => {
        try {
            const logs = await Bridge.find({
                type: 'live_chat_log',
                createdAt: { $gt: lastCheckedTime }
            }).sort({ createdAt: 1 });

            if (logs.length > 0) {
                lastCheckedTime = new Date();
                logs.forEach(log => {
                    console.log(`\n===========================================`);
                    console.log(`🕒 [${log.createdAt.toLocaleTimeString()}] | ${log.source}`);
                    console.log(`👤 USER: ${log.content?.userQuery || 'N/A'}`);
                    console.log(`🤖 BLUE AGENT: ${log.content?.aiResponse || 'N/A'}`);
                    if (log.content?.toolAction) {
                        console.log(`🔧 TOOL FIRED:`, log.content.toolAction);
                    }
                    console.log(`===========================================\n`);
                });
            }
        } catch (e) {
            console.error("Poll Error:", e.message);
        }
    }, 2000); // Poll every 2 seconds
}

monitorLiveChat();
