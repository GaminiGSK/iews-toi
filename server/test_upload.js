const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  try {
    // 1. Login
    const loginRes = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/login', {
      username: 'Admin',
      code: '999999'
    });
    const token = loginRes.data.token;
    
    // 2. Upload
    console.log('Logged in, uploading...');
    const form = new FormData();
    form.append('file', fs.createReadStream('C:/Users/Gamini/.gemini/antigravity/brain/12ef8602-c2b8-4b29-88e4-7b920c04c579/cambodia_tax_law_dummy_1775965338025.png'));
    form.append('category', 'TAX_LAW');
    form.append('title', 'System Test Doc');
    
    const uploadRes = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/knowledge/ingest-law', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Upload success!');
    console.log('--- English Translation ---');
    console.log(uploadRes.data.doc.translatedEnglish);
    console.log('--- Structured Rules ---');
    console.log(JSON.stringify(uploadRes.data.doc.structuredRules, null, 2));
  } catch (err) {
    console.error('Test failed:', err.response ? err.response.data : err.message);
  }
}
testUpload();
