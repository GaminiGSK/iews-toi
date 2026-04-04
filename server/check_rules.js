require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const CompanyProfile = require('./models/CompanyProfile');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const profiles = await CompanyProfile.find({'businessRules.0': {$exists: true}});
    let out = '';
    profiles.forEach(p => {
        out += 'Company: ' + p.companyCode + '\n';
        p.businessRules.forEach((r, i) => {
            out += `  Rule ${i+1}: ${r.content}\n`;
        });
    });
    if(profiles.length === 0) out = 'No rules found anywhere.';
    fs.writeFileSync('rules_out_utf8.txt', out, 'utf8');
    process.exit(0);
}).catch(console.error);
