import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GeneralLedger = ({ onBack }) => {
    const [transactions, setTransactions] = useState([]);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const formatDateSafe = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch { return '-'; }
    };

    // Calculate running balance or totals if needed
    // For now, just display stored balance

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
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                    ← Back to Dashboard
                </button>
            </div>

            <div className="flex-1 p-8 overflow-auto">
                <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading Ledger...</div>
                    ) : error ? (
                        <div className="p-12 text-center text-red-500">Error: {error}</div>
                    ) : transactions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No transactions found.</div>
                    ) : (
                        <table className="w-full text-left">
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
                            <tbody className="divide-y divide-gray-100">
                                {transactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 text-xs text-gray-600 font-bold whitespace-nowrap align-top">
                                            {formatDateSafe(tx.date)}
                                            {/* Show small exchange rate below date */}
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeneralLedger;
