const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Initialize Auth
const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

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

        const response = await drive.files.create({
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
        const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );
        return response.data;
    } catch (error) {
        console.error('❌ Google Drive Download Error:', error.message);
        throw error;
    }
}

/**
 * Delete a file from Google Drive
 * @param {string} fileId 
 */
async function deleteFile(fileId) {
    try {
        await drive.files.delete({ fileId: fileId });
        console.log(`🗑️ Deleted from Drive: ${fileId}`);
    } catch (error) {
        console.error('❌ Google Drive Delete Error:', error.message);
        // Don't throw, just log
    }
}

module.exports = {
    uploadFile,
    getFileStream,
    deleteFile
};
