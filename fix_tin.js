const fs = require('fs');
let code = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

code = code.replace(/filledData\?\.tin\?\.replace\('-', ''\)\[i\]/g, "(filledData?.tin?.replace('-', '') || '')[i]");
code = code.replace(/filledData\?\.tin\?\.replace\('-', ''\)\[i \+ 4\]/g, "(filledData?.tin?.replace('-', '') || '')[i + 4]");

fs.writeFileSync('client/src/pages/ToiAcar.jsx', code);
console.log('Fixed ToiAcar.jsx');
