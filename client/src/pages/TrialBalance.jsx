import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Scale, RefreshCw, AlertCircle, ArrowLeft, PieChart, Table as TableIcon, LayoutDashboard, Brain, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, Treemap } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Trial Balance Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

        const tableRows = report.map(r => [
            r.code,
            r.description,
            r.drUSD ? r.drUSD.toLocaleString() : '-',
            r.crUSD ? r.crUSD.toLocaleString() : '-',
            r.drKHR ? r.drKHR.toLocaleString() : '-',
            r.crKHR ? r.crKHR.toLocaleString() : '-'
        ]);

        // Totals
        tableRows.push(['', 'TOTALS',
            totals.drUSD.toLocaleString(),
            totals.crUSD.toLocaleString(),
            totals.drKHR.toLocaleString(),
            totals.crKHR.toLocaleString()
        ]);

        doc.autoTable({
            head: [['Code', 'Description', 'Dr (USD)', 'Cr (USD)', 'Dr (KHR)', 'Cr (KHR)']],
            body: tableRows,
            startY: 35,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] }, // Slate-900
        });

        doc.save("trial_balance.pdf");
    };

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
                        onClick={handleDownloadPDF}
                        className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
                        title="Download PDF Report"
                    >
                        <Download className="w-5 h-5" />
                    </button>
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

                        {/* Financial Header - Clean & Readable */}
                        <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-xl border border-gray-800 font-sans">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-700">
                                <div className="px-2">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Net Profit (Est)</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-bold text-teal-400">
                                            ${(
                                                activeAccounts.filter(r => r.code.startsWith('4')).reduce((sum, r) => sum + r.crUSD, 0) -
                                                activeAccounts.filter(r => r.code.startsWith('6')).reduce((sum, r) => sum + r.drUSD, 0)
                                            ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Income - Expenses</p>
                                </div>
                                <div className="px-2">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Assets</p>
                                    <p className="text-4xl font-bold text-blue-400">
                                        ${activeAccounts.filter(r => r.code.startsWith('1')).reduce((sum, r) => sum + r.drUSD, 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">Active Debits (Class 1)</p>
                                </div>
                                <div className="px-2">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Liabilities</p>
                                    <p className="text-4xl font-bold text-rose-400">
                                        ${activeAccounts.filter(r => r.code.startsWith('2')).reduce((sum, r) => sum + r.crUSD, 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">Active Credits (Class 2)</p>
                                </div>
                                <div className="px-2">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Ledger Status</p>
                                    <div className={`mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${isBalancedUSD ? 'border-green-500/30 bg-green-900/20 text-green-400' : 'border-red-500/30 bg-red-900/20 text-red-400'}`}>
                                        <span className={`w-2.5 h-2.5 rounded-full ${isBalancedUSD ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                        <span className="font-bold text-lg">{isBalancedUSD ? 'BALANCED' : 'UNBALANCED'}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 font-mono">Diff: ${Math.abs(totals.drUSD - totals.crUSD).toFixed(5)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Debits Visualization - Bar Chart */}
                            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800 h-[500px] flex flex-col">
                                <h3 className="font-bold text-gray-300 mb-6 flex justify-between items-center text-lg">
                                    <span>Top Debits (Assets/Expenses)</span>
                                    <span className="text-xs text-blue-400 bg-blue-900/20 px-3 py-1 rounded-full border border-blue-900">Total: ${totals.drUSD.toLocaleString()}</span>
                                </h3>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            layout="vertical"
                                            data={debitData.sort((a, b) => b.size - a.size).slice(0, 10)}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <XAxis type="number" stroke="#6B7280" fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                                            <YAxis type="category" dataKey="name" width={120} stroke="#9CA3AF" fontSize={11} tick={{ fill: '#E5E7EB' }} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                                                itemStyle={{ color: '#60A5FA' }}
                                                formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                                            />
                                            <Bar dataKey="size" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Credits Visualization - Bar Chart */}
                            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800 h-[500px] flex flex-col">
                                <h3 className="font-bold text-gray-300 mb-6 flex justify-between items-center text-lg">
                                    <span>Top Credits (Liabilities/Income)</span>
                                    <span className="text-xs text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-900">Total: ${totals.crUSD.toLocaleString()}</span>
                                </h3>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            layout="vertical"
                                            data={creditData.sort((a, b) => b.size - a.size).slice(0, 10)}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <XAxis type="number" stroke="#6B7280" fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                                            <YAxis type="category" dataKey="name" width={120} stroke="#9CA3AF" fontSize={11} tick={{ fill: '#E5E7EB' }} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                                                itemStyle={{ color: '#34D399' }}
                                                formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                                            />
                                            <Bar dataKey="size" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'table' && (
                    <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in font-sans">
                        {loading && report.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">Generating Report...</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Code</th>
                                        <th className="px-6 py-4">TOI Code</th>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4 text-right bg-slate-100/50">Dr (USD)</th>
                                        <th className="px-6 py-4 text-right bg-slate-100/50">Cr (USD)</th>
                                        <th className="px-6 py-4 text-right">Dr (KHR)</th>
                                        <th className="px-6 py-4 text-right">Cr (KHR)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {report.length === 0 ? (
                                        <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">No transactions tagged yet. Go to General Ledger to start tagging.</td></tr>
                                    ) : (
                                        report.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/30 transition text-sm group">
                                                <td className="px-6 py-4 font-bold text-slate-700">{row.code}</td>
                                                <td className="px-6 py-4 text-slate-500">{row.toiCode}</td>
                                                <td className="px-6 py-4 text-slate-800 font-medium group-hover:text-blue-700">{row.description}</td>
                                                <td className={`px-6 py-4 text-right font-mono bg-slate-50/30 ${row.drUSD > 0 ? 'text-slate-900 font-semibold' : 'text-slate-300'}`}>
                                                    {row.drUSD > 0 ? row.drUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-mono bg-slate-50/30 ${row.crUSD > 0 ? 'text-slate-900 font-semibold' : 'text-slate-300'}`}>
                                                    {row.crUSD > 0 ? row.crUSD.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-slate-500">
                                                    {row.drKHR > 0 ? row.drKHR.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-slate-500">
                                                    {row.crKHR > 0 ? row.crKHR.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                                        <td colSpan="3" className="px-6 py-5 text-right text-slate-600 uppercase tracking-widest text-xs">Totals</td>
                                        <td className={`px-6 py-5 text-right text-lg ${isBalancedUSD ? 'text-emerald-700' : 'text-rose-600'}`}>
                                            {totals.drUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`px-6 py-5 text-right text-lg ${isBalancedUSD ? 'text-emerald-700' : 'text-rose-600'}`}>
                                            {totals.crUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-5 text-right text-slate-500">
                                            {totals.drKHR.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-5 text-right text-slate-500">
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
