const axios = require('axios');
async function testDelete() {
  try {
    const loginRes = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/login', {
      username: 'Admin',
      code: '999999'
    });
    const token = loginRes.data.token;
    
    const docsRes = await axios.get('https://iews-toi-588941282431.asia-southeast1.run.app/api/knowledge/documents', {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Found ' + docsRes.data.length + ' documents.');
    const testDocs = docsRes.data.filter(d => d.title === 'System Test Doc');
    for (const doc of testDocs) {
        console.log('Deleting ' + doc._id);
        const delRes = await axios.delete(`https://iews-toi-588941282431.asia-southeast1.run.app/api/knowledge/documents/${doc._id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Delete response:', delRes.data);
    }
  } catch (err) {
    console.error('Test failed:', err.response ? err.response.data : err.message);
  }
}
testDelete();