const fs = require('fs');
const file = 'client/src/pages/FinancialStatements.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add print:hidden to top tools
content = content.replace('overflow-x-auto">', 'overflow-x-auto print:hidden">');
content = content.replace('shadow-md">', 'shadow-md print:hidden">');
content = content.replace('flex gap-2 mb-0">', 'flex gap-2 mb-0 print:hidden">');

// 2. Add print-section CSS
content = content.replace(
`                            @media print {
                                @page { size: A4 portrait !important; margin: 10mm; }
                            }`,
`                            @media print {
                                @page { size: A4 portrait !important; margin: 10mm; }
                                .print-section { page-break-after: always; display: block !important; }
                                .print-section:last-child { page-break-after: auto; }
                            }`
);

// 3. Instead of parsing the massive block, I will replace the exact block `hidden print:block pb-6` ... to `</div>` (the end of the tables)
// It is actually safer to just do strings.

const regexMatch = /<div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">[\s\S]*?(<div className="mt-12 pt-8 border-t border-gray-300 flex justify-between text-xs text-center text-gray-500 font-sans">)/;

const newHTML = `
                    <div className="print-section">
                        {/* Page 1: Income Statement */}
                        <div className={\`\${activeTab === 'pl' ? 'block' : 'hidden print:block'}\`}>
                            <div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">
                                <div className="flex justify-between items-start mb-8">
                                    <div><h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{companyNameKh}</h1><h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2 px-1">{companyNameEn}</h2></div>
                                    <div className="text-right flex flex-col items-end gap-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Detail</div><h3 className="text-xl font-bold text-black uppercase tracking-widest mt-1">របាយការណ៍លទ្ធផល / INCOME STATEMENT</h3><div className="text-sm font-bold text-black mt-1">For the year ended 31 December {new Date().getFullYear()}</div><div className="text-sm font-bold text-black">Reporting Currency: {inUSD ? "USD" : "KHR"}</div></div>
                                </div>
                            </div>
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍លទ្ធផល / INCOME STATEMENT</h3>
                                <p className="text-sm text-gray-500 italic">For the year ended 31 December {new Date().getFullYear()}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-gray-300">
                                            <th className="p-3 text-left font-bold text-gray-600 uppercase text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ / DESCRIPTION</th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-20" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាំ<br/>NOTE</th>
                                            <th className="p-3 text-center font-bold text-gray-800 uppercase text-xs w-48 bg-white border-l border-gray-200" style={{ borderTop: '4px solid #3B82F6', fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-blue-600 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear()} {inUSD ? 'USD' : 'KHR'}</span></th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-48 bg-slate-50 border-l border-gray-200" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-gray-500 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear() - 1} {inUSD ? 'USD' : 'KHR'}</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {renderSectionHeader("ចំណូល / REVENUE")}
                                        {revenue.map(r => renderRow(r.description, getCr(r), getPriorCr(r), false, true))}
                                        {renderRow("ចំណូលសរុប / TOTAL REVENUE", totalRev, revenue.reduce((sum, r) => sum + getPriorCr(r), 0), true)}

                                        {renderSectionHeader("ថ្លៃដើមលក់ / COST OF SALES")}
                                        {costOfSales.map(r => renderRow(r.description, getDr(r), getPriorDr(r), false, true))}
                                        {renderRow("ប្រាក់ចំណេញដុល / GROSS PROFIT", grossProfit, revenue.reduce((sum, r) => sum + getPriorCr(r), 0) - costOfSales.reduce((sum, r) => sum + getPriorDr(r), 0), true)}

                                        {renderSectionHeader("ចំណាយប្រតិបត្តិការ / OPERATING EXPENSES")}
                                        {expenses.map(r => renderRow(r.description, getDr(r), getPriorDr(r), false, true))}
                                        {renderRow("ចំណាយប្រតិបត្តិការសរុប / TOTAL OPERATING EXPENSES", totalExp, expenses.reduce((sum, r) => sum + getPriorDr(r), 0), true)}

                                        <tr className="h-4"></tr>
                                        <tr className="border-t-4 border-gray-800 border-b-4 border-gray-800 bg-gray-50">
                                            <td className="p-4 font-bold text-lg uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញសុទ្ធសម្រាប់ឆ្នាំ / NET PROFIT FOR THE YEAR</td>
                                            <td className="p-4 text-center font-mono text-gray-500">-</td>
                                            <td className="p-4 text-right font-bold font-mono text-lg border-l border-gray-200">{netProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                            <td className="p-4 text-right font-bold font-mono text-lg border-l border-gray-200">{(revenue.reduce((sum, r) => sum + getPriorCr(r), 0) - costOfSales.reduce((sum, r) => sum + getPriorDr(r), 0) - expenses.reduce((sum, r) => sum + getPriorDr(r), 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="print-section">
                        {/* Page 2: Balance Sheet */}
                        <div className={\`\${activeTab === 'bs' ? 'block' : 'hidden print:block'}\`}>
                            <div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">
                                <div className="flex justify-between items-start mb-8">
                                    <div><h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{companyNameKh}</h1><h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2 px-1">{companyNameEn}</h2></div>
                                    <div className="text-right flex flex-col items-end gap-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Detail</div><h3 className="text-xl font-bold text-black uppercase tracking-widest mt-1">របាយការណ៍ស្ថានភាពហិរញ្ញវត្ថុ / STATEMENT OF FINANCIAL POSITION</h3><div className="text-sm font-bold text-black mt-1">As at 31 December {new Date().getFullYear()}</div><div className="text-sm font-bold text-black">Reporting Currency: {inUSD ? "USD" : "KHR"}</div></div>
                                </div>
                            </div>
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍ស្ថានភាពហិរញ្ញវត្ថុ / STATEMENT OF FINANCIAL POSITION</h3>
                                <p className="text-sm text-gray-500 italic">As at 31 December {new Date().getFullYear()}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-gray-300">
                                            <th className="p-3 text-left font-bold text-gray-600 uppercase text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ / DESCRIPTION</th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-20" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាំ<br/>NOTE</th>
                                            <th className="p-3 text-center font-bold text-gray-800 uppercase text-xs w-48 bg-white border-l border-gray-200" style={{ borderTop: '4px solid #3B82F6', fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-blue-600 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear()} {inUSD ? 'USD' : 'KHR'}</span></th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-48 bg-slate-50 border-l border-gray-200" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-gray-500 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear() - 1} {inUSD ? 'USD' : 'KHR'}</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {renderSectionHeader("ទ្រព្យសកម្ម / ASSETS")}
                                        {assets.map(r => renderRow(r.description, getDr(r) - getCr(r), getPriorDr(r) - getPriorCr(r), false, true))}
                                        {renderRow("ទ្រព្យសកម្មសរុប / TOTAL ASSETS", totalAssets, assets.reduce((sum, r) => sum + (getPriorDr(r) - getPriorCr(r)), 0), true)}

                                        <tr className="h-6"></tr>

                                        {renderSectionHeader("មូលធន និង បំណុល / EQUITY & LIABILITIES")}

                                        {renderSectionHeader("មូលធន / EQUITY")}
                                        {equity.map(r => renderRow(r.description, getCr(r) - getDr(r), getPriorCr(r) - getPriorDr(r), false, true))}
                                        {renderRow("ប្រាក់ចំណេញបច្ចុប្បន្ន / CURRENT YEAR EARNINGS", netProfit, revenue.reduce((sum, r) => sum + getPriorCr(r), 0) - costOfSales.reduce((sum, r) => sum + getPriorDr(r), 0) - expenses.reduce((sum, r) => sum + getPriorDr(r), 0), false, true)} {/* Auto Inserted */}
                                        {renderRow("មូលធនសរុប / TOTAL EQUITY", totalEquity + netProfit, equity.reduce((sum, r) => sum + (getPriorCr(r) - getPriorDr(r)), 0) + (revenue.reduce((sum, r) => sum + getPriorCr(r), 0) - costOfSales.reduce((sum, r) => sum + getPriorDr(r), 0) - expenses.reduce((sum, r) => sum + getPriorDr(r), 0)), true)}

                                        {renderSectionHeader("បំណុល / LIABILITIES")}
                                        {liabilities.map(r => renderRow(r.description, getCr(r) - getDr(r), getPriorCr(r) - getPriorDr(r), false, true))}
                                        {renderRow("បំណុលសរុប / TOTAL LIABILITIES", totalLiabs, liabilities.reduce((sum, r) => sum + (getPriorCr(r) - getPriorDr(r)), 0), true)}

                                        <tr className="h-4"></tr>
                                        <tr className="border-t-4 border-gray-800 border-b-4 border-gray-800 bg-gray-50">
                                            <td className="p-4 font-bold text-lg uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មូលធន និង បំណុលសរុប / TOTAL EQUITY & LIABILITIES</td>
                                            <td className="p-4 text-center font-mono text-gray-500">-</td>
                                            <td className="p-4 text-right font-bold font-mono text-lg border-l border-gray-200">{(totalLiabs + totalEquity + netProfit).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                            <td className="p-4 text-right font-bold font-mono text-lg border-l border-gray-200">
                                                {(
                                                    liabilities.reduce((sum, r) => sum + (getPriorCr(r) - getPriorDr(r)), 0) +
                                                    equity.reduce((sum, r) => sum + (getPriorCr(r) - getPriorDr(r)), 0) +
                                                    (revenue.reduce((sum, r) => sum + getPriorCr(r), 0) - costOfSales.reduce((sum, r) => sum + getPriorDr(r), 0) - expenses.reduce((sum, r) => sum + getPriorDr(r), 0))
                                                ).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'annual' && (
                    <div className="print-section">
                        {/* Page 3: Cash Flow */}
                        <div className={\`\${activeTab === 'cf' ? 'block' : 'hidden print:block'}\`}>
                            <div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">
                                <div className="flex justify-between items-start mb-8">
                                    <div><h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{companyNameKh}</h1><h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2 px-1">{companyNameEn}</h2></div>
                                    <div className="text-right flex flex-col items-end gap-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Detail</div><h3 className="text-xl font-bold text-black uppercase tracking-widest mt-1">របាយការណ៍លំហូរសាច់ប្រាក់ / STATEMENT OF CASH FLOWS</h3><div className="text-sm font-bold text-black mt-1">For the year ended 31 December {new Date().getFullYear()}</div><div className="text-sm font-bold text-black">Reporting Currency: {inUSD ? "USD" : "KHR"}</div></div>
                                </div>
                            </div>
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍លំហូរសាច់ប្រាក់ / STATEMENT OF CASH FLOWS</h3>
                                <p className="text-sm text-gray-500 italic">For the year ended 31 December {new Date().getFullYear()}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-gray-300">
                                            <th className="p-3 text-left font-bold text-gray-600 uppercase text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ / DESCRIPTION</th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-20" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាំ<br/>NOTE</th>
                                            <th className="p-3 text-center font-bold text-gray-800 uppercase text-xs w-48 bg-white border-l border-gray-200" style={{ borderTop: '4px solid #3B82F6', fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-blue-600 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear()} {inUSD ? 'USD' : 'KHR'}</span></th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-48 bg-slate-50 border-l border-gray-200" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-gray-500 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear() - 1} {inUSD ? 'USD' : 'KHR'}</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {renderSectionHeader("លំហូរសាច់ប្រាក់ពីសកម្មភាពប្រតិបត្តិការ / CASH FLOWS FROM OPERATING ACTIVITIES")}
                                        {renderRow("ប្រាក់ចំណេញសុទ្ធមុនបង់ពន្ធ / NET PROFIT BEFORE TAX", netProfit, 0, true)}
                                        {renderRow("កែតម្រូវសម្រាប់ / ADJUSTMENTS FOR:", 0, 0, false, true)}
                                        {renderRow(" - រំលស់ទ្រព្យសកម្ម / DEPRECIATION AND AMORTIZATION", deprExp, 0, false, true)}
                                        {renderRow(" - ចំណូលការប្រាក់ / INTEREST INCOME", -intInc, 0, false, true)}
                                        {renderRow(" - ចំណាយការប្រាក់ / INTEREST EXPENSE", intExp, 0, false, true)}
                                        <tr className="h-2"></tr>
                                        {renderRow("បម្រែបម្រួលទុនបង្វិល / CHANGES IN WORKING CAPITAL:", 0, 0, false, true)}
                                        {renderRow(" - កើនឡើង ឬ ថយចុះនូវស្តុក / (INC)/DEC IN INVENTORIES", -inventory, 0, false, true)}
                                        {renderRow(" - កើនឡើង ឬ ថយចុះនូវប្រាក់ត្រូវទទួល / (INC)/DEC IN RECEIVABLES", -receivables, 0, false, true)}
                                        {renderRow(" - កើនឡើង ឬ ថយចុះនូវប្រាក់ត្រូវសង / INC/(DEC) IN PAYABLES", payables, 0, false, true)}
                                        <tr className="border-t border-gray-300"><td colSpan="4"></td></tr>
                                        {renderRow("សាច់ប្រាក់សុទ្ធពីសកម្មភាពប្រតិបត្តិ / NET CASH FROM OPERATING ACTIVITIES", netProfit + deprExp + intExp - intInc - inventory - receivables + payables, 0, true)}

                                        <tr className="h-6"></tr>

                                        {renderSectionHeader("លំហូរសាច់ប្រាក់ពីសកម្មភាពវិនិយោគ / CASH FLOWS FROM INVESTING ACTIVITIES")}
                                        {assets.filter(a => (a.description?.toLowerCase() || '').includes('fixed') || (a.description?.toLowerCase() || '').includes('equipment')).map(r =>
                                            renderRow(\`PURCHASE OF \${r.description}\`, -(getDr(r) - getCr(r)), 0, false, true)
                                        )}
                                        {renderRow("ការប្រាក់ទទួលបាន / INTEREST RECEIVED", intInc, 0, false, true)}
                                        <tr className="border-t border-gray-300"><td colSpan="4"></td></tr>
                                        {renderRow("សាច់ប្រាក់សុទ្ធពីសកម្មភាពវិនិយោគ / NET CASH USED IN INVESTING ACTIVITIES", assets.filter(a => (a.description?.toLowerCase() || '').includes('fixed') || (a.description?.toLowerCase() || '').includes('equipment')).reduce((sum, r) => sum - (getDr(r) - getCr(r)), 0) + intInc, 0, true)}

                                        <tr className="h-6"></tr>

                                        {renderSectionHeader("លំហូរសាច់ប្រាក់ពីសកម្មភាពហិរញ្ញប្បទាន / CASH FLOWS FROM FINANCING ACTIVITIES")}
                                        {equity.filter(e => (e.description?.toLowerCase() || '').includes('capital')).map(r =>
                                            renderRow(\`ISSUANCE OF \${r.description}\`, (getCr(r) - getDr(r)), 0, false, true)
                                        )}
                                        {renderRow("ភាគលាភបានបើក / DIVIDENDS PAID", 0, 0, false, true)}
                                        {renderRow("ការប្រាក់បានបង់ / INTEREST PAID", -intExp, 0, false, true)}
                                        <tr className="border-t border-gray-300"><td colSpan="4"></td></tr>
                                        {renderRow("សាច់ប្រាក់សុទ្ធពីសកម្មភាពហិរញ្ញប្បទាន / NET CASH USED IN FINANCING ACTIVITIES", equity.filter(e => (e.description?.toLowerCase() || '').includes('capital')).reduce((sum, r) => sum + (getCr(r) - getDr(r)), 0) - intExp, 0, true)}

                                        <tr className="h-8"></tr>
                                        <tr className="border-t-4 border-gray-800 border-b-4 border-gray-800 bg-gray-50">
                                            <td className="p-4 font-bold text-lg uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>កំណើនសាច់ប្រាក់សុទ្ធ / NET INCREASE IN CASH</td>
                                            <td className="p-4 text-center font-mono text-gray-500">-</td>
                                            <td className="p-4 text-right font-bold font-mono text-lg border-l border-gray-200">
                                                {(
                                                    netProfit +
                                                    assets.filter(a => (a.description?.toLowerCase() || '').includes('fixed') || (a.description?.toLowerCase() || '').includes('equipment')).reduce((sum, r) => sum - (getDr(r) - getCr(r)), 0) +
                                                    equity.filter(e => (e.description?.toLowerCase() || '').includes('capital')).reduce((sum, r) => sum + (getCr(r) - getDr(r)), 0)
                                                ).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="p-4 text-right border-l border-gray-200 text-gray-400 font-mono">-</td>
                                        </tr>
                                        {renderRow("សាច់ប្រាក់ដើមគ្រា / CASH AT BEGINNING OF YEAR", 0, 0, false, true)}
                                        {renderRow("សាច់ប្រាក់ចុងគ្រា / CASH AT END OF YEAR", (
                                            netProfit +
                                            assets.filter(a => (a.description?.toLowerCase() || '').includes('fixed') || (a.description?.toLowerCase() || '').includes('equipment')).reduce((sum, r) => sum - (getDr(r) - getCr(r)), 0) +
                                            equity.filter(e => (e.description?.toLowerCase() || '').includes('capital')).reduce((sum, r) => sum + (getCr(r) - getDr(r)), 0)
                                        ), 0, true)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}

                    {viewMode === 'annual' && (
                    <div className="print-section">
                        {/* Page 4: Statement of Changes in Equity */}
                        <div className={\`\${activeTab === 'sce' ? 'block' : 'hidden print:block'}\`}>
                            <div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">
                                <div className="flex justify-between items-start mb-8">
                                    <div><h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{companyNameKh}</h1><h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2 px-1">{companyNameEn}</h2></div>
                                    <div className="text-right flex flex-col items-end gap-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Detail</div><h3 className="text-xl font-bold text-black uppercase tracking-widest mt-1">តារាងបម្រែបម្រួលមូលធន / STATEMENT OF CHANGES IN EQUITY</h3><div className="text-sm font-bold text-black mt-1">For the year ended 31 December {new Date().getFullYear()}</div><div className="text-sm font-bold text-black">Reporting Currency: {inUSD ? "USD" : "KHR"}</div></div>
                                </div>
                            </div>
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងបម្រែបម្រួលមូលធន / STATEMENT OF CHANGES IN EQUITY</h3>
                                <p className="text-sm text-gray-500 italic">For the year ended 31 December {new Date().getFullYear()}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <tbody>
                                        <tr className="bg-gray-50 font-bold border-b border-gray-300">
                                            <td className="p-3">Description</td>
                                            <td className="p-3 text-right">Owner Capital</td>
                                            <td className="p-3 text-right">Retained Earnings</td>
                                            <td className="p-3 text-right">Total Equity</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="p-3 pl-4">Opening Balance</td>
                                            <td className="p-3 text-right font-mono">{(equity.reduce((sum, e) => sum + (getPriorCr(e) - getPriorDr(e)), 0)).toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono">0</td>
                                            <td className="p-3 text-right font-mono">{(equity.reduce((sum, e) => sum + (getPriorCr(e) - getPriorDr(e)), 0)).toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="p-3 pl-4">Capital Injections / (Drawings)</td>
                                            <td className="p-3 text-right font-mono">{(equity.reduce((sum, e) => sum + (getCr(e) - getDr(e) - (getPriorCr(e) - getPriorDr(e))), 0)).toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono">-</td>
                                            <td className="p-3 text-right font-mono">{(equity.reduce((sum, e) => sum + (getCr(e) - getDr(e) - (getPriorCr(e) - getPriorDr(e))), 0)).toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="p-3 pl-4">Profit for the year</td>
                                            <td className="p-3 text-right font-mono">-</td>
                                            <td className="p-3 text-right font-mono">{netProfit.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono">{netProfit.toLocaleString()}</td>
                                        </tr>
                                        <tr className="h-4"></tr>
                                        <tr className="border-t-2 border-black border-b-2 border-double bg-gray-50 font-bold">
                                            <td className="p-3">Balance at 31 December {new Date().getFullYear()}</td>
                                            <td className="p-3 text-right font-mono">{totalEquity.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono">{netProfit.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono">{(totalEquity + netProfit).toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}

                    {viewMode === 'annual' && (
                    <div className="print-section">
                        {/* Page 5: Notes */}
                        <div className={\`\${activeTab === 'notes' ? 'block' : 'hidden print:block'}\`}>
                            <div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">
                                <div className="flex justify-between items-start mb-8">
                                    <div><h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{companyNameKh}</h1><h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2 px-1">{companyNameEn}</h2></div>
                                    <div className="text-right flex flex-col items-end gap-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Detail</div><h3 className="text-xl font-bold text-black uppercase tracking-widest mt-1">កំណត់សម្គាល់លើរបាយការណ៍ហិរញ្ញវត្ថុ / NOTES TO THE FINANCIAL STATEMENTS</h3><div className="text-sm font-bold text-black mt-1">For the year ended 31 December {new Date().getFullYear()}</div><div className="text-sm font-bold text-black">Reporting Currency: {inUSD ? "USD" : "KHR"}</div></div>
                                </div>
                            </div>
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>កំណត់សម្គាល់លើរបាយការណ៍ហិរញ្ញវត្ថុ / NOTES TO THE FINANCIAL STATEMENTS</h3>
                                <p className="text-sm text-gray-500 italic">For the year ended 31 December {new Date().getFullYear()}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <tbody className="font-sans">
                                        <tr>
                                            <td colSpan="2" className="p-6">
                                                <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">1. BASIS OF PREPARATION</h4>
                                                <p className="text-gray-700 leading-relaxed mb-6">These financial statements have been prepared in accordance with the Cambodian International Financial Reporting Standards (CIFRS) and CIFRS for SMEs, as directed by the Accounting and Auditing Regulator (ACAR). The financial statements have been prepared under the historical cost convention, modified by the revaluation of certain financial instruments.</p>

                                                <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">2. SIGNIFICANT ACCOUNTING POLICIES</h4>
                                                <div className="space-y-4 text-gray-700">
                                                    <p><strong>Revenue Recognition:</strong> Revenue from technology consulting and factory projects is recognized when control of goods or services is transferred to the customer across specified project milestones.</p>
                                                    <p><strong>Property, Plant, and Equipment:</strong> PPE is stated at cost less accumulated depreciation. Depreciation for technology equipment (e.g., Computers) and fleet vehicles (e.g., Automobiles) is calculated on a straight-line basis using rates strictly adhering to GDT tax depreciation schedules.</p>
                                                    <p><strong>Foreign Currencies:</strong> The functional and presentation currency is the Cambodian Riel (KHR) as per ACAR legal requirements. Transactions in foreign currencies are translated into the functional currency using the exchange rates prevailing at the dates of the transactions.</p>
                                                </div>

                                                <h4 className="font-bold text-gray-900 border-b pb-2 mb-4 mt-8">3. CRITICAL ACCOUNTING ESTIMATES AND JUDGEMENTS</h4>
                                                <p className="text-gray-700 leading-relaxed">The preparation of financial statements requires the use of certain critical accounting estimates. It also requires management to exercise its judgement in the process of applying the entity's accounting policies. Related Party Transactions or special itemized expenses are explicitly reconciled with physical bank statements and invoices.</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}

                    {viewMode === 'monthly' && (
                        <div className="print-section">
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                    {activeTab === 'pl' ? 'របាយការណ៍លទ្ធផលបំបែកប្រចាំខែ / MONTHLY INCOME STATEMENT' : 'របាយការណ៍ស្ថានភាពហិរញ្ញវត្ថុ / STATEMENT OF FINANCIAL POSITION'}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-300">
                                            <th className="p-2 text-left bg-gray-50 sticky left-0 z-10 border-r border-gray-200">Account</th>
                                            {MONTHS.map(m => <th key={m} className="p-2 text-right min-w-[100px] text-gray-600 font-sans font-medium">{m}</th>)}
                                            <th className="p-2 text-right min-w-[120px] font-bold bg-gray-50 border-l border-gray-200">TOTAL</th>
                                        </tr>
                                    </thead>
                                    {activeTab === 'pl' && (
                                        <tbody>
                                            {renderSectionHeader("Revenue", true)}
                                            {mRevenue.map(r => renderMonthRow(r.description, r.months, false, true))}
                                            {renderMonthRow("Total Revenue", mTotalRev, true)}

                                            {renderSectionHeader("Cost of Sales", true)}
                                            {mCOS.map(r => renderMonthRow(r.description, r.months, false, true))}
                                            {renderMonthRow("Gross Profit", mGrossProfit, true)}

                                            {renderSectionHeader("Operating Expenses", true)}
                                            {mExpenses.map(r => renderMonthRow(r.description, r.months, false, true))}
                                            {renderMonthRow("Total Operating Expenses", mTotalExp, true)}

                                            <tr className="h-4"></tr>
                                            {renderMonthRow("NET PROFIT", mNetProfit, true)}
                                        </tbody>
                                    )}
                                    {activeTab === 'bs' && (
                                        <tbody>
                                            {renderSectionHeader("ASSETS", true)}
                                            {mAssets.map(r => renderMonthRow(r.description, r.months, false, true))}
                                            <tr className="h-6"></tr>
                                            {renderSectionHeader("EQUITY & LIABILITIES", true)}
                                            {renderSectionHeader("Equity", true)}
                                            {mEquity.map(r => renderMonthRow(r.description, r.months, false, true))}
                                            {renderSectionHeader("Liabilities", true)}
                                            {mLiabs.map(r => renderMonthRow(r.description, r.months, false, true))}
                                        </tbody>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}
                    
$1`;

content = content.replace(regexMatch, newHTML);

fs.writeFileSync(file, content);
console.log('Successfully updated.');
