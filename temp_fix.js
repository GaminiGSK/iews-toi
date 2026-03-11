const fs = require('fs');
let c = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

c = c.replaceAll('<div className="w-[20px] h-[20px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center mt-[2px]">', '<div className="w-[20px] h-[20px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center relative mt-[2px]">');
c = c.replaceAll('<div className="w-[20px] h-[20px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center">', '<div className="w-[20px] h-[20px] border-[1.5px] border-black shrink-0 bg-white flex items-center justify-center relative">');

c = c.replaceAll('<div className="w-3 h-3 bg-black border border-transparent"></div>', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');

c = c.replaceAll('<div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center">', '<div className="w-[16px] h-[16px] border border-black bg-white flex items-center justify-center relative">');
c = c.replaceAll('<div className="w-2.5 h-2.5 bg-black border border-transparent"></div>', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-700 font-bold" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');

fs.writeFileSync('client/src/pages/ToiAcar.jsx', c);
console.log('Fixed boxes');
