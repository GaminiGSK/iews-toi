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
 * Create a metadata-only file entry in Google Drive (Legacy/Fallback)
 * @param {string} originalName - Filename as it should appear in Drive
 * @param {string} customParentId - Target folder ID
 * @param {string} description - Additional metadata
 * @returns {Promise<object>} - Drive file data
 */
async function uploadFileMetadataOnly(originalName, customParentId = null, description = "") {
    try {
        const folderId = customParentId || process.env.GOOGLE_DRIVE_FOLDER_ID;
        const parents = folderId ? [folderId] : [];

        const response = await getDrive().files.create({
            requestBody: {
                name: originalName,
                parents: parents,
                description: description || "🔄 Synchronized Ledger Record (Metadata Only)"
            },
            fields: 'id, name',
        });

        console.log(`📡 Created Metadata Entry on Drive: ${response.data.name} (${response.data.id})`);
        return response.data;
    } catch (error) {
        console.error('❌ Google Drive Metadata Sync Error:', error.message);
        throw error;
    }
}

/**
 * Upload a file to Google Drive
 * @param {string} filePath - Local path to the file
 * @param {string} mimeType - MIME type of the file
 * @param {string} originalName - Original filename (will be used in Drive)
 * @returns {Promise<string>} - The Google Drive File ID
 */
async function uploadFile(filePath, mimeType, originalName, customParentId = null) {
    try {
        // Priority: customParentId -> GOOGLE_DRIVE_FOLDER_ID -> root
        const folderId = customParentId || process.env.GOOGLE_DRIVE_FOLDER_ID;
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

        // --- AUTOMATED FALLBACK: Try Global Root if Custom Folder Fails ---
        if (error.message.includes('storageQuotaExceeded') || error.status === 403) {
            console.warn('⚠️  STORAGE QUOTA EXCEEDED: Service Account cannot upload binary data to Drive. Syncing as Metadata placeholder only.');

            // If strictly quota error, we stop binary retries.
            if (error.message.includes('quota')) {
                const metadataOnly = await uploadFileMetadataOnly(originalName, customParentId, `STORAGE_ERROR: Binary upload failed due to SA quota. Raw data is safe in DB ledger.`);
                return { ...metadataOnly, isMetadataOnly: true };
            }

            const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID;
            if (customParentId && customParentId !== rootId) {
                console.log(`⚠️  Permission Denied on folder ${customParentId}. Retrying upload to Global Root (${rootId})...`);
                try {
                    return await uploadFile(filePath, mimeType, originalName, rootId);
                } catch (rootErr) {
                    console.error('❌ Global Root Upload also failed:', rootErr.message);
                }
            }

            console.log('⚠️  All binary upload attempts blocked. Using metadata-only fallback...');
            try {
                const metadataOnly = await uploadFileMetadataOnly(originalName, customParentId, `Source: Ledger Sync Failure | Path: ${filePath}`);
                return { ...metadataOnly, isMetadataOnly: true };
            } catch (fallbackErr) {
                console.error('❌ Critical Sync Failure (Metadata Fallback Failed):', fallbackErr.message);
                throw new Error("SYNC_FAILED: All upload attempts blocked including metadata.");
            }
        }

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

/**
 * Move a file to a new folder
 * @param {string} fileId
 * @param {string} newFolderId
 */
async function moveFile(fileId, newFolderId) {
    try {
        const file = await getDrive().files.get({
            fileId: fileId,
            fields: 'parents'
        });

        const previousParents = file.data.parents ? file.data.parents.join(',') : '';

        await getDrive().files.update({
            fileId: fileId,
            addParents: newFolderId,
            removeParents: previousParents,
            fields: 'id, parents'
        });

        console.log(`📁 Moved file ${fileId} to folder ${newFolderId}`);
    } catch (error) {
        console.error('❌ Google Drive Move Error:', error.message);
        throw error;
    }
}

module.exports = {
    uploadFile,
    getFileStream,
    deleteFile,
    createFolder,
    findFolder,
    uploadFileMetadataOnly,
    moveFile,
    getDrive
};
