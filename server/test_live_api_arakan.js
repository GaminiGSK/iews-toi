const axios = require('axios');

async function test() {
    try {
        console.log("Logging in as arakan...");
        const loginRes = await axios.post('https://bridge-brain-588941282431.asia-southeast1.run.app/api/auth/login', {
            username: 'arakan',
            password: '111111'
        });
        const token = loginRes.data.token;
        console.log("Got token.");

        console.log("Testing /toi/autofill ... ");
        const res = await axios.get('https://bridge-brain-588941282431.asia-southeast1.run.app/api/company/toi/autofill?year=2025', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("SUCCESS:");
        console.log(JSON.stringify(res.data, null, 2).substring(0, 1500));
        
    } catch (e) {
        console.error("ERROR:");
        console.error(e.response?.data || e.message);
    }
}
test();
