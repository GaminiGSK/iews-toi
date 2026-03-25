require('dotenv').config();
const jwt = require('jsonwebtoken');
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
    
    // Now make native fetch
    const res = await fetch('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/users', {
        headers: { 'x-auth-token': token }
    });
    const data = await res.json();
    console.log("FETCH RESULT:", data);
    process.exit(0);
});
