const fs = require('fs');
const c = fs.readFileSync('e:/Antigravity/TOI/client/src/pages/CompanyProfileNew.jsx', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
    if (l.toLowerCase().includes('asset') || l.toLowerCase().includes('salary') || l.toLowerCase().includes('related')) {
        console.log(i + 1 + ':', l.trim().substring(0, 120));
    }
});
