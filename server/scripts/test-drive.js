const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { uploadFile, deleteFile } = require('../services/googleDrive');
const fs = require('fs');

const TEST_FILE = path.join(__dirname, 'test-upload.txt');

async function testDrive() {
    console.log('🚀 Starting Google Drive Connectivity Test...');

    // 1. Create a dummy file
    fs.writeFileSync(TEST_FILE, 'This is a test file for IEWS TOI Cloud Storage.');
    console.log('✅ Created local test file.');

    try {
        // 2. Upload
        console.log('📤 Uploading to Drive...');
        const file = await uploadFile(TEST_FILE, 'text/plain', 'connection_test.txt');
        console.log(`✅ Upload Success! File ID: ${file.id}`);

        // 3. Cleanup Drive
        console.log('🗑️ Cleaning up remote test file...');
        await deleteFile(file.id);
        console.log('✅ Remote cleanup success.');

    } catch (err) {
        console.error('❌ Google Drive Connection Failed:', err.message);
        if (err.message.includes('403')) {
            console.error('👉 TIP: Check if "Google Drive API" is enabled in Cloud Console.');
        } else if (err.message.includes('404')) {
            console.error('👉 TIP: Check if Shared Folder ID is correct and shared with Service Account.');
        }
    } finally {
        // 4. Cleanup Local
        if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
        console.log('🧹 Local cleanup done.');
    }
}

testDrive();
