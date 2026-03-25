require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
    try {
        const res = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/login', {
            username: 'admin1',
            code: '111111' 
        });
        const liveToken = res.data.token;
        
        // Then hit users endpoint using the LIVE token!
        const resUsers = await axios.get('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/users', {
            headers: { 'Authorization': `Bearer ${liveToken}` }
        });
        
        const text = `LIVE USERS:` + JSON.stringify(resUsers.data.map(u => u.username));
        fs.writeFileSync('C:\\tmp\\test_live_out.txt', text);
        console.log("Check C:\\tmp\\test_live_out.txt");
    } catch(err) {
        console.log("FETCH ERROR", err.response?.status, err.response?.data);
    }
    process.exit(0);
})();
