import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wand2, Calendar, Tag, Layers } from 'lucide-react';

const GeneralLedger = ({ onBack }) => {
    const [transactions, setTransactions] = useState([]);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tagging, setTagging] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('date'); // 'date' | 'code'
    const [filterCode, setFilterCode] = useState('');

    useEffect(() => {
        fetchLedger();
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
        } catch (err) {
            console.error(err);
            alert('Failed to update tag');
            fetchLedger(); // Revert on error
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

    // Filter transactions
    const filteredTransactions = filterCode
        ? transactions.filter(t => t.accountCode === filterCode)
        : transactions;

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

        // Convert to array and sort by Code
        return Object.values(groups).sort((a, b) => {
            if (a.codeInfo._id === 'uncategorized') return -1; // Put uncategorized first or last? Let's put first for visibility.
            if (b.codeInfo._id === 'uncategorized') return 1;
            return (a.codeInfo.code || '').localeCompare(b.codeInfo.code || '');
        });
    };

    const renderTable = (data, showHeader = true) => (
        <table className="w-full text-left">
            {showHeader && (
                <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 w-[120px]" rowSpan="2">Date</th>
                        <th className="px-6 py-4 w-[200px]" rowSpan="2">Account Code</th>
                        <th className="px-6 py-4 min-w-[300px]" rowSpan="2">Description</th>
                        <th className="px-6 py-4 text-center border-l border-gray-200" colSpan="3">USD ($)</th>
                        <th className="px-6 py-4 text-center border-l border-gray-200" colSpan="3">KHR (៛)</th>
                    </tr>
                    <tr className="border-t border-gray-200">
                        <th className="px-4 py-2 text-right border-l text-gray-500">In</th>
                        <th className="px-4 py-2 text-right text-gray-500">Out</th>
                        <th className="px-4 py-2 text-right text-gray-500">Bal</th>
                        <th className="px-4 py-2 text-right border-l text-gray-500">In</th>
                        <th className="px-4 py-2 text-right text-gray-500">Out</th>
                        <th className="px-4 py-2 text-right text-gray-500">Bal</th>
                    </tr>
                </thead>
            )}
            <tbody className="divide-y divide-gray-100">
                {data.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-xs text-gray-600 font-bold whitespace-nowrap align-top">
                            {formatDateSafe(tx.date)}
                            {tx.rateUsed > 0 && <div className="text-[10px] text-teal-600 mt-1 font-normal">@{tx.rateUsed}</div>}
                        </td>
                        <td className="px-6 py-4 text-xs align-top">
                            <select
                                value={tx.accountCode || ''}
                                onChange={(e) => handleTagChange(tx._id, e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">-- Select Code --</option>
                                {codes.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.code} - {c.description}
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700 font-medium align-top leading-relaxed whitespace-pre-wrap">
                            {tx.description}
                        </td>

                        {/* USD COLUMNS */}
                        <td className="px-4 py-4 text-xs text-right font-bold text-green-600 align-top whitespace-nowrap border-l border-gray-100">
                            {tx.amount > 0 ? tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                        </td>
                        <td className="px-4 py-4 text-xs text-right font-bold text-red-600 align-top whitespace-nowrap">
                            {tx.amount < 0 ? Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                        </td>
                        <td className="px-4 py-4 text-xs text-right text-gray-900 font-bold align-top whitespace-nowrap">
                            {tx.balance ? tx.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>

                        {/* KHR COLUMNS */}
                        <td className="px-4 py-4 text-xs text-right font-bold text-teal-600 align-top whitespace-nowrap border-l border-gray-100 bg-gray-50/50">
                            {tx.amountKHR > 0 ? tx.amountKHR.toLocaleString('en-US', { maximumFractionDigits: 0 }) : ''}
                        </td>
                        <td className="px-4 py-4 text-xs text-right font-bold text-red-400 align-top whitespace-nowrap bg-gray-50/50">
                            {tx.amountKHR < 0 ? Math.abs(tx.amountKHR).toLocaleString('en-US', { maximumFractionDigits: 0 }) : ''}
                        </td>
                        <td className="px-4 py-4 text-xs text-right text-gray-600 font-bold align-top whitespace-nowrap bg-gray-50/50">
                            {tx.balanceKHR ? tx.balanceKHR.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                        General Ledger
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Full chronological financial history.</p>
                </div>
                <div className="flex gap-3">
                    {/* View Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
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

                    <div className="h-8 w-px bg-gray-200 mx-2"></div>

                    <button
                        onClick={handleAutoTag}
                        disabled={tagging}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <Wand2 className={`w-4 h-4 ${tagging ? 'animate-spin' : ''}`} />
                        {tagging ? 'AI Analyzing...' : 'Auto-Tag with AI'}
                    </button>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                    >
                        ← Back
                    </button>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-auto">
                {/* Summary & Filters */}
                {!loading && (
                    <div className="max-w-7xl mx-auto space-y-6 mb-8">
                        {/* Filter Bar */}
                        <div className="flex justify-end">
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-xs font-bold text-gray-500 uppercase">Values for:</span>
                                <select
                                    value={filterCode}
                                    onChange={(e) => setFilterCode(e.target.value)}
                                    className="text-sm font-medium text-blue-700 outline-none bg-transparent min-w-[200px]"
                                >
                                    <option value="">All Transactions</option>
                                    {codes.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.code} - {c.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        {transactions.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Money In</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        ${filteredTransactions.reduce((acc, tx) => acc + (tx.amount > 0 ? tx.amount : 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Money Out</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">
                                        ${Math.abs(filteredTransactions.reduce((acc, tx) => acc + (tx.amount < 0 ? tx.amount : 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Balance</p>
                                    <p className="text-2xl font-bold text-blue-900 mt-1">
                                        ${filteredTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="max-w-7xl mx-auto space-y-8">
                    {loading ? (
                        <div className="bg-white p-12 text-center text-gray-500 rounded-xl border border-gray-200">Loading Ledger...</div>
                    ) : error ? (
                        <div className="bg-white p-12 text-center text-red-500 rounded-xl border border-gray-200">Error: {error}</div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="bg-white p-12 text-center text-gray-500 rounded-xl border border-gray-200">No transactions found for this selection.</div>
                    ) : viewMode === 'date' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {renderTable(filteredTransactions)}
                        </div>
                    ) : (
                        // CODE VIEW RENDER
                        getGroupedTransactions().map((group, idx) => (
                            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                                <div className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center ${group.codeInfo._id === 'uncategorized' ? 'bg-red-50' : 'bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${group.codeInfo._id === 'uncategorized' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <Tag size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                                <span className="font-mono text-blue-600">{group.codeInfo.code}</span>
                                                <span>{group.codeInfo.description}</span>
                                            </h3>
                                            <p className="text-xs text-gray-500">{group.items.length} transactions</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Group Total</p>
                                        <p className={`font-bold font-mono text-lg ${group.items.reduce((sum, t) => sum + t.amount, 0) >= 0 ? 'text-green-600' : 'text-red-500'
                                            }`}>
                                            ${group.items.reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                                {renderTable(group.items, true)}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeneralLedger;
