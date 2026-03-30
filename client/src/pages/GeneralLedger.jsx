import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Tag, Sparkles, Wand2, Calendar, Layers, Lock, Unlock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import ErrorBoundary from '../components/ErrorBoundary';

const GeneralLedger = ({ onBack }) => {
    const [transactions, setTransactions] = useState([]);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tagging, setTagging] = useState(false);
    const [error, setError] = useState(null);
    const [taggingStatus, setTaggingStatus] = useState('');
    const [lockedGLYears, setLockedGLYears] = useState([]);
    const [userRole, setUserRole] = useState('unit');
    const [companyNameEn, setCompanyNameEn] = useState('');
    const [companyNameKh, setCompanyNameKh] = useState('');

    // Fetch TOI BR Database data for Company name if available
    const [filledData, setFilledData] = useState(() => {
        try {
            const saved = localStorage.getItem('toiFilledData');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    // Helper functions for formatting dates
    const [viewMode, setViewMode] = useState('date'); // 'date' | 'code'
    const [filterCode, setFilterCode] = useState('');
    const [fiscalYear, setFiscalYear] = useState('all');
    const [bulkTargetCode, setBulkTargetCode] = useState('');
    const [adjustCodeId, setAdjustCodeId] = useState('');

    useEffect(() => {
        fetchLedger();
        const handleRefresh = () => fetchLedger();
        window.addEventListener('ledger:refresh', handleRefresh);
        return () => window.removeEventListener('ledger:refresh', handleRefresh);
    }, []);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const [ledgerRes, codesRes] = await Promise.all([
                axios.get('/api/company/ledger', { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get('/api/company/codes', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            setTransactions(ledgerRes.data.transactions || []);
            setCodes(codesRes.data.codes || []);
            setLockedGLYears(ledgerRes.data.lockedGLYears || []);
            setUserRole(ledgerRes.data.userRole || 'unit');
            setCompanyNameEn(ledgerRes.data.companyNameEn || '');
            setCompanyNameKh(ledgerRes.data.companyNameKh || '');
            setError(null);
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message;
            setError(errMsg);
            if (err.response?.status === 401) {
                alert('Session Expired. Please Login Again.');
                localStorage.removeItem('token');
                window.location.reload();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTagChange = async (transactionId, accountCodeId) => {
        try {
            const token = localStorage.getItem('token');
            // Optimistically update UI
            setTransactions(prev => prev.map(tx =>
                tx._id === transactionId ? { ...tx, accountCode: accountCodeId } : tx
            ));

            await axios.post('/api/company/transactions/tag', {
                transactionId,
                accountCodeId: accountCodeId || null // handle Empty string logic
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            window.dispatchEvent(new Event('ledger:refresh'));
        } catch (err) {
            console.error(err);
            alert('Failed to update tag');
            fetchLedger(); // Revert on error
        }
    };



    // Toggle Lock Year
    const handleToggleLock = async () => {
        if (fiscalYear === 'all') return;
        const isLocked = lockedGLYears.includes(fiscalYear);
        const actionStr = isLocked ? 'UNLOCK' : 'LOCK';
        if (!window.confirm(`Are you sure you want to ${actionStr} the entire fiscal year ${fiscalYear}?\n\nIf locked, no transactions from this year can be re-categorized.`)) return;

        try {
            setTagging(true);
            const token = localStorage.getItem('token');
            const targetCompanyCode = new URLSearchParams(window.location.search).get('companyCode');
            const res = await axios.post('/api/company/lock-year', {
                year: fiscalYear,
                locked: !isLocked,
                companyCode: targetCompanyCode
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            
            setLockedGLYears(res.data.lockedGLYears || []);
            alert(res.data.message);
        } catch (err) {
            console.error(err);
            alert('Failed to toggle year lock');
        } finally {
            setTagging(false);
        }
    };

    const handleAdjustBalance = async () => {
        if (!adjustCodeId || fiscalYear === 'all') return;
        
        const currentNet = filteredTransactions
            .filter(tx => !tx.isJournalEntry)
            .reduce((acc, tx) => acc + (Number(String(tx.amount).replace(/[^0-9.-]+/g, "")) || 0), 0);
            
        if (currentNet === 0) {
            alert('Net movement is already 0. No adjustment needed.');
            return;
        }

        const offsetAmount = currentNet * -1;
        const targetName = codes.find(c => c._id === adjustCodeId)?.code || 'Unknown';
        
        if (!window.confirm(`ADJUSTMENT: This will create a $${offsetAmount.toFixed(2)} manual transaction under Code ${targetName} to bring the Net Movement exactly to zero.\n\nProceed?`)) return;

        try {
            setTagging(true);
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/transactions/adjustment', {
                amount: offsetAmount,
                accountCodeId: adjustCodeId,
                year: fiscalYear
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            
            alert(res.data.message);
            setAdjustCodeId('');
            window.dispatchEvent(new Event('ledger:refresh'));
            fetchLedger();
        } catch (err) {
            console.error(err);
            alert('Failed to create adjustment. Ensure the fiscal year is set.');
            fetchLedger();
        } finally {
            setTagging(false);
        }
    };

    const handleSafeBulkTag = async () => {
        if (!bulkTargetCode) return;

        // Safety Logic: Only target transactions that are currently UNASSIGNED or UNCATEGORIZED
        // And respect the current filter view (though button is only shown if !filterCode usually)
        const targetIds = filteredTransactions
            .filter(t => !t.accountCode || t.accountCode === 'uncategorized')
            .map(t => t._id);

        if (targetIds.length === 0) {
            alert('No unassigned transactions found to update.');
            return;
        }

        const targetName = codes.find(c => c._id === bulkTargetCode)?.code || 'Unknown';
        if (!window.confirm(`SAFE ASSIGN: Assign "${targetName}" to ${targetIds.length} UNASSIGNED transactions?\n\n(Already assigned transactions will be skipped)`)) return;

        try {
            setTagging(true);
            const token = localStorage.getItem('token');

            const promises = targetIds.map(id =>
                axios.post('/api/company/transactions/tag', {
                    transactionId: id,
                    accountCodeId: bulkTargetCode
                }, { headers: { 'Authorization': `Bearer ${token}` } })
            );

            await Promise.all(promises);

            alert('Unbalance assigned successfully.');
            setBulkTargetCode('');
            window.dispatchEvent(new Event('ledger:refresh'));
            fetchLedger();
        } catch (err) {
            console.error(err);
            alert('Update failed.');
            fetchLedger();
        } finally {
            setTagging(false);
        }
    };

    const handleAutoTag = async () => {
        try {
            setTagging(true);
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/transactions/auto-tag', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert(res.data.message);
            window.dispatchEvent(new Event('ledger:refresh'));
            fetchLedger(); // Refresh to see changes
        } catch (err) {
            console.error(err);
            alert('Auto-Tag failed. Check console.');
        } finally {
            setTagging(false);
        }
    };

    const formatDateSafe = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch { return '-'; }
    };

    const bankCodeObj = codes.find(c => c.code === '10130');
    const abaCodeId = bankCodeObj ? bankCodeObj._id : null;

    // Filter transactions
    const filteredTransactions = transactions.filter(t => {
        if (fiscalYear !== 'all') {
            const y = t.date ? new Date(t.date).getFullYear() : null;
            if (y && y.toString() !== fiscalYear) return false;
        }

        if (filterCode === 'uncategorized') {
            return !t.accountCode || t.accountCode === 'uncategorized';
        } else if (filterCode) {
            return t.accountCode === filterCode;
        }
        
        return true;
    });

    // Calculate grouping for Code View
    const getGroupedTransactions = () => {
        const groups = {};

        // Initialize groups for all codes to ensure they appear even if empty (optional, but good for overview)
        // Or just group existing transactions. Let's group existing to avoid clutter.

        filteredTransactions.forEach(tx => {
            const codeId = tx.accountCode || 'uncategorized';
            if (!groups[codeId]) {
                groups[codeId] = {
                    codeInfo: codeId === 'uncategorized'
                        ? { code: '???', description: 'Uncategorized / Suspense', _id: 'uncategorized' }
                        : codes.find(c => c._id === codeId) || { code: 'ERR', description: 'Unknown Code', _id: codeId },
                    items: []
                };
            }
            groups[codeId].items.push(tx);
        });

        // Convert to array and sort by Code safely
        return Object.values(groups).sort((a, b) => {
            if (a.codeInfo._id === 'uncategorized') return -1;
            if (b.codeInfo._id === 'uncategorized') return 1;
            return String(a.codeInfo.code || '').localeCompare(String(b.codeInfo.code || ''));
        });
    };

    const renderTable = (data, showHeader = true) => {
        return (
            <table className="w-full text-left print:text-black print:table-fixed">
                {showHeader && (
                    <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase border-b border-gray-200 print:bg-white print:text-[8px] print:text-black print:border-b print:border-black">
                        <tr>
                            <th className="px-6 py-4 w-[120px] print:px-2 print:py-3 print:border-b print:border-black print:w-[11%] print:text-[12px]" rowSpan="2">Date</th>
                            <th className="px-6 py-4 w-[200px] print:px-2 print:py-3 print:border-b print:border-black print:w-[12%] print:text-[12px]" rowSpan="2">Account Code</th>
                            <th className="px-6 py-4 w-full print:px-2 print:py-3 print:border-b print:border-black print:w-[31%] print:text-[12px]" rowSpan="2">Description</th>
                            <th className="px-6 py-4 text-center border-l border-gray-200 print:px-2 print:py-3 print:border-black print:border-l print:text-[12px] print:w-[23%]" colSpan="3">USD ($)</th>
                            <th className="px-6 py-4 text-center border-l border-gray-200 print:px-2 print:py-3 print:border-black print:border-l print:text-[12px] print:w-[23%]" colSpan="3">KHR (៛)</th>
                        </tr>
                        <tr className="border-t border-gray-200 print:border-black">
                            <th className="px-4 py-2 text-right border-l text-gray-500 print:px-2 print:py-2 print:border-l print:border-black print:text-[11px]">In</th>
                            <th className="px-4 py-2 text-right text-gray-500 print:px-2 print:py-2 print:text-[11px]">Out</th>
                            <th className="px-4 py-2 text-right text-gray-500 print:px-2 print:py-2 print:text-[11px]">Bal</th>
                            <th className="px-4 py-2 text-right border-l text-gray-500 print:px-2 print:py-2 print:border-l print:border-black print:text-[11px]">In</th>
                            <th className="px-4 py-2 text-right text-gray-500 print:px-2 print:py-2 print:text-[11px]">Out</th>
                            <th className="px-4 py-2 text-right text-gray-500 print:px-2 print:py-2 print:text-[11px]">Bal</th>
                        </tr>
                    </thead>
                )}
                <tbody className="divide-y divide-gray-100 print:divide-y print:divide-gray-400">
                    {data.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition print:break-inside-avoid print:bg-white print:border-b print:border-gray-400">
                            <td className="px-6 py-4 text-xs text-gray-600 font-bold whitespace-nowrap align-top print:px-2 print:py-4 print:text-[13px] print:text-black">
                                {formatDateSafe(tx.date)}
                                {tx.rateUsed > 0 && <div className="text-[10px] text-teal-600 mt-1 font-normal print:hidden">@{tx.rateUsed}</div>}
                            </td>
                            <td className="px-6 py-4 text-xs align-top print:px-2 print:py-4">
                                {/* Screen UI */}
                                <div className="flex items-center gap-2 print:hidden">
                                    {(tx.isJournalEntry || (tx.date && lockedGLYears.includes(new Date(tx.date).getFullYear().toString()))) ? (
                                        <div className={`flex-1 px-2 py-1 text-xs font-mono border rounded-lg flex items-center gap-1 shadow-sm ${tx.isJournalEntry ? 'bg-orange-50 text-orange-800 border-orange-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                                            {tx.isJournalEntry ? <Tag size={12} className="text-orange-500" /> : <Lock size={12} className="text-red-500" />}
                                            {codes.find(c => c._id === tx.accountCode)?.code || (tx.isJournalEntry ? 'LOCKED (JE)' : 'LOCKED (YEAR)')}
                                        </div>
                                    ) : (
                                        <select
                                            value={tx.accountCode || ''}
                                            onChange={(e) => handleTagChange(tx._id, e.target.value)}
                                            className={`flex-1 border rounded-lg px-2 py-1 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-colors ${tx.tagSource === 'ai' ? 'border-purple-300 text-purple-700 bg-purple-50/30' : 'border-gray-200 text-gray-700'}`}
                                        >
                                            <option value="">-- Select Code --</option>
                                            {codes.map(c => (
                                                <option key={c._id} value={c._id}>
                                                    {c.code} - {typeof c.description === 'object' ? JSON.stringify(c.description) : String(c.description || '')}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {tx.tagSource === 'ai' && (
                                        <div title="Tagged by AI Logic" className="text-purple-500 animate-pulse">
                                            <Wand2 size={14} />
                                        </div>
                                    )}
                                    {tx.tagSource === 'rule' && (
                                        <div title="Tagged by Keyword Rule" className="text-blue-500">
                                            <Sparkles size={14} />
                                        </div>
                                    )}
                                </div>
                                {/* Print UI */}
                                <div className="hidden print:block font-mono text-[13px] text-black font-semibold truncate max-w-[14vw]">
                                    {codes.find(c => c._id === tx.accountCode)?.code || '---'}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-700 font-medium align-top leading-relaxed whitespace-pre-wrap print:px-2 print:py-4 print:text-[14px] print:text-black print:whitespace-normal print:leading-relaxed">
                                {typeof tx.description === 'object' ? JSON.stringify(tx.description) : String(tx.description || '')}
                            </td>
                            <td className="px-4 py-4 text-xs text-right font-bold text-green-600 align-top whitespace-nowrap border-l border-gray-100 print:border-l print:border-black print:px-2 print:py-4 print:text-[13px] print:text-black print:font-medium">
                                {Number(String(tx.amount).replace(/[^0-9.-]+/g,"")) > 0 ? Number(String(tx.amount).replace(/[^0-9.-]+/g,"")).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                            </td>
                            <td className="px-4 py-4 text-xs text-right font-bold text-red-600 align-top whitespace-nowrap print:px-2 print:py-4 print:text-[13px] print:text-black print:font-medium">
                                {Number(String(tx.amount).replace(/[^0-9.-]+/g,"")) < 0 ? Math.abs(Number(String(tx.amount).replace(/[^0-9.-]+/g,""))).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                            </td>
                            <td className="px-4 py-4 text-xs text-right text-gray-900 font-bold align-top whitespace-nowrap print:px-2 print:py-4 print:text-[13px] print:text-black print:font-semibold">
                                {tx.balance ? Number(String(tx.balance).replace(/[^0-9.-]+/g,"")).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="px-4 py-4 text-xs text-right font-bold text-teal-600 align-top whitespace-nowrap border-l border-gray-100 bg-gray-50/50 print:bg-transparent print:border-l print:border-black print:px-2 print:py-4 print:text-[13px] print:text-black print:font-medium">
                                {Number(String(tx.amountKHR).replace(/[^0-9.-]+/g,"")) > 0 ? Number(String(tx.amountKHR).replace(/[^0-9.-]+/g,"")).toLocaleString('en-US', { maximumFractionDigits: 0 }) : ''}
                            </td>
                            <td className="px-4 py-4 text-xs text-right font-bold text-red-400 align-top whitespace-nowrap bg-gray-50/50 print:bg-transparent print:px-2 print:py-4 print:text-[13px] print:text-black print:font-medium">
                                {Number(String(tx.amountKHR).replace(/[^0-9.-]+/g,"")) < 0 ? Math.abs(Number(String(tx.amountKHR).replace(/[^0-9.-]+/g,""))).toLocaleString('en-US', { maximumFractionDigits: 0 }) : ''}
                            </td>
                            <td className="px-4 py-4 text-xs text-right text-gray-600 font-bold align-top whitespace-nowrap bg-gray-50/50 print:bg-transparent print:px-2 print:py-4 print:text-[13px] print:text-black print:font-semibold">
                                {tx.balanceKHR ? Number(String(tx.balanceKHR).replace(/[^0-9.-]+/g,"")).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <ErrorBoundary>
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 10mm 8mm; }
                    body * { visibility: hidden !important; }
                    .gl-print-root, .gl-print-root * { visibility: visible !important; }
                    .gl-print-root { position: absolute; top: 0; left: 0; width: 100%; background: white !important; }
                    .print\:hidden { display: none !important; }
                    thead { display: table-header-group; }
                    tr { page-break-inside: avoid; }
                }
            `}</style>
            <div className="gl-print-root min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
                {/* Header - Left Aligned */}
                <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-8 sticky top-0 z-20 shadow-sm overflow-x-auto print:hidden">
                    <div className="flex items-center gap-4 shrink-0">
                        <button
                            onClick={onBack}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition shrink-0 shadow-md"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                                General Ledger <span className="bg-blue-100 text-blue-800 text-sm px-2 py-0.5 rounded font-bold">GL1</span>
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">Full chronological financial history.</p>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-gray-200 shrink-0"></div>

                    <div className="flex items-center gap-4 shrink-0">
                        {/* View Toggle */}
                        <div className="bg-gray-100 p-1 rounded-lg flex gap-1 border border-gray-200">
                            <button
                                onClick={() => setViewMode('date')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${viewMode === 'date' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Calendar size={14} /> Date View
                            </button>
                            <button
                                onClick={() => setViewMode('code')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${viewMode === 'code' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Layers size={14} /> Code View
                            </button>
                        </div>

                        {/* Year Dropdown */}
                        <div className="relative">
                            <select
                                value={fiscalYear}
                                onChange={(e) => setFiscalYear(e.target.value)}
                                className="appearance-none bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg h-9 pl-3 pr-8 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer hover:border-blue-400 transition"
                            >
                                {Array.from({length: 21}, (_, i) => new Date().getFullYear() + 2 - i).map(year => (
                                    <option key={year} value={year.toString()}>Year: {year}</option>
                                ))}
                                <option value="all">All Years</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>

                        {/* Lock Status Button (Available to all authorized users to lock their books) */}
                        <button
                            onClick={handleToggleLock}
                            disabled={tagging || fiscalYear === 'all'}
                            title={fiscalYear === 'all' ? "Select a specific Year to Lock or Unlock" : "Lock or Unlock the General Ledger for this fiscal year"}
                            className={`px-3 focus:outline-none flex-shrink-0 py-[7px] border rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                                fiscalYear === 'all' ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60' 
                                : lockedGLYears.includes(fiscalYear) ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {lockedGLYears.includes(fiscalYear) ? <><Lock size={12} /> LOCKED</> : <><Unlock size={12} /> {fiscalYear === 'all' ? 'SELECT YEAR TO LOCK' : 'UNLOCKED'}</>}
                        </button>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <select
                                value={filterCode}
                                onChange={(e) => setFilterCode(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg h-9 pl-3 pr-8 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer hover:border-blue-400 transition"
                            >
                                <option value="">All Transactions</option>
                                <option value="uncategorized">Uncategorized Only</option>
                                <hr />
                                {codes.map(c => {
                                    const descStr = typeof c.description === 'object' ? JSON.stringify(c.description) : String(c.description || '');
                                    return (
                                        <option key={c._id} value={c._id}>
                                            {c.code} - {descStr ? descStr.substring(0, 40) : 'No Description'}...
                                        </option>
                                    );
                                })}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-gray-200 mx-2"></div>

                        <button
                            onClick={handleAutoTag}
                            disabled={tagging}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            <Wand2 className={`w-4 h-4 ${tagging ? 'animate-spin' : ''}`} />
                            {tagging ? 'AI Analyzing...' : 'Auto-Tag'}
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm border border-slate-300 ml-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print A4 Layout
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible print:m-0">
                    {/* Print Only Header */}
                    <div className="hidden print:block pb-4 mb-6 border-b-2 border-black mt-0">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                    {companyNameKh || (filledData ? filledData.name : 'ក្រុមហ៊ុន ជីខេ ស្មាត ឯ.ក')}
                                </h1>
                                <h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2">
                                    {companyNameEn || (filledData ? (filledData.nameEn || filledData.name) : 'GK SMART CO., LTD.')}
                                </h2>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Print Summary</div>
                                <div className="text-sm font-bold text-black">
                                    Opening Balance: <span className="text-indigo-600">${filteredTransactions.length > 0 ? (Number(String([...filteredTransactions].sort((a,b) => new Date(a.date) - new Date(b.date))[0]?.balance || 0).replace(/[^0-9.-]+/g, "")) - Number(String([...filteredTransactions].sort((a,b) => new Date(a.date) - new Date(b.date))[0]?.amount || 0).replace(/[^0-9.-]+/g, ""))).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</span>
                                </div>
                                <div className="text-sm font-bold text-black">
                                    Total In: <span className="text-green-600">${filteredTransactions.filter(tx => !tx.isJournalEntry).reduce((acc, tx) => acc + (Number(String(tx.amount).replace(/[^0-9.-]+/g, "")) > 0 ? Number(String(tx.amount).replace(/[^0-9.-]+/g, "")) : 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="text-sm font-bold text-black">
                                    Total Out: <span className="text-red-600">${filteredTransactions.filter(tx => !tx.isJournalEntry).reduce((acc, tx) => acc + (Number(String(tx.amount).replace(/[^0-9.-]+/g, "")) < 0 ? Math.abs(Number(String(tx.amount).replace(/[^0-9.-]+/g, ""))) : 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="text-sm font-bold text-black">
                                    Closing Balance: <span className="text-blue-600">${filteredTransactions.length > 0 ? Number(String([...filteredTransactions].sort((a,b) => new Date(b.date) - new Date(a.date))[0]?.balance || 0).replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold uppercase tracking-widest text-black/90">
                                    សៀវភៅធំ <br />
                                    General Ledger <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-sm ml-2">GL1</span>
                                </h2>
                                <p className="text-[14px] text-gray-800 font-medium mt-3">
                                    {filterCode && filterCode !== 'uncategorized' ? `Code Filter: ${codes.find(c => c._id === filterCode)?.code || ''} | ` : ''} 
                                    Fiscal Year / ប្រចាំឆ្នាំ: <span className="font-bold">{fiscalYear === 'all' ? 'All Years' : fiscalYear}</span>
                                </p>
                            </div>
                            <div className="text-right text-[14px] text-gray-800 font-bold uppercase tracking-widest">
                                Report Date: {new Date().toLocaleDateString('en-GB')}
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {!loading && (
                        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center print:hidden">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {filterCode === 'uncategorized' ? 'Unassigned Money In' : 'Total Money In'}
                                </p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    ${filteredTransactions
                                        .filter(tx => !tx.isJournalEntry)
                                        .reduce((acc, tx) => acc + (Number(String(tx.amount).replace(/[^0-9.-]+/g, "")) > 0 ? Number(String(tx.amount).replace(/[^0-9.-]+/g, "")) : 0), 0)
                                        .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {filterCode === 'uncategorized' ? 'Unassigned Money Out' : 'Total Money Out'}
                                </p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    ${Math.abs(filteredTransactions
                                        .filter(tx => !tx.isJournalEntry)
                                        .reduce((acc, tx) => acc + (Number(String(tx.amount).replace(/[^0-9.-]+/g, "")) < 0 ? Number(String(tx.amount).replace(/[^0-9.-]+/g, "")) : 0), 0)
                                    ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 ring-2 ring-blue-50 relative">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            {filterCode === 'uncategorized' ? 'Unassigned Balance' : 'Net Movement (In - Out)'}
                                        </p>
                                        <p className={`text-2xl font-bold mt-1 ${filteredTransactions.filter(tx => !tx.isJournalEntry).reduce((acc, tx) => acc + (Number(String(tx.amount).replace(/[^0-9.-]+/g, "")) || 0), 0) >= 0 ? 'text-green-600' : 'text-blue-900'
                                            }`}>
                                            ${filteredTransactions
                                                .filter(tx => !tx.isJournalEntry)
                                                .reduce((acc, tx) => acc + (Number(String(tx.amount).replace(/[^0-9.-]+/g, "")) || 0), 0)
                                                .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>

                                        {/* Adjust Net Movement Tool */}
                                        {!filterCode && fiscalYear !== 'all' && (
                                            <div className="mt-4 pt-3 border-t border-blue-100 flex flex-col gap-2">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase">ADJUST NET MOVEMENT (TO 0)</p>
                                                <select
                                                    value={adjustCodeId}
                                                    onChange={(e) => setAdjustCodeId(e.target.value)}
                                                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none bg-white font-medium text-gray-700"
                                                >
                                                    <option value="">Select Adjustment Code...</option>
                                                    {codes.map(c => (
                                                        <option key={c._id} value={c._id}>
                                                            {c.code} - {typeof c.description === 'object' ? JSON.stringify(c.description) : String(c.description || '')}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={handleAdjustBalance}
                                                    disabled={!adjustCodeId || tagging}
                                                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white border border-transparent rounded text-[11px] font-bold transition disabled:opacity-50 tracking-wider"
                                                >
                                                    CREATE ZERO-OUT ENTRY
                                                </button>
                                            </div>
                                        )}

                                        {/* Safe Bulk Assign Tool */}
                                        {!filterCode && transactions.some(t => !t.accountCode || t.accountCode === 'uncategorized') && (
                                            <div className="mt-3 pt-3 border-t border-blue-100 flex flex-col gap-2">
                                                <p className="text-[10px] font-bold text-blue-400 uppercase">RE-ASSIGN ONLY UNBALANCE</p>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={bulkTargetCode}
                                                        onChange={(e) => setBulkTargetCode(e.target.value)}
                                                        className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none bg-white font-medium text-gray-700"
                                                    >
                                                        <option value="">Assign as Bank Balance...</option>
                                                        {codes.map(c => (
                                                            <option key={c._id} value={c._id}>
                                                                {c.code} - {typeof c.description === 'object' ? JSON.stringify(c.description) : String(c.description || '')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={handleSafeBulkTag}
                                                        disabled={!bulkTargetCode || tagging}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition disabled:opacity-50"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="max-w-7xl mx-auto space-y-8 print:max-w-full print:w-full print:space-y-2">
                        {loading ? (
                            <div className="bg-white p-12 text-center text-gray-500 rounded-xl border border-gray-200">Loading Ledger...</div>
                        ) : error ? (
                            <div className="bg-white p-12 text-center text-red-500 rounded-xl border border-gray-200">Error: {error}</div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="bg-white p-12 text-center text-gray-500 rounded-xl border border-gray-200">No transactions found for this selection.</div>
                        ) : viewMode === 'date' ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none print:w-full">
                                {renderTable(filteredTransactions)}
                            </div>
                        ) : (
                            // CODE VIEW RENDER
                            getGroupedTransactions().map((group, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in print:border-none print:break-inside-avoid print:shadow-none print:mb-4">
                                    <div className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center ${group.codeInfo._id === 'uncategorized' ? 'bg-red-50' : 'bg-gray-50'} print:bg-white print:border-black print:px-2 print:py-2`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${group.codeInfo._id === 'uncategorized' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} print:hidden`}>
                                                <Tag size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                                    <span className="font-mono text-blue-600">{group.codeInfo.code}</span>
                                                    <span>{typeof group.codeInfo.description === 'object' ? JSON.stringify(group.codeInfo.description) : String(group.codeInfo.description || '')}</span>
                                                </h3>
                                                <p className="text-xs text-gray-500">{group.items.length} transactions</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-400 uppercase">Group Total</p>
                                            <p className={`font-bold font-mono text-lg ${group.items.reduce((sum, t) => sum + (Number(String(t.amount).replace(/[^0-9.-]+/g, "")) || 0), 0) >= 0 ? 'text-green-600' : 'text-red-500'
                                                }`}>
                                                ${group.items.reduce((sum, t) => sum + (Number(String(t.amount).replace(/[^0-9.-]+/g, "")) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                    {renderTable(group.items, true)}
                                </div>
                            ))
                        )}
                    </div>
                    {/* Print Footer — Signature Lines */}
                    <div className="hidden print:flex justify-between mt-12 pt-6 border-t border-gray-400 text-xs text-center text-gray-700 font-sans">
                        <div className="w-1/4">
                            <div className="h-12 border-b border-gray-400 mb-2"></div>
                            <p className="font-bold uppercase">Prepared by</p>
                            <p>Finance Officer</p>
                        </div>
                        <div className="w-1/4">
                            <div className="h-12 border-b border-gray-400 mb-2"></div>
                            <p className="font-bold uppercase">Reviewed by</p>
                            <p>Finance Manager</p>
                        </div>
                        <div className="w-1/4">
                            <div className="h-12 border-b border-gray-400 mb-2"></div>
                            <p className="font-bold uppercase">Approved by</p>
                            <p>Director</p>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default GeneralLedger;

