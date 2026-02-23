require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function main() {
    const folderId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    const uploadDir = path.join(__dirname, '../uploads');

    try {
        // 1. Share folder (Anyone with link as editor)
        console.log("Setting folder permissions...");
        await drive.permissions.create({
            fileId: folderId,
            requestBody: {
                role: 'writer',
                type: 'anyone',
            },
            supportsAllDrives: true,
        });
        console.log("✅ Folder is now public (anyone with link can edit).");

        // 2. Upload existing JPGs from uploads folder
        const files = fs.readdirSync(uploadDir);
        for (const file of files) {
            if (file.toLowerCase().endsWith('.jpg')) {
                const filePath = path.join(uploadDir, file);
                console.log(`Uploading ${file}...`);
                await drive.files.create({
                    requestBody: {
                        name: file,
                        parents: [folderId],
                    },
                    supportsAllDrives: true,
                    media: {
                        mimeType: 'image/jpeg',
                        body: fs.createReadStream(filePath),
                    },
                });
            }
        }
        console.log("✅ JPGs uploaded.");

        // 3. Create AI Knowledge Base file
        console.log("Creating Knowledge Base file...");
        const kbContent = `# Blue Agent Knowledge Base
This folder contains resources for the Blue Agent (AI) to learn about the tax forms and project logic.

## Project Structure
- **/server**: Express.js backend with agents (Analyst, Tax, Ingestion).
- **/client**: React frontend for the Tax Workspace.
- **/knowledge**: (This folder) Contains form samples and guidelines.

## AI Guidelines
1. **Consistency**: All forms must follow the GDT (General Department of Taxation) standards for Khmer and English text.
2. **Formatting**: TIN numbers must always be 4-box-9-box format.
3. **Accuracy**: Calculations must be double-checked against the official tax laws of Cambodia.

## Forms in this folder
The JPG files are samples of the physical forms that need to be digitized and analyzed by the AI.
`;

        const tempKbPath = path.join(__dirname, 'kb_temp.md');
        fs.writeFileSync(tempKbPath, kbContent);

        await drive.files.create({
            requestBody: {
                name: 'BLUE_AGENT_KB.md',
                parents: [folderId],
            },
            supportsAllDrives: true,
            media: {
                mimeType: 'text/markdown',
                body: fs.createReadStream(tempKbPath),
            },
        });
        fs.unlinkSync(tempKbPath);
        console.log("✅ Knowledge Base MD created.");

        console.log(`\nDONE! Your folder is ready at: https://drive.google.com/drive/folders/${folderId}`);
        console.log(`Service Account Email: toi-system-manager@ambient-airlock-286506.iam.gserviceaccount.com`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
