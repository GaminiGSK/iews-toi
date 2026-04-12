const axios = require('axios');
async function deleteDoc() {
  try {
    const loginRes = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/login', {
      username: 'Admin',
      code: '999999'
    });
    const token = loginRes.data.token;
    
    const docsRes = await axios.get('https://iews-toi-588941282431.asia-southeast1.run.app/api/knowledge/documents', {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    for (const doc of docsRes.data) {
        console.log('Attempting to delete:', doc._id, doc.title);
        const delRes = await axios.delete(`https://iews-toi-588941282431.asia-southeast1.run.app/api/knowledge/documents/${doc._id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Delete status:', delRes.status);
    }
  } catch (err) {
    if (err.response) {
      console.error('Test failed with response:', err.response.status, err.response.data);
    } else {
      console.error('Test failed:', err.message);
    }
  }
}
deleteDoc();
