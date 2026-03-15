const fs = require('fs');
let code = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

const searchStr = 'className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-sm bg-white"';
const replaceStr = 'className="w-[49px] shrink-0 border-r border-black flex items-center justify-center font-bold text-[14px] bg-[#e6e6e6] text-black"';

code = code.split(searchStr).join(replaceStr);

fs.writeFileSync('client/src/pages/ToiAcar.jsx', code);
console.log('Fixed gray shade for TOI row numbers 11-18');
