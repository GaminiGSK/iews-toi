const fs = require('fs');
const file = 'client/src/pages/FinancialStatements.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix the Style block to forcefully hide UI elements in print
const oldStyle = `@media print {
                                @page { size: A4 portrait !important; margin: 10mm; }
                                .print-section { page-break-after: always; display: block !important; }
                                .print-section:last-child { page-break-after: auto; }
                            }`;

const newStyle = `@media print {
                                @page { size: A4 portrait !important; margin: 10mm; }
                                body * { visibility: hidden; }
                                .print-container, .print-container * { visibility: visible; }
                                .print-container { position: absolute; left: 0; top: 0; width: 100%; }
                                .print-section { page-break-after: always; display: block !important; width: 100%; border: none !important; box-shadow: none !important; }
                                .print-section:last-child { page-break-after: auto; }
                                .print-content-wrapper { overflow: visible !important; }
                                /* Hide on-screen items that print:hidden missed */
                                .print\\:hidden { display: none !important; }
                            }`;

content = content.replace(oldStyle, newStyle);

// Wrap the printed area in .print-container
content = content.replace('className="bg-white rounded-b-xl rounded-tr-xl shadow-xl border border-gray-200 p-10 min-h-[600px] font-sans relative overflow-auto select-text print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full"', 'className="print-container bg-white rounded-b-xl rounded-tr-xl shadow-xl border border-gray-200 p-10 min-h-[600px] font-sans relative overflow-auto select-text print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full"');

// Remove overflow-x-auto for the print tables and replace with print-content-wrapper
content = content.replace(/className="overflow-x-auto"/g, 'className="overflow-x-auto print-content-wrapper"');

// 2. Fix the split layout on the Notes page by replacing the table with a standard div layout
const oldNotesRegex = /<table className="w-full text-sm border-collapse">\s*<tbody className="font-sans">\s*<tr>\s*<td colSpan="2" className="p-6">([\s\S]*?)<\/td>\s*<\/tr>\s*<\/tbody>\s*<\/table>/;
const match = content.match(oldNotesRegex);

if (match) {
    const newNotesHTML = `<div className="p-6 font-sans w-full block">${match[1]}</div>`;
    content = content.replace(oldNotesRegex, newNotesHTML);
}

fs.writeFileSync(file, content);
console.log('Fixed print layout!');
