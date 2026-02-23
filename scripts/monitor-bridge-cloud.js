/**
 * monitor-bridge-cloud.js
 * This script runs in GitHub Actions to "poll" the Cloud Run Bridge.
 * It identifies unread instructions and logs them for the agent.
 */

const axios = require('axios');

// These will be set in GitHub Actions Secrets
const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:5000/api/bridge';
const BRIDGE_SECRET = process.env.BRIDGE_SECRET;

async function monitor() {
    console.log(`Checking bridge at: ${BRIDGE_URL}/unread`);

    try {
        const response = await axios.get(`${BRIDGE_URL}/unread`, {
            headers: { 'x-bridge-secret': BRIDGE_SECRET }
        });

        const entries = response.data;

        if (!entries || entries.length === 0) {
            console.log("No new instructions found.");
            return;
        }

        console.log(`🚀 FOUND ${entries.length} NEW INSTRUCTIONS:`);

        for (const entry of entries) {
            console.log(`-----------------------------------`);
            console.log(`ID: ${entry._id}`);
            console.log(`TYPE: ${entry.type}`);
            console.log(`CONTENT: ${JSON.stringify(entry.content, null, 2)}`);

            // In a real cloud agent scenario, this is where the action triggers.
            // For now, we log it so the GitHub Action output shows the task.
        }

    } catch (error) {
        console.error("Failed to poll bridge:", error.message);
        process.exit(1);
    }
}

monitor();
