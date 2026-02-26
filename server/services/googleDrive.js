const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

let driveInstance = null;

function getDrive() {
    if (driveInstance) return driveInstance;

    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const auth = new google.auth.GoogleAuth({
        keyFile: path.isAbsolute(keyPath) ? keyPath : path.resolve(__dirname, '../../', keyPath),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    driveInstance = google.drive({ version: 'v3', auth });
    return driveInstance;
}

/**
 * Upload a file to Google Drive
 * @param {string} filePath - Local path to the file
 * @param {string} mimeType - MIME type of the file
 * @param {string} originalName - Original filename (will be used in Drive)
 * @returns {Promise<string>} - The Google Drive File ID
 */
async function uploadFile(filePath, mimeType, originalName) {
    try {
        // Optional: Specify a Parent Folder ID from ENV
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        const parents = folderId ? [folderId] : [];

        const response = await getDrive().files.create({
            requestBody: {
                name: originalName,
                parents: parents,
            },
            media: {
                mimeType: mimeType,
                body: fs.createReadStream(filePath),
            },
            fields: 'id, name, webViewLink, webContentLink',
        });

        console.log(`✅ Uploaded to Google Drive: ${response.data.name} (${response.data.id})`);
        return response.data;
    } catch (error) {
        console.error('❌ Google Drive Upload Error:', error.message);
        throw error;
    }
}

/**
 * Get a file stream from Google Drive
 * @param {string} fileId - The Drive File ID
 * @returns {Promise<IncomingMessage>} - The file stream
 */
async function getFileStream(fileId) {
    try {
        const response = await getDrive().files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );
        return response.data;
    } catch (error) {
        console.error('❌ Google Drive Download Error:', error.message);
        throw error;
    }
}

// Helper: Find folder by name
async function findFolder(name, parentId = null) {
    try {
        let query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
        if (parentId) {
            query += ` and '${parentId}' in parents`;
        }
        const res = await getDrive().files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });
        if (res.data.files.length > 0) return res.data.files[0];
        return null;
    } catch (error) {
        console.error('Find Folder Error:', error.message);
        return null;
    }
}

// Helper: Create folder
async function createFolder(name, parentId = null) {
    const fileMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) {
        fileMetadata.parents = [parentId];
    }
    try {
        const file = await getDrive().files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        return file.data;
    } catch (error) {
        console.error('Create Folder Error:', error.message);
        throw error;
    }
}

/**
 * "Delete" a file by moving it to a "Deleted" folder
 * @param {string} fileId 
 */
async function deleteFile(fileId) {
    try {
        // 1. Get Project Root Folder ID (if any) or just use root
        const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        // 2. Find or Create "Deleted" folder
        const deletedFolderName = "Deleted";
        let deletedFolder = await findFolder(deletedFolderName, rootFolderId);

        if (!deletedFolder) {
            console.log(`Creating '${deletedFolderName}' folder...`);
            deletedFolder = await createFolder(deletedFolderName, rootFolderId);
        }

        // 3. Move file to "Deleted" folder
        // We need to retrieve the current parents to remove them
        const file = await getDrive().files.get({
            fileId: fileId,
            fields: 'parents'
        });

        const previousParents = file.data.parents ? file.data.parents.join(',') : '';

        await getDrive().files.update({
            fileId: fileId,
            addParents: deletedFolder.id,
            removeParents: previousParents,
            fields: 'id, parents'
        });

        console.log(`🗑️ Moved to Deleted Folder: ${fileId}`);

    } catch (error) {
        console.error('❌ Google Drive Soft-Delete Error:', error.message);
        // Fallback: If move fails, do nothing or log. Don't permanently delete if logic fails.
    }
}

module.exports = {
    uploadFile,
    getFileStream,
    deleteFile
};
