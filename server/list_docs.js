const axios = require('axios');
async function listDocs() {
  try {
    const loginRes = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/login', {
      username: 'Admin',
      code: '999999'
    });
    const token = loginRes.data.token;
    
    const docsRes = await axios.get('https://iews-toi-588941282431.asia-southeast1.run.app/api/knowledge/documents', {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(docsRes.data[0].structuredRules, null, 2));
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}
listDocs();