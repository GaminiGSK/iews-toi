import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wand2, Calendar, Tag, Layers, ArrowLeft, Sparkles } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';

const GeneralLedger = ({ onBack }) => {
    const [transactions, setTransactions] = useState([]);
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tagging, setTagging] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('date'); // 'date' | 'code'
    const [filterCode, setFilterCode] = useState('');
    const [fiscalYear, setFiscalYear] = useState('all');
    const [bulkTargetCode, setBulkTargetCode] = useState('');

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



    // Unassign all ABA (10130) transactions (Undo/Reset)
    const handleUnassignABA = async () => {
        const abaCode = codes.find(c => c.code === '10130' || (c.description && String(c.description).toUpperCase().includes('ABA')));
        if (!abaCode) return;

        const candidates = transactions.filter(t => t.accountCode === abaCode._id);

        if (candidates.length === 0) {
            alert('No ABA transactions found to reset.');
            return;
        }

        if (!window.confirm(`RESET: Unassign ${candidates.length} ABA transactions?\n\nThey will revert to 'Uncategorized'.`)) return;

        try {
            setTagging(true);
            const token = localStorage.getItem('token');
            const promises = candidates.map(t =>
                axios.post('/api/company/transactions/tag', {
                    transactionId: t._id,
                    accountCodeId: null // Clear tag
                }, { headers: { 'Authorization': `Bearer ${token}` } })
            );

            await Promise.all(promises);
            alert('ABA transactions reset to Uncategorized.');
            fetchLedger();
        } catch (err) {
            console.error(err);
            alert('Reset failed.');
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
            fetchLedger(); // Refresh to see changes
        } catch (err) {
            console.error(err);
            alert('Auto-Tag failed. Check console.');
        } finally {
            setTagging(false);
        }
    };

    // New format demands chronological sorting. Pre-flight sorting to ensure correct running balance:
    const finalSortedTransactions = [...transactions].sort((a,b) => new Date(a.date) - new Date(b.date));

    // Filter transactions (Keep year filtering logic just in case user needs to limit scope)
    const filteredTransactions = finalSortedTransactions.filter(t => {
        if (filterCode && filterCode !== 'uncategorized' && t.accountCode !== filterCode) return false;
        if (filterCode === 'uncategorized' && t.accountCode && t.accountCode !== 'uncategorized') return false;
        if (fiscalYear !== 'all') {
            const y = t.date ? new Date(t.date).getFullYear() : null;
            if (y && y.toString() !== fiscalYear) return false;
        }
        return true;
    });

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900 border-x border-slate-300 max-w-[1700px] mx-auto shadow-2xl overflow-hidden">
                {/* Header - Left Aligned */}
                <div className="bg-white border-b-4 border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20 overflow-x-auto shadow-md">
                    <div className="flex items-center gap-4 shrink-0">
                        <button
                            onClick={onBack}
                            className="p-2 bg-slate-700 hover:bg-slate-800 text-white rounded-full text-sm font-medium transition shrink-0 shadow-sm"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest">
                                Master Ledger
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Formal Audit View • {transactions.length} Records</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                        
                        {/* THE NEW CURRENCY TOGGLE */}
                        <div className="flex bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden text-xs font-bold mr-2">
                           <button 
                                onClick={() => setCurrencyMode('KHR')}
                                className={`px-4 py-1.5 transition ${currencyMode === 'KHR' ? 'bg-[#2a4e7e] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                           >
                               KHR View
                           </button>
                           <button 
                                onClick={() => setCurrencyMode('USD')}
                                className={`px-4 py-1.5 transition ${currencyMode === 'USD' ? 'bg-[#2a4e7e] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                           >
                               USD View
                           </button>
                        </div>

                        {/* Year Dropdown */}
                        <div className="relative">
                            <select
                                value={fiscalYear}
                                onChange={(e) => setFiscalYear(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-md h-8 pl-3 pr-8 focus:ring-2 focus:ring-[#2a4e7e] outline-none shadow-sm cursor-pointer"
                            >
                                <option value="2025">Yr: 2025</option>
                                <option value="2024">Yr: 2024</option>
                                <option value="all">All Yrs</option>
                            </select>
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <select
                                value={filterCode}
                                onChange={(e) => setFilterCode(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-md h-8 pl-3 pr-8 focus:ring-2 focus:ring-[#2a4e7e] outline-none shadow-sm cursor-pointer max-w-[200px]"
                            >
                                <option value="">All Transactions</option>
                                <option value="uncategorized">Uncategorized Only</option>
                                <hr />
                                {codes.map(c => {
                                    const descStr = typeof c.description === 'object' ? JSON.stringify(c.description) : String(c.description || '');
                                    return (
                                        <option key={c._id} value={c._id}>
                                            {c.code} - {descStr ? descStr.substring(0, 30) : 'No Description'}...
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-auto bg-[#f8fbff]">
                    <div className="max-w-[1600px] mx-auto">
                        {loading ? (
                            <div className="bg-white p-12 text-center text-slate-500 rounded border border-slate-300 shadow-sm animate-pulse font-mono tracking-widest uppercase">Loading Ledger Matrix...</div>
                        ) : error ? (
                            <div className="bg-white p-12 text-center text-red-500 rounded border border-red-300 font-bold">CRITICAL DATABASE ERROR: {error}</div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="bg-white p-12 text-center text-slate-500 rounded border border-slate-300 shadow-sm">No transactions found for this selection.</div>
                        ) : (
                            <div className="shadow-lg bg-white overflow-hidden" style={{fontFamily: 'Helvetica, Arial, sans-serif'}}>
                                {/* IMPORT THE TWO NEW COMPONENTS HERE */}
                                <GlHeader codes={codes} />
                                <div className="overflow-x-auto">
                                    <GlTable transactions={filteredTransactions} codes={codes} currencyMode={currencyMode} />
                                </div>
                            </div>
                        )}
                    </div>
                    </div>
            </div>
        </ErrorBoundary>
    );
};

export default GeneralLedger;
