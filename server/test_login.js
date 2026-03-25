require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
    try {
        const res = await axios.post('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/login', {
            username: 'admin1',
            password: '123' 
        });
        console.log("LOGIN SUCCESS:", res.data.token.substring(0, 15));
        
        // Then hit users endpoint!
        const resUsers = await axios.get('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/users', {
            headers: { 'Authorization': `Bearer ${res.data.token}` }
        });
        console.log("USERS RETURNED:", resUsers.data.map(u => u.username));

    } catch(err) {
        console.log("LOGIN ERROR", err.response?.status, err.response?.data);
    }
})();
