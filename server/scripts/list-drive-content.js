const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function listKnowledgeFiles() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.resolve(__dirname, '../', process.env.GOOGLE_APPLICATION_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const folders = [
            { name: 'Financial Statement preperation', id: '1at2rQXWw38_0VE0ze_yOZtE8XnPU2-nO' },
            { name: 'Book keeping knowledge', id: '1fUQCFf1LLFb8krzBMoB6RFYu6YEvdVNB' },
            { name: 'TOI FOAM', id: '1fwscsWO7cyuW7rAthUQz-sFDhZIjeDJW' }
        ];

        for (const target of folders) {
            console.log(`\n--- Listing: ${target.name} (${target.id}) ---`);
            const res = await drive.files.list({
                q: `'${target.id}' in parents and trashed = false`,
                fields: 'files(id, name, mimeType)',
                pageSize: 10 // Limit for now to check types
            });
            res.data.files.forEach(f => {
                console.log(`- ${f.name} [${f.mimeType}]`);
            });
        }
    } catch (err) {
        console.error('Error listing files:', err.message);
    }
}

listKnowledgeFiles();
