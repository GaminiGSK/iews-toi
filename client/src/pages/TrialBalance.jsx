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
        
        const biggestExpense = debitData.sort((a,b) => b.size - a.size)[0];
        const biggestIncome = creditData.sort((a,b) => b.size - a.size)[0];

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

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-xs">
                    <p className="font-bold text-gray-800">{payload[0].payload.name}</p>
                    <p className="text-gray-500">{payload[0].payload.code}</p>
                    <p className="text-blue-600 font-bold mt-1">${(payload[0].value).toLocaleString()}</p>
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
                        
                        {/* AI Insight Card */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-6 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Brain size={120} />
                            </div>
                            <h3 className="text-indigo-900 font-bold flex items-center gap-2 mb-2">
                                <Brain size={18} /> AI Financial Summary
                            </h3>
                            <div className="text-sm text-indigo-800 leading-relaxed max-w-2xl relative z-10">
                                {generateInsight()}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Debits Visualization */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-[400px] flex flex-col">
                                <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                                    <span>Debit Composition</span>
                                    <span className="text-xs font-normal text-gray-400">Assets / Expenses</span>
                                </h3>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            data={debitData}
                                            dataKey="size"
                                            stroke="#fff"
                                            fill="#8884d8"
                                            content={<CustomizedContent colors={['#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#93C5FD']} />}
                                        >
                                            <Tooltip content={<CustomTooltip />} />
                                        </Treemap>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Credits Visualization */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-[400px] flex flex-col">
                                <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                                    <span>Credit Composition</span>
                                    <span className="text-xs font-normal text-gray-400">Liabilities / Income</span>
                                </h3>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            data={creditData}
                                            dataKey="size"
                                            stroke="#fff"
                                            fill="#82ca9d"
                                            content={<CustomizedContent colors={['#34D399', '#10B981', '#059669', '#047857', '#6EE7B7']} />}
                                        >
                                            <Tooltip content={<CustomTooltip />} />
                                        </Treemap>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Totals Summary */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
                             <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Total Debits</p>
                                <p className="text-2xl font-bold text-gray-800">${totals.drUSD.toLocaleString()}</p>
                             </div>
                             <div className="text-center">
                                <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold ${isBalancedUSD ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {isBalancedUSD ? 'BALANCED' : 'UNBALANCED'}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Difference: ${Math.abs(totals.drUSD - totals.crUSD).toFixed(2)}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase font-bold">Total Credits</p>
                                <p className="text-2xl font-bold text-gray-800">${totals.crUSD.toLocaleString()}</p>
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
