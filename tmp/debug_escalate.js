const fs = require('fs');
const file = 'e:/Antigravity/TOI/server/services/googleAI.js';
let content = fs.readFileSync(file, 'utf8');

const idx = content.indexOf('escalate_to_antigravity');
console.log('Found at:', idx);
console.log('---TEXT---');
console.log(JSON.stringify(content.substring(idx - 5, idx + 600)));
