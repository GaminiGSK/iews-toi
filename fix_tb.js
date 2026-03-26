// @ts-nocheck
const fs = require('fs');
const file = 'client/src/pages/TrialBalance.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for Company Names
content = content.replace(
    /const \[totals, setTotals\] = useState\(\{.*\};\n\s*const \[currency, setCurrency\].*;/g,
    `$&
    const [companyNameEn, setCompanyNameEn] = useState('GK SMART CO., LTD.');
    const [companyNameKh, setCompanyNameKh] = useState('ក្រុមហ៊ុន ជីខេ ស្មាត ឯ.ក');`
);

// 2. Set company names from API
content = content.replace(
    /setTotals\(res\.data\.totals \|\| \{.*\};\n\s*\/\/ Set Year if available/,
    `$&
            if (res.data.companyNameEn) setCompanyNameEn(res.data.companyNameEn);
            if (res.data.companyNameKh) setCompanyNameKh(res.data.companyNameKh);`
);

// 3. Hide header on print
content = content.replace(
    /className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-8 sticky top-0 z-20 shadow-sm overflow-x-auto"/,
    `className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-8 sticky top-0 z-20 shadow-sm overflow-x-auto print:hidden"`
);

// 4. Add Print layout button
content = content.replace(
    /<button\s+onClick=\{handleDownloadPDF\}/,
    `<button onClick={() => window.print()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm border border-slate-300 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg> Print A4 Layout 
                    </button>
                    <button onClick={handleDownloadPDF}`
);

// 5. Add Print Only Header
const printHeader = `
                    <div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                    {companyNameKh}
                                </h1>
                                <h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2">
                                    {companyNameEn}
                                </h2>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Detail</div>
                                <div className="text-sm font-bold text-black">
                                    Trial Balance - {fiscalYear === 'all' ? 'All Years' : fiscalYear}
                                </div>
                                <div className="text-sm font-bold text-black">
                                    Currency: {currency} {inThousands ? " (in '000s)" : ""}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Audit Toolbar */}`;
content = content.replace(/\{\/\* Audit Toolbar \*\/\}/, printHeader);

// 6. Update Currency Labels
content = content.replace(/\{inThousands \? "KHR'000" : "KHR"\}/g, `{inThousands ? currency + "'000" : currency}`);
content = content.replace(/>Dr \(KHR\)</g, `>Dr ({currency})<`);
content = content.replace(/>Cr \(KHR\)</g, `>Cr ({currency})<`);

// 7. Update Value Calculations - Map specific logic blocks
// Instead of complex AST, replace the variable definitions
content = content.replace(/const dr = row\.drKHR \? row\.drKHR \/ scale : 0;/g, `const dr = currency === 'USD' ? (row.drUSD ? row.drUSD / scale : 0) : (row.drKHR ? row.drKHR / scale : 0);`);
content = content.replace(/const cr = row\.crKHR \? row\.crKHR \/ scale : 0;/g, `const cr = currency === 'USD' ? (row.crUSD ? row.crUSD / scale : 0) : (row.crKHR ? row.crKHR / scale : 0);`);
content = content.replace(/const pDr = row\.priorDrKHR \? row\.priorDrKHR \/ scale : 0;/g, `const pDr = currency === 'USD' ? (row.priorDrUSD ? row.priorDrUSD / scale : 0) : (row.priorDrKHR ? row.priorDrKHR / scale : 0);`);
content = content.replace(/const pCr = row\.priorCrKHR \? row\.priorCrKHR \/ scale : 0;/g, `const pCr = currency === 'USD' ? (row.priorCrUSD ? row.priorCrUSD / scale : 0) : (row.priorCrKHR ? row.priorCrKHR / scale : 0);`);

content = content.replace(/const unAdDr = \(row\.unadjDrKHR \|\| 0\) \/ scale;/g, `const unAdDr = currency === 'USD' ? (row.unadjDrUSD || 0) / scale : (row.unadjDrKHR || 0) / scale;`);
content = content.replace(/const unAdCr = \(row\.unadjCrKHR \|\| 0\) \/ scale;/g, `const unAdCr = currency === 'USD' ? (row.unadjCrUSD || 0) / scale : (row.unadjCrKHR || 0) / scale;`);
content = content.replace(/const adDr = \(row\.adjDrKHR \|\| 0\) \/ scale;/g, `const adDr = currency === 'USD' ? (row.adjDrUSD || 0) / scale : (row.adjDrKHR || 0) / scale;`);
content = content.replace(/const adCr = \(row\.adjCrKHR \|\| 0\) \/ scale;/g, `const adCr = currency === 'USD' ? (row.adjCrUSD || 0) / scale : (row.adjCrKHR || 0) / scale;`);

// Let's replace the totals calculations inside the return block globally
content = content.replace(/totals\.drKHR/g, `(currency === 'USD' ? totals.drUSD : totals.drKHR)`);
content = content.replace(/totals\.crKHR/g, `(currency === 'USD' ? totals.crUSD : totals.crKHR)`);
content = content.replace(/totals\.priorDrKHR/g, `(currency === 'USD' ? totals.priorDrUSD : totals.priorDrKHR)`);
content = content.replace(/totals\.priorCrKHR/g, `(currency === 'USD' ? totals.priorCrUSD : totals.priorCrKHR)`);

// Update ad and unadj totals logic. They use reduce on report.
content = content.replace(/\(r\.unadjDrKHR \|\| 0\)/g, `(currency === 'USD' ? (r.unadjDrUSD || 0) : (r.unadjDrKHR || 0))`);
content = content.replace(/\(r\.unadjCrKHR \|\| 0\)/g, `(currency === 'USD' ? (r.unadjCrUSD || 0) : (r.unadjCrKHR || 0))`);
content = content.replace(/\(r\.adjDrKHR \|\| 0\)/g, `(currency === 'USD' ? (r.adjDrUSD || 0) : (r.adjDrKHR || 0))`);
content = content.replace(/\(r\.adjCrKHR \|\| 0\)/g, `(currency === 'USD' ? (r.adjCrUSD || 0) : (r.adjCrKHR || 0))`);

// Fix syntax in the print blocks (div wrapper issue inside \`return\` where \`overflow-auto print:p-0 print:overflow-visible\` is missing)
content = content.replace(
    /className="flex-1 p-8 overflow-auto"/,
    `className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible"`
);

// We should also remove the 'hidden print:block' outer div if needed from table wrapper, but it is fine.
content = content.replace(
    /className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg border border-gray-300 overflow-hidden text-sm font-serif animate-fade-in"/,
    `className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg border border-gray-300 overflow-hidden text-sm font-serif animate-fade-in print:shadow-none print:border-none print:rounded-none select-text"`
);
// In print we want to make tables readable like A4. 
content = content.replace(
    /className="overflow-x-auto"/g,
    `className="overflow-x-auto print:overflow-visible"`
);

fs.writeFileSync(file, content);
console.log('Fixed TrialBalance.jsx successfully');
