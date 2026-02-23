require('dotenv').config();
const { createFolder, findFolder } = require('../services/googleDrive');

async function main() {
    const parentId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const folderName = "Blue Agent Knowledge Base";

    try {
        console.log(`Searching for folder: ${folderName}...`);
        let folder = await findFolder(folderName, parentId);

        if (!folder) {
            console.log(`Folder not found. Creating '${folderName}'...`);
            folder = await createFolder(folderName, parentId);
            console.log(`✅ Created Folder ID: ${folder.id}`);
        } else {
            console.log(`ℹ️ Folder already exists. ID: ${folder.id}`);
        }

        console.log(`\nURL: https://drive.google.com/drive/folders/${folder.id}`);
    } catch (error) {
        console.error('❌ Failed to create folder:', error.message);
        process.exit(1);
    }
}

main();
