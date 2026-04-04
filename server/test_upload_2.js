const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config({ path: 'e:/Antigravity/TOI/server/.env' });

async function fullTest() {
    try {
        console.log("1. Authenticating...");
        const loginRes = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/login', {
            username: 'admin',
            code: '999999'
        });
        const token = loginRes.data.token;
        console.log("Logged in!");

        console.log("2. Uploading test file to test 500 error...");
        fs.writeFileSync('test_upload.jpg', 'fake image data is short');

        const form = new FormData();
        form.append('file', fs.createReadStream('test_upload.jpg'), 'test_upload.jpg');
        form.append('docType', 'taxPatent');
        form.append('companyCode', 'SCAR');

        try {
            const uploadRes = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/company/upload-scar-doc', form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log("UPLOAD SUCCESS:", uploadRes.data);
        } catch (uploadErr) {
            console.error("UPLOAD CRASHED!");
            if (uploadErr.response) {
                console.error("Status:", uploadErr.response.status);
                console.error("Data:", uploadErr.response.data);
            } else {
                console.error("No response object:", uploadErr.message);
            }
        }
    } catch (e) {
        console.error("MAIN ERROR:", e.response ? e.response.data : e.message);
    }
}
fullTest();
