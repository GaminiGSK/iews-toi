require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = require('./models/User');
        
        // Find gamini to get a token
        const gamini = await User.findOne({ username: 'GKSMART' });
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: gamini._id, username: gamini.username, role: gamini.role, companyCode: gamini.companyCode }, 
            process.env.JWT_SECRET || 'gksmart_super_secret_key_2025',
            { expiresIn: '1h' }
        );

        const res = await axios.get('http://localhost:5000/api/company/toi/autofill?year=2025', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("AUTOFILL DATA:", JSON.stringify(res.data, null, 2));
        process.exit(0);
    } catch (e) {
        console.error("ERROR:");
        console.error(e.response ? e.response.data : e.message);
        process.exit(1);
    }
}
run();
