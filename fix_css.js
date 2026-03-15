const fs = require('fs');
let code = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

// Replace {isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-
const searchStr = '{isAdmin ? "w-[50%]" : "flex-1"} shrink-0 bg-';
const replaceStr = '{isAdmin ? "w-[50%]" : "flex-1"} min-w-0 bg-';

code = code.split(searchStr).join(replaceStr);
fs.writeFileSync('client/src/pages/ToiAcar.jsx', code);
console.log('Fixed flex layout overflow on TOI forms');
