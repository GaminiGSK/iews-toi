const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) throw new Error("No admin found");

        const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'dev_secret_123');

        console.log(`Testing with Admin Token for user: ${admin.username}`);

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/company/admin/profile/GKSMART',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log("API_RESPONSE_START");
                console.log(data);
                console.log("API_RESPONSE_END");
                process.exit(0);
            });
        });

        req.on('error', (err) => {
            console.error("HTTP Request Error:", err.message);
            process.exit(1);
        });

        req.end();
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}
test();
