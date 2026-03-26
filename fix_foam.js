// @ts-nocheck
const fs = require('fs');

// 1. Fix Schedule 4 (Related Party Transactions) in ToiAcar.jsx
let toiCore = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

const regexA = /\{\[1, 2, 3\]\.map\(\(_, i\) => \(\s*<div key=\{`A-\$\{i\}`\} className="flex border-b border-black h-\[22px\] items-center">\s*<div className="w-\[5%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[20%\] h-full flex items-center justify-end px-2 text-\[9px\]">-<\/div>\s*<\/div>\s*\)\}/g;

const newA = `{[1, 2, 3].map((_, i) => (
                    <div key={\`A-\${i}\`} className="flex border-b border-black h-[22px] items-center">
                       <div className="w-[5%] border-r border-black h-full flex items-center justify-center font-mono text-[9px]">{i === 0 ? "1" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "None / NIL" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "N/A" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "No Related Party Transactions" : ""}</div>
                       <div className="w-[20%] h-full flex items-center justify-end px-2 text-[10px] font-bold font-mono text-gray-400">{i === 0 ? "0" : "-"}</div>
                    </div>
                  ))}`;

toiCore = toiCore.replace(regexA, newA);

const regexB = /\{\[1, 2, 3\]\.map\(\(_, i\) => \(\s*<div key=\{`B-\$\{i\}`\} className="flex border-b border-black h-\[22px\] items-center">\s*<div className="w-\[5%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[20%\] h-full flex items-center justify-end px-2 text-\[9px\]">-<\/div>\s*<\/div>\s*\)\}/g;

const newB = `{[1, 2, 3].map((_, i) => (
                    <div key={\`B-\${i}\`} className="flex border-b border-black h-[22px] items-center">
                       <div className="w-[5%] border-r border-black h-full flex items-center justify-center font-mono text-[9px]">{i === 0 ? "1" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "None / NIL" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "N/A" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "No Related Party Transactions" : ""}</div>
                       <div className="w-[20%] h-full flex items-center justify-end px-2 text-[10px] font-bold font-mono text-gray-400">{i === 0 ? "0" : "-"}</div>
                    </div>
                  ))}`;

toiCore = toiCore.replace(regexB, newB);

const regexC = /\{\[1, 2, 3\]\.map\(\(_, i\) => \(\s*<div key=\{`C-\$\{i\}`\} className="flex border-b border-black h-\[22px\] items-center">\s*<div className="w-\[5%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[20%\] h-full flex items-center justify-end px-2 text-\[9px\]">-<\/div>\s*<\/div>\s*\)\}/g;

const newC = `{[1, 2, 3].map((_, i) => (
                    <div key={\`C-\${i}\`} className="flex border-b border-black h-[22px] items-center">
                       <div className="w-[5%] border-r border-black h-full flex items-center justify-center font-mono text-[9px]">{i === 0 ? "1" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "None / NIL" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "N/A" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "No Related Party Transactions" : ""}</div>
                       <div className="w-[20%] h-full flex items-center justify-end px-2 text-[10px] font-bold font-mono text-gray-400">{i === 0 ? "0" : "-"}</div>
                    </div>
                  ))}`;

toiCore = toiCore.replace(regexC, newC);

const regexD = /\{\[1, 2, 3\]\.map\(\(_, i\) => \(\s*<div key=\{`D-\$\{i\}`\} className="flex border-b border-black h-\[22px\] items-center">\s*<div className="w-\[5%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[25%\] border-r border-black h-full"><\/div>\s*<div className="w-\[20%\] h-full flex items-center justify-end px-2 text-\[9px\]">-<\/div>\s*<\/div>\s*\)\}/g;

const newD = `{[1, 2, 3].map((_, i) => (
                    <div key={\`D-\${i}\`} className="flex border-b border-black h-[22px] items-center">
                       <div className="w-[5%] border-r border-black h-full flex items-center justify-center font-mono text-[9px]">{i === 0 ? "1" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "None / NIL" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "N/A" : ""}</div>
                       <div className="w-[25%] border-r border-black h-full flex items-center justify-center font-bold text-[9px] text-gray-400">{i === 0 ? "No Related Party Transactions" : ""}</div>
                       <div className="w-[20%] h-full flex items-center justify-end px-2 text-[10px] font-bold font-mono text-gray-400">{i === 0 ? "0" : "-"}</div>
                    </div>
                  ))}`;

toiCore = toiCore.replace(regexD, newD);

fs.writeFileSync('client/src/pages/ToiAcar.jsx', toiCore);
console.log('Fixed ToiAcar.jsx Schedule 4');

// 2. Fix api/company/financials-monthly to not filter out NO activity
let compJS = fs.readFileSync('server/routes/company.js', 'utf8');

const oldFilter = `res.json({
            pl: Object.values(plData).filter(r => r.months[0] !== 0), // Filter rows with activity
            bs: Object.values(bsData).filter(r => Math.abs(r.months[0]) > 0.001 || r.months.some(m => Math.abs(m) > 0.001)),
            currentYear,`;

const newFilter = `res.json({
            pl: Object.values(plData).filter(r => r.months[0] !== 0 || ['41000','51000','61000'].includes(r.code) || ['4', '5'].some(p => r.code.startsWith(p))), // Keep major lines to avoid blank P&L
            bs: Object.values(bsData), // ALWAYS SHOW ALL Accounts for standard view, do not filter empty rows per requirement
            currentYear,`;

if (compJS.includes("pl: Object.values(plData).filter(r => r.months[0] !== 0)")) {
  compJS = compJS.replace(oldFilter, newFilter);
  fs.writeFileSync('server/routes/company.js', compJS);
  console.log('Fixed server/routes/company.js');
}

// 3. Let's fix the A4 page weird borders. In ToiAcar.jsx, the pages look like:
// <div className="w-[210mm] min-h-[297mm] mx-auto bg-white shadow-xl mb-12 border border-slate-200 ...
// The print rule print:shadow-none print:border-none is there.
// But some users might see weird scaling. Let's ensure print CSS is perfect.
