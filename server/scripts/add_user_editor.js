const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function addEditor() {
    const fileId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    const userEmail = "gamini.vat80@gmail.com";

    try {
        console.log(`Setting ${userEmail} as Editor...`);
        const res = await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: userEmail,
            },
            sendNotificationEmail: true,
        });

        console.log(`✅ SUCCESS: ${userEmail} is now an Editor! Check your email.`);
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

addEditor();
