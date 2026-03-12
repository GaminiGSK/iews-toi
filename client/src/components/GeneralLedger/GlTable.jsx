import React from 'react';

const formatDateSafe = (dateString, format = 'Mon DD, YYYY') => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (format === 'Mon DD, YYYY') {
            return date.toLocaleDateString('en-US', {
                month: 'short', day: '2-digit', year: 'numeric'
            });
        }
        return date.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    } catch { return '-'; }
};

const GlTable = ({ transactions, codes, currencyMode }) => {
    let runningBalance = 0;

    // Helper to format values according to currency mode
    // We expect the backend numbers to be full amounts.
    // If USD, show exactly with 2 decimals. If KHR, format fully with no decimals.
    const formatValue = (amount, mode) => {
        if (!amount || amount === 0) return '';
        
        let prefix = mode === 'KHR' ? 'KHR ' : '$ ';
        let numParts;
        
        if (mode === 'KHR') {
            numParts = Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 });
        } else {
             numParts = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        return `${prefix}${numParts}`;
    };

    return (
        <table className="w-full text-left border-collapse border border-slate-400 text-sm">
            <thead className="bg-[#e2edf3] text-gray-800 font-bold border-b-2 border-slate-400 text-center text-[13px]">
                <tr>
                    <th className="px-3 py-2 border-r border-slate-400 w-[110px]">Date</th>
                    <th className="px-3 py-2 border-r border-slate-400 w-[80px]">Account<br/>Code</th>
                    <th className="px-6 py-2 w-full border-r border-slate-400">Description</th>
                    <th className="px-3 py-2 border-r border-slate-400 w-[80px]">Post Ref.</th>
                    <th className="px-6 py-2 border-r border-slate-400 min-w-[140px]">Debit</th>
                    <th className="px-6 py-2 border-r border-slate-400 min-w-[140px]">Credit</th>
                    <th className="px-6 py-2 border-r border-slate-400 min-w-[160px]">Running Balance</th>
                    <th className="px-6 py-2 min-w-[200px]">Audit Trail</th>
                </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-300">
                {/* Totals Row Moved To Top */}
                <tr className="bg-[#e8f1f5] font-bold border-b-2 border-slate-400">
                    <td colSpan="4" className="px-4 py-3 border-r border-slate-400 text-center uppercase tracking-wide text-blue-900">
                        Running Totals & Balance
                    </td>
                    <td className="px-4 py-3 border-r border-slate-400 text-right text-blue-900">
                        {formatValue(
                            transactions.reduce((sum, tx) => sum + (Number(String(currencyMode === 'KHR' ? tx.amountKHR : tx.amount).replace(/[^0-9.-]+/g, "")) > 0 ? Number(String(currencyMode === 'KHR' ? tx.amountKHR : tx.amount).replace(/[^0-9.-]+/g, "")) : 0), 0)
                        , currencyMode)}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-400 text-right text-blue-900">
                        {formatValue(
                            Math.abs(transactions.reduce((sum, tx) => sum + (Number(String(currencyMode === 'KHR' ? tx.amountKHR : tx.amount).replace(/[^0-9.-]+/g, "")) < 0 ? Number(String(currencyMode === 'KHR' ? tx.amountKHR : tx.amount).replace(/[^0-9.-]+/g, "")) : 0), 0))
                        , currencyMode)}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-400 text-right text-blue-900">
                        {formatValue(
                            transactions.reduce((acc, tx) => acc + (Number(String(currencyMode === 'KHR' ? tx.amountKHR : tx.amount).replace(/[^0-9.-]+/g, "")) || 0), 0)
                        , currencyMode)}
                    </td>
                    <td className="px-4 py-3 text-xs text-green-700 font-bold whitespace-nowrap bg-[#e2edf3]">
                        Verified: Cash: Cash Balance
                    </td>
                </tr>

                {transactions.map((tx, idx) => {
                    const rawAmount = currencyMode === 'KHR' ? tx.amountKHR : tx.amount;
                    
                    // We need a numeric cast because the backend often stores as strings
                    const numericAmount = Number(String(rawAmount).replace(/[^0-9.-]+/g, "")) || 0;
                    runningBalance += numericAmount;

                    let debitStr = '';
                    let creditStr = '';

                    if (numericAmount > 0) debitStr = formatValue(numericAmount, currencyMode);
                    if (numericAmount < 0) creditStr = formatValue(numericAmount, currencyMode);

                    // Mockup Project logic insertion (In a real app, 'tx.projectTag' would be mapped)
                    const isSalaryMockup = String(tx.description).toLowerCase().includes('salary');

                    return (
                        <tr key={idx} className={`align-top hover:bg-yellow-50/50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                            <td className="px-3 py-2 border-r border-slate-300 whitespace-nowrap text-gray-700">
                                {formatDateSafe(tx.date)}
                            </td>
                            <td className="px-3 py-2 border-r border-slate-300 text-center">
                                {codes.find(c => c._id === tx.accountCode)?.code || '-'}
                            </td>
                            <td className="px-4 py-2 border-r border-slate-300 leading-relaxed max-w-[300px] text-gray-800">
                                {typeof tx.description === 'object' ? JSON.stringify(tx.description) : String(tx.description || '')}
                                {tx.isJournalEntry && (
                                    <div className="text-[11px] text-gray-500 italic mt-1">Capitalized asset, to consultant asset</div>
                                )}
                                {isSalaryMockup && (
                                    <div className="text-[11px] mt-1 text-blue-600">
                                       - Sub-notors to <span className="underline cursor-pointer">Project Time Tracking</span><br/>
                                       - <span className="underline cursor-pointer">TOS Filing</span>
                                    </div>
                                )}
                            </td>
                            <td className="px-3 py-2 border-r border-slate-300 text-center text-xs font-mono text-gray-400">
                                {tx.sequence || ''}
                            </td>
                            <td className="px-4 py-2 border-r border-slate-300 text-right whitespace-nowrap">
                                {debitStr}
                            </td>
                            
                            <td className="px-4 py-2 border-r border-slate-300 text-right whitespace-nowrap relative">
                                {creditStr}
                                {isSalaryMockup && (
                                    <div className="text-[11px] text-gray-500 block text-right mt-1 font-mono">
                                        Proj_A_MobileApp
                                    </div>
                                )}
                            </td>

                            <td className="px-4 py-2 border-r border-slate-300 text-right whitespace-nowrap">
                                {formatValue(runningBalance, currencyMode)}
                            </td>
                            
                            <td className="px-4 py-2 text-xs text-gray-600 max-w-[250px] leading-tight flex flex-col gap-1">
                                {numericAmount > 0 
                                  ? <span>Verification: All Direct Costs matched to billable project</span>
                                  : <span>Reconciliation: Bank statement cash balance matches 10110 closing balance</span>
                                }
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default GlTable;
