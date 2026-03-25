require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const u = await User.findOne({ username: 'admin1' });

    const payload = {
        user: {
            id: u.id,
            companyCode: u.companyCode,
            role: u.role,
            isFirstLogin: u.isFirstLogin
        }
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Now make fetch using axios
    try {
        const res = await axios.get('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/users', {
            headers: { 'x-auth-token': token }
        });
        console.log("FETCH RESULT LENGTH:", res.data.length);
        console.log("FETCH DATA:", res.data.map(d => d.username));
    } catch(err) {
        console.log("FETCH ERROR:", err.response ? err.response.status : err.message);
    }
    process.exit(0);
});
