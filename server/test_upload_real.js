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

        console.log("2. Uploading REAL PDF test file...");
        const filePath = 'e:/Antigravity/TOI/test_patent.pdf';
        if (!fs.existsSync(filePath)) {
           console.log("File not found! Aborting test.");
           return;
        }

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath), 'test_patent.pdf');
        form.append('docType', 'taxPatent');
        form.append('companyCode', 'SCAR');

        try {
            const uploadRes = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/company/upload-scar-doc', form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log("UPLOAD SUCCESS! Data updated successfully. Response:", uploadRes.data);
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
