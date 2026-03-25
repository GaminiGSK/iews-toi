const fs = require('fs');
const c = fs.readFileSync('server/routes/company.js', 'utf8');
const idx = c.indexOf('profileInDb.companyNameKh = "');
if (idx >= 0) {
    const end = c.indexOf('";', idx + 30);
    const val = c.substring(idx + 29, end);
    const buf = Buffer.from(val, 'utf8');
    console.log('Length:', val.length, 'bytes hex:', buf.toString('hex').substring(0, 40));
    console.log('Value:', val);
} else {
    console.log('Not found');
}
