import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Scale, RefreshCw, AlertCircle, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';

const TrialBalance = ({ onBack }) => {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/trial-balance', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setReport(res.data.report || []);
            setError(null);
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message;
            setError(errMsg);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.reload();
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate Totals
    const totals = report.reduce((acc, row) => ({
        drUSD: acc.drUSD + row.drUSD,
        crUSD: acc.crUSD + row.crUSD,
        drKHR: acc.drKHR + row.drKHR,
        crKHR: acc.crKHR + row.crKHR,
    }), { drUSD: 0, crUSD: 0, drKHR: 0, crKHR: 0 });

    const isBalancedUSD = Math.abs(totals.drUSD - totals.crUSD) < 0.01;
    const isBalancedKHR = Math.abs(totals.drKHR - totals.crKHR) < 1.0; // Looser tolerance for KHR rounding

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-teal-800 flex items-center gap-2">
                        <Scale className="w-6 h-6" /> Trial Balance
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Consolidated Financial Report (USD & KHR).</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchReport}
                        className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
                        title="Refresh Report"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-auto">
                <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading && report.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">Generating Report...</div>
                    ) : error ? (
                        <div className="p-12 text-center text-red-500 flex flex-col items-center gap-2">
                            <AlertCircle className="w-8 h-8" />
                            {error}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-teal-50 text-teal-800 text-xs font-bold uppercase border-b border-teal-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-4 w-[100px] border-r border-teal-100">Code</th>
                                    <th className="px-4 py-4 w-[100px] border-r border-teal-100">TOI Code</th>
                                    <th className="px-4 py-4 border-r border-teal-100">Description</th>
                                    <th className="px-4 py-4 text-center border-l border-teal-200 bg-teal-100/50" colSpan="2">USD ($)</th>
                                    <th className="px-4 py-4 text-center border-l border-teal-200 bg-teal-100" colSpan="2">KHR (៛)</th>
                                </tr>
                                <tr className="border-t border-teal-100">
                                    <th colSpan="3" className="border-r border-teal-100 bg-white"></th>
                                    <th className="px-4 py-2 text-right border-l border-teal-100 bg-teal-50">Dr</th>
                                    <th className="px-4 py-2 text-right border-l border-teal-100 bg-teal-50">Cr</th>
                                    <th className="px-4 py-2 text-right border-l border-teal-200 bg-teal-100/50">Dr</th>
                                    <th className="px-4 py-2 text-right border-l border-teal-100 bg-teal-100/50">Cr</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {report.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">No transactions tagged yet. Go to General Ledger to start tagging.</td></tr>
                                ) : (
                                    report.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition font-mono text-sm">
                                            <td className="px-4 py-3 font-bold text-teal-700 w-[100px] whitespace-nowrap border-r border-gray-100">{row.code}</td>
                                            <td className="px-4 py-3 text-gray-600 w-[100px] whitespace-nowrap border-r border-gray-100">{row.toiCode}</td>
                                            <td className="px-4 py-3 text-gray-800 font-sans border-r border-gray-100">{row.description}</td>

                                            {/* USD */}
                                            <td className="px-4 py-3 text-right text-gray-700 bg-gray-50/30 border-l border-gray-100">
                                                {row.drUSD > 0 ? row.drUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700 bg-gray-50/30 border-l border-gray-100">
                                                {row.crUSD > 0 ? row.crUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                            </td>

                                            {/* KHR */}
                                            <td className="px-4 py-3 text-right text-teal-800 font-medium bg-teal-50/30 border-l border-gray-200">
                                                {row.drKHR > 0 ? row.drKHR.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-teal-800 font-medium bg-teal-50/30 border-l border-gray-100">
                                                {row.crKHR > 0 ? row.crKHR.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {/* TOTALS ROW */}
                                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                    <td colSpan="3" className="px-4 py-4 text-right text-gray-600 uppercase tracking-wide">Totals</td>

                                    <td className={`px-4 py-4 text-right ${isBalancedUSD ? 'text-green-700' : 'text-red-600'} border-l border-gray-300`}>
                                        {totals.drUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`px-4 py-4 text-right ${isBalancedUSD ? 'text-green-700' : 'text-red-600'} border-l border-gray-300`}>
                                        {totals.crUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>

                                    <td className={`px-4 py-4 text-right ${isBalancedKHR ? 'text-green-700' : 'text-red-600'} border-l border-gray-300 bg-teal-100/50`}>
                                        {totals.drKHR.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className={`px-4 py-4 text-right ${isBalancedKHR ? 'text-green-700' : 'text-red-600'} border-l border-gray-300 bg-teal-100/50`}>
                                        {totals.crKHR.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrialBalance;
