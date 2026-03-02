const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// We need an admin token. Let's find an admin user.
const mongoose = require('mongoose');
const User = require('../models/User');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) throw new Error("No admin found");

        const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'dev_secret_123');

        console.log(`Testing with Admin Token for user: ${admin.username}`);

        // Mocking the behavior of AdminDashboard's fetchUserBRDocs
        const res = await axios.get(`http://localhost:5000/api/company/admin/profile/GKSMART`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("API_RESPONSE_START");
        console.log(JSON.stringify(res.data, null, 2));
        console.log("API_RESPONSE_END");

        process.exit(0);
    } catch (err) {
        console.error("API Fetch Error:", err.message);
        if (err.response) console.error(JSON.stringify(err.response.data, null, 2));
        process.exit(1);
    }
}
test();
