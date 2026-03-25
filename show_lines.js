const fs = require('fs');
let content = fs.readFileSync('server/routes/company.js', 'utf8');
const lines = content.split('\n');

// Show lines 2865-2905 to understand what's there
for (let i = 2863; i < 2905; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
