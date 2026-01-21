import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GeneralLedger = ({ onBack }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLedger();
    }, []);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/ledger', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTransactions(res.data.transactions || []);
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
                                    <th className="px-6 py-4 w-[120px]">Date</th>
                                    <th className="px-6 py-4 w-[500px]">Description</th>
                                    <th className="px-6 py-4 text-right">Money In</th>
                                    <th className="px-6 py-4 text-right">Money Out</th>
                                    <th className="px-6 py-4 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 text-sm text-gray-600 font-bold whitespace-nowrap align-top">
                                            {formatDateSafe(tx.date)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 font-medium align-top leading-relaxed whitespace-pre-wrap">
                                            {tx.description}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-green-600 align-top whitespace-nowrap">
                                            {tx.amount > 0 ? tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-red-600 align-top whitespace-nowrap">
                                            {tx.amount < 0 ? Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-900 font-bold align-top whitespace-nowrap">
                                            {tx.balance ? tx.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
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
