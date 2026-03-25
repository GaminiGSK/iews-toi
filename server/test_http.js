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
    
    // Test Live endpoint
    const https = require('https');
    
    const options = {
      hostname: 'iews-toi-588941282431.asia-southeast1.run.app',
      port: 443,
      path: '/api/auth/users',
      method: 'GET',
      headers: {
        'x-auth-token': token,
        'Authorization': `Bearer ${token}`
      }
    };
    
    const req = https.request(options, res => {
      console.log(`STATUS: ${res.statusCode}`);
      res.on('data', d => {
        process.stdout.write(d);
      });
      res.on('end', () => {
        process.exit(0);
      });
    });
    
    req.on('error', error => {
      console.error(error);
      process.exit(1);
    });
    
    req.end();
});
