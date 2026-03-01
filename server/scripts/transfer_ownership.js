const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function transferOwnership() {
    const fileId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H"; // Blue Agent Knowledge Base
    const userEmail = "gamini.vat80@gmail.com";

    try {
        console.log(`Step 1: Adding ${userEmail} as a writer (with transfer ownership flag)...`);

        // Ownership transfer usually requires adding the user first as a writer
        // then updating the permission to owner.
        const res = await drive.permissions.create({
            fileId: fileId,
            transferOwnership: true,
            requestBody: {
                role: 'owner',
                type: 'user',
                emailAddress: userEmail,
            },
            supportsAllDrives: true,
        });

        console.log(`✅ SUCCESS: Ownership transferred to ${userEmail}!`);
        console.log(`The Service Account is now a 'writer' and you are the 'owner'.`);
        console.log(`Storage limits will now use your account quota.`);
    } catch (err) {
        console.error("❌ Transfer Error:", err.message);
        if (err.message.includes("permission to transfer ownership")) {
            console.log("Tip: Check if the user is in the same Google Workspace domain or if external sharing is limited.");
        }
    }
}

transferOwnership();
