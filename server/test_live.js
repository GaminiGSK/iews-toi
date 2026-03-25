require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
    // Exact structure that auth.js uses
    const payload = {
        id: '69c14dd89f5873871ce045f7', // admin1
        role: 'admin',
        username: 'admin1',
        companyCode: 'ADMIN1'
    };
    
    // We assume the live server's process.env.JWT_SECRET is actually "dev_secret_123"
    // Since if it wasn't, all users would be locked out.
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    try {
        const res = await axios.get('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("USERS RETURNED HTTP:", res.status);
        console.log("USERS DATA:", JSON.stringify(res.data));
    } catch(err) {
        console.log("FETCH ERROR", err.response?.status, err.response?.data || err.message);
    }
})();
