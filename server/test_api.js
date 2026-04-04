const axios = require('axios');
require('dotenv').config();

async function testApi() {
    // We need to login as RSW first
    try {
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'RSW',
            password: '000000' // Assuming default pass, if not we will fetch the token by generating it manually
        });
        const token = loginRes.data.token;
        console.log('Got token');

        const tbRes = await axios.get('http://localhost:5000/api/company/trial-balance', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('--- API Response Data ---');
        console.log('En:', tbRes.data.companyNameEn);
        console.log('Kh:', tbRes.data.companyNameKh);
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}

testApi();
