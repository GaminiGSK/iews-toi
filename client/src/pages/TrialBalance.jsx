import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Scale, RefreshCw, AlertCircle, ArrowLeft, PieChart, Table as TableIcon, LayoutDashboard, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, Treemap } from 'recharts';

const TrialBalance = ({ onBack }) => {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'table'

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
    const isBalancedKHR = Math.abs(totals.drKHR - totals.crKHR) < 1.0;

    // Prepare Visual Data
    // Filter out zero balances for cleaner charts
    const activeAccounts = report.filter(r => r.drUSD > 0 || r.crUSD > 0);

    // Group for Treemap (Assets/Liabilities vs Income/Expense logic is complex without explicit types, 
    // so we'll visualize based on Debit vs Credit prominence)
    const debitData = activeAccounts.filter(r => r.drUSD > r.crUSD).map(r => ({
        name: r.description,
        size: r.drUSD - r.crUSD,
        code: r.code
    }));

    const creditData = activeAccounts.filter(r => r.crUSD > r.drUSD).map(r => ({
        name: r.description,
        size: r.crUSD - r.drUSD,
        code: r.code
    }));

    // AI Insight Generator (Mock Logic for now, effectively "dynamic")
    const generateInsight = () => {
        if (report.length === 0) return "No data available yet.";

        const biggestExpense = debitData.sort((a, b) => b.size - a.size)[0];
        const biggestIncome = creditData.sort((a, b) => b.size - a.size)[0];

        return (
            <div className="space-y-2">
                <p>Based on your current ledger:</p>
                <ul className="list-disc pl-5 space-y-1">
                    {biggestExpense && <li>Your largest active debit account is <strong>{biggestExpense.name}</strong> (${biggestExpense.size.toLocaleString()}).</li>}
                    {biggestIncome && <li>Your largest active credit source is <strong>{biggestIncome.name}</strong> (${biggestIncome.size.toLocaleString()}).</li>}
                    <li>The trial balance is currently <strong>{isBalancedUSD ? 'BALANCED' : 'UNBALANCED'}</strong>.</li>
                </ul>
            </div>
        );
    };

    const CustomTooltip = ({ active, payload, dark }) => {
        if (active && payload && payload.length) {
            return (
                <div className={`${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} p-3 border shadow-lg rounded-lg text-xs`}>
                    <p className={`font-bold ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{payload[0].payload.name}</p>
                    <p className="text-gray-500">{payload[0].payload.code}</p>
                    <p className={`${dark ? 'text-teal-400' : 'text-blue-600'} font-bold mt-1`}>${(payload[0].value).toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-teal-800 flex items-center gap-2">
                        <Scale className="w-6 h-6" /> Trial Balance <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">AI Enhanced</span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Dynamic financial visualization.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                        <button
                            onClick={() => setViewMode('visual')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${viewMode === 'visual' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutDashboard size={14} /> Visual
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${viewMode === 'table' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <TableIcon size={14} /> Table
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-300 mx-1"></div>

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
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                )}

                {viewMode === 'visual' && !loading && (
                    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

                        {/* Bloomberg-style Financial Header */}
                        <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl border border-gray-800">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-800">
                                <div className="px-4 py-2">
                                    <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Net Profit (Est)</p>
                                    <p className="text-3xl font-mono font-bold text-teal-400 mt-2">
                                        ${(
                                            activeAccounts.filter(r => r.code.startsWith('4')).reduce((sum, r) => sum + r.crUSD, 0) -
                                            activeAccounts.filter(r => r.code.startsWith('6')).reduce((sum, r) => sum + r.drUSD, 0)
                                        ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-1">Income (4xxx) - Expense (6xxx)</p>
                                </div>
                                <div className="px-4 py-2">
                                    <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Total Assets</p>
                                    <p className="text-2xl font-mono font-bold text-blue-400 mt-2">
                                        ${activeAccounts.filter(r => r.code.startsWith('1')).reduce((sum, r) => sum + r.drUSD, 0).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-1">Class 1xxx (Debits)</p>
                                </div>
                                <div className="px-4 py-2">
                                    <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Total Liabilities</p>
                                    <p className="text-2xl font-mono font-bold text-red-400 mt-2">
                                        ${activeAccounts.filter(r => r.code.startsWith('2')).reduce((sum, r) => sum + r.crUSD, 0).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-1">Class 2xxx (Credits)</p>
                                </div>
                                <div className="px-4 py-2">
                                    <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Ledger Balance</p>
                                    <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-sm border ${isBalancedUSD ? 'border-green-500/30 bg-green-900/20 text-green-400' : 'border-red-500/30 bg-red-900/20 text-red-400'}`}>
                                        <span className={`w-2 h-2 rounded-full ${isBalancedUSD ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                        <span className="font-mono text-sm font-bold">{isBalancedUSD ? 'BALANCED' : 'UNBALANCED'}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 font-mono">Diff: ${Math.abs(totals.drUSD - totals.crUSD).toFixed(5)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Debits Visualization (Dark) */}
                            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800 h-[450px] flex flex-col">
                                <h3 className="font-bold text-gray-300 mb-4 flex justify-between items-center font-mono">
                                    <span>DEBIT COMPOSITION</span>
                                    <span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-900">Total: ${totals.drUSD.toLocaleString()}</span>
                                </h3>
                                <div className="flex-1 bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            data={debitData}
                                            dataKey="size"
                                            stroke="#111827"
                                            fill="#3B82F6"
                                            content={<CustomizedContent colors={['#3B82F6', '#2563EB', '#1D4ED8', '#60A5FA', '#93C5FD']} dark={true} />}
                                        >
                                            <Tooltip content={<CustomTooltip dark={true} />} />
                                        </Treemap>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Credits Visualization (Dark) */}
                            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800 h-[450px] flex flex-col">
                                <h3 className="font-bold text-gray-300 mb-4 flex justify-between items-center font-mono">
                                    <span>CREDIT COMPOSITION</span>
                                    <span className="text-xs text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900">Total: ${totals.crUSD.toLocaleString()}</span>
                                </h3>
                                <div className="flex-1 bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            data={creditData}
                                            dataKey="size"
                                            stroke="#111827"
                                            fill="#10B981"
                                            content={<CustomizedContent colors={['#10B981', '#059669', '#34D399', '#047857', '#6EE7B7']} dark={true} />}
                                        >
                                            <Tooltip content={<CustomTooltip dark={true} />} />
                                        </Treemap>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Top Movers Table */}
                        <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="text-gray-300 font-bold font-mono">TOP ACTIVE ACCOUNTS</h3>
                                <span className="text-xs text-gray-500 font-mono">SORTED BY MAGNITUDE</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400 font-mono">
                                    <thead className="bg-gray-800/50 text-gray-500 text-xs uppercase">
                                        <tr>
                                            <th className="px-6 py-3">Code</th>
                                            <th className="px-6 py-3">Description</th>
                                            <th className="px-6 py-3 text-right">Debit ($)</th>
                                            <th className="px-6 py-3 text-right">Credit ($)</th>
                                            <th className="px-6 py-3 text-right">Impact</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {activeAccounts
                                            .sort((a, b) => (b.drUSD + b.crUSD) - (a.drUSD + a.crUSD))
                                            .slice(0, 5)
                                            .map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-800 transition">
                                                    <td className="px-6 py-3 text-teal-500">{row.code}</td>
                                                    <td className="px-6 py-3 text-gray-300">{row.description}</td>
                                                    <td className="px-6 py-3 text-right text-gray-400">{row.drUSD ? row.drUSD.toLocaleString() : '-'}</td>
                                                    <td className="px-6 py-3 text-right text-gray-400">{row.crUSD ? row.crUSD.toLocaleString() : '-'}</td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="w-24 bg-gray-700 h-1.5 rounded-full ml-auto overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500"
                                                                style={{ width: `${Math.min(((row.drUSD + row.crUSD) / totals.drUSD) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'table' && (
                    <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                        {loading && report.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">Generating Report...</div>
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
                                                <td className="px-4 py-3 text-right text-gray-700 bg-gray-50/30 border-l border-gray-100">
                                                    {row.drUSD > 0 ? row.drUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700 bg-gray-50/30 border-l border-gray-100">
                                                    {row.crUSD > 0 ? row.crUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-teal-800 font-medium bg-teal-50/30 border-l border-gray-200">
                                                    {row.drKHR > 0 ? row.drKHR.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-teal-800 font-medium bg-teal-50/30 border-l border-gray-100">
                                                    {row.crKHR > 0 ? row.crKHR.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
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
                )}
            </div>
        </div>
    );
};

// Helper for Treemap Colors
const CustomizedContent = (props) => {
    const { root, depth, x, y, width, height, index, colors, name, value, code } = props;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: depth < 2 ? colors[Math.floor((index / root.children.length) * 6) % colors.length] : 'none',
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {depth === 1 ? (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 7}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={12}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                >
                    {width > 50 && height > 30 ? (name.length > 10 ? code : name) : ''}
                </text>
            ) : null}
            {depth === 1 ? (
                <text
                    x={x + 4}
                    y={y + 18}
                    fill="#fff"
                    fontSize={16}
                    fillOpacity={0.9}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                >
                    {/* {index + 1} */}
                </text>
            ) : null}
        </g>
    );
};

export default TrialBalance;
