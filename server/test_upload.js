const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config({ path: 'e:/Antigravity/TOI/server/.env' });

async function loginAndUpload() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/login', {
            username: 'admin',
            code: '999999' // FIXED: use code
        });
        const token = loginRes.data.token;
        console.log("Token received:", token.substring(0, 15) + "...");

        console.log("Creating dummy file...");
        fs.writeFileSync('test_dummy.txt', 'This is a test document with random text like SUPERIOR HOSPITAL.');

        const form = new FormData();
        form.append('file', fs.createReadStream('test_dummy.txt'), 'test_dummy.txt');
        form.append('docType', 'taxPatent');
        form.append('companyCode', 'SCAR');

        console.log("Uploading...");
        const uploadRes = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/company/upload-scar-doc', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Upload Success! Extracted Data:");
        console.log(uploadRes.data.extractedData);
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
loginAndUpload();
