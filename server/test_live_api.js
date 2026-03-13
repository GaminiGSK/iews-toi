require('dotenv').config();
const mongoose = require('mongoose');

async function testLiveApi() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // We already know the JWT secret and company code.
    const t = require('jsonwebtoken').sign({user: {_id: 'fake', companyCode: 'GK_SMART_AI'}}, process.env.JWT_SECRET); 
    
    // The deployed url for ambient-airlock is probably different. 
    // Wait, the user accesses Cloud Run. Let's just run it the same way the server handles it: Express app locally to port 5001.
    const express = require('express');
    const app = express();
    app.use(express.json());
    // mock req.user middleware
    app.use((req, res, next) => { req.user = { _id: 'fake', companyCode: 'GK_SMART_AI' }; next(); });
    app.use('/api/company', require('./routes/company'));
    
    const server = app.listen(0, async () => {
        const port = server.address().port;
        const resp = await fetch(`http://localhost:${port}/api/company/trial-balance?year=2025`);
        const data = await resp.json();
        
        let assets = 0;
        data.report.filter(r => r.code.startsWith('1')).forEach(r => assets += (r.drUSD - r.crUSD));
        console.log("Local API endpoint returned total assets:", assets);
        console.log("Cash 10110:", data.report.find(r=>r.code === '10110'));
        console.log("Auto 17290:", data.report.find(r=>r.code === '17290'));
        process.exit(0);
    });
}
testLiveApi().catch(console.error);
