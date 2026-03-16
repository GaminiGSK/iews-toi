const fs = require('fs');
const file = 'client/src/pages/FinancialStatements.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Hide Insight Banner
content = content.replace(
    '<div className="bg-indigo-900 text-white px-8 py-3 flex justify-between items-center text-sm shadow-md">',
    '<div className="bg-indigo-900 text-white px-8 py-3 flex justify-between items-center text-sm shadow-md print:hidden">'
);

// 2. Remove padding from main wrappers during print
content = content.replace(
    /<div className=\{\`flex-1 overflow-hidden flex flex-col mx-auto w-full p-8 \\?\$\{viewMode === 'monthly' \? 'max-w-\[1400px\]' : 'max-w-5xl'\}\`\}>/,
    '<div className={`flex-1 overflow-hidden flex flex-col mx-auto w-full p-8 print:p-0 print:min-w-full print:max-w-none ${viewMode === \'monthly\' ? \'max-w-[1400px]\' : \'max-w-5xl\'}`}>'
);

content = content.replace(
    'className="print-container bg-white rounded-b-xl rounded-tr-xl shadow-xl border border-gray-200 p-10 min-h-[600px] font-sans relative overflow-auto select-text print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full"',
    'className="print-container bg-white rounded-b-xl rounded-tr-xl shadow-xl border border-gray-200 p-10 print:p-0 min-h-[600px] font-sans relative overflow-auto print:overflow-visible select-text print:shadow-none print:border-none print:bg-transparent print:rounded-none print:max-w-none print:w-full print:m-0"'
);

// 3. Inject strict, absolute CSS into the style block
const styleRegex = /<style>[\s\S]*?<\/style>/;
const newStyle = `<style>
                        {\`
                            @media print {
                                @page { 
                                    size: \${viewMode === 'annual' ? 'A4 portrait' : 'A4 landscape'} !important;
                                    margin: 10mm; 
                                }
                                body * { visibility: hidden !important; }
                                .print-container, .print-container * { visibility: visible !important; }
                                .print-container { 
                                    position: absolute !important; 
                                    left: 0 !important; 
                                    top: 0 !important; 
                                    width: 100% !important; 
                                    border: none !important; 
                                    box-shadow: none !important; 
                                    margin: 0 !important; 
                                    padding: 0 !important; 
                                    background: white !important;
                                }
                                .print-section { 
                                    page-break-after: always; 
                                    page-break-inside: avoid;
                                    display: block !important; 
                                    width: 100% !important; 
                                    background: white !important;
                                }
                                .print-section:last-child { page-break-after: auto; }
                                .print-content-wrapper { overflow: visible !important; }
                                .print\\\\:hidden { display: none !important; }
                            }
                        \`}
                    </style>`;
content = content.replace(styleRegex, newStyle);

fs.writeFileSync(file, content);
console.log('Fixed CSS leaks!');
