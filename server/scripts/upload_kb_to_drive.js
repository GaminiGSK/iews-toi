require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function main() {
    const folderId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H"; // Blue Agent Knowledge Base root

    try {
        console.log("Creating Knowledge Base file in Drive...");
        const kbContent = `# Blue Agent Knowledge Base
This folder contains resources for the Blue Agent (AI) to learn about the tax forms and project logic.

## Project Structure
- **/server**: Express.js backend with agents (Analyst, Tax, Ingestion).
- **/client**: React frontend for the Tax Workspace.
- **/knowledge**: Guidelines and structural definitions.

## 21 Forms Detected
I have successfully indexed 21 form pages in the \`TOI FOAM\` subfolder:
- 1-1.jpg through 22-1.jpg

## AI Objectives
1. **Digitization**: Convert these JPG samples into high-fidelity React components (LiveTaxWorkspace.jsx).
2. **Data Consistency**: Ensure TIN (4-box-9-box) and Khmer formatting match these official standards.
3. **Logic Training**: Use these forms to understand the flow of the TOI 01 annual return.

## Visual Standards
- Use **Glassmorphism** for headers.
- Use **Kantumruy Pro** for Khmer text.
- Follow the exact government official layout seen in these scans.
`;

        const tempKbPath = path.join(__dirname, 'kb_drive_temp.md');
        fs.writeFileSync(tempKbPath, kbContent);

        const res = await drive.files.create({
            requestBody: {
                name: 'BLUE_AGENT_KB.md',
                parents: [folderId],
            },
            supportsAllDrives: true,
            media: {
                mimeType: 'text/markdown',
                body: fs.createReadStream(tempKbPath),
            },
            fields: 'id',
        });

        console.log(`✅ BLUE_AGENT_KB.md created. ID: ${res.data.id}`);
        fs.unlinkSync(tempKbPath);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
