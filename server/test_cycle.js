require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
    try {
        const res = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/login', {
            username: 'admin1',
            code: '111111' 
        });
        const liveToken = res.data.token;
        const decoded = jwt.decode(liveToken);
        console.log("DECODED JWT:", decoded);
        
        // Then hit users endpoint using the LIVE token!
        const resUsers = await axios.get('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/users', {
            headers: { 'Authorization': `Bearer ${liveToken}` }
        });
        console.log("USERS RETURNED:", resUsers.data.map(u => u.username));
    } catch(err) {
        console.log("FETCH ERROR", err.response?.status, err.response?.data);
    }
})();
