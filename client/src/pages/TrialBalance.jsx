import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Scale, RefreshCw, AlertCircle, ArrowLeft, PieChart as PieChartIcon, Table as TableIcon, LayoutDashboard, Brain, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, Treemap, PieChart, Pie } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TrialBalance = ({ onBack }) => {
    const [report, setReport] = useState([]);
    const [fiscalYear, setFiscalYear] = useState('all'); // Explicitly start with 'all' to prevent zero-data 0 rendering
    const [availableYears, setAvailableYears] = useState([]);
    const [totals, setTotals] = useState({ drUSD: 0, crUSD: 0, drKHR: 0, crKHR: 0 });
    const [currency, setCurrency] = useState('KHR'); // Toggle for main visual currency display
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'table'
    const [reportFormat, setReportFormat] = useState('comparative'); // 'comparative' | 'accounting_cycle' | 'inventory_heavy'
    const [inThousands, setInThousands] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [fiscalYear]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/company/trial-balance?fiscalYear=${fiscalYear}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setReport(res.data.report || []);
            setTotals(res.data.totals || { drUSD: 0, crUSD: 0, drKHR: 0, crKHR: 0 });
            // Set Year if available
            if (res.data.currentYear) setFiscalYear(res.data.currentYear.toString());
            if (res.data.availableYears) setAvailableYears(res.data.availableYears);
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
    const activeAccounts = report.filter(r => currency === 'USD' ? (r.drUSD > 0 || r.crUSD > 0) : (r.drKHR > 0 || r.crKHR > 0));

    // Accounting Principles Mapping (Assets = Liabilities + Equity)
    // Assets: Normal balance is Debit (Dr - Cr)
    const assetData = report.filter(r => r.code.startsWith('1')).map(r => ({
        name: r.description,
        size: currency === 'USD' ? (r.drUSD - r.crUSD) : (r.drKHR - r.crKHR),
        code: r.code
    })).filter(a => a.size !== 0);

    const totalAssets = assetData.reduce((sum, item) => sum + item.size, 0);

    // Liabilities: Normal balance is Credit (Cr - Dr)
    const liabilityData = report.filter(r => r.code.startsWith('2')).map(r => ({
        name: r.description,
        size: currency === 'USD' ? (r.crUSD - r.drUSD) : (r.crKHR - r.drKHR),
        code: r.code
    })).filter(a => a.size !== 0);

    const totalLiabilities = liabilityData.reduce((sum, item) => sum + item.size, 0);

    // Calculate Net Profit for Equity
    // Income (Cr - Dr) - Expenses (Dr - Cr)
    const totalIncome = report.filter(r => ['4', '7', '8', '9'].some(p => r.code.startsWith(p))).reduce((sum, r) => sum + (currency === 'USD' ? (r.crUSD - r.drUSD) : (r.crKHR - r.drKHR)), 0);
    const totalExpense = report.filter(r => ['5', '6'].some(p => r.code.startsWith(p))).reduce((sum, r) => sum + (currency === 'USD' ? (r.drUSD - r.crUSD) : (r.drKHR - r.crKHR)), 0);
    const netProfit = totalIncome - totalExpense;

    // Base Equity: Normal balance is Credit (Cr - Dr)
    const baseEquityData = report.filter(r => r.code.startsWith('3')).map(r => ({
        name: r.description,
        size: currency === 'USD' ? (r.crUSD - r.drUSD) : (r.crKHR - r.drKHR),
        code: r.code
    })).filter(a => a.size !== 0);

    // Append Net Profit to Equity Data for accurate representation of the Accounting Equation
    const equityData = [
        ...baseEquityData,
        ...(netProfit !== 0 ? [{
            name: 'Current Year Retained Earnings (Net Profit)',
            size: netProfit, // Allow negative size for a loss
            code: 'N/A'
        }] : [])
    ];

    const totalEquity = equityData.reduce((sum, item) => sum + item.size, 0);
    const isEquationBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < (currency === 'USD' ? 0.01 : 1.0);
    const isAccountingBalanced = isEquationBalanced;
    // Fallbacks for the insight generator
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

        const biggestAsset = assetData.sort((a, b) => b.size - a.size)[0];
        const biggestLiability = liabilityData.sort((a, b) => b.size - a.size)[0];

        return (
            <div className="space-y-2">
                <p>Based on your current ledger:</p>
                <ul className="list-disc pl-5 space-y-1">
                    {biggestAsset && <li>Your largest active asset is <strong>{biggestAsset.name}</strong> (${biggestAsset.size.toLocaleString()}).</li>}
                    {biggestLiability && <li>Your largest active liability is <strong>{biggestLiability.name}</strong> (${biggestLiability.size.toLocaleString()}).</li>}
                    <li>The trial balance is currently <strong>{isBalancedUSD ? 'BALANCED' : 'UNBALANCED'}</strong>.</li>
                </ul>
            </div>
        );
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'];

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
            {/* Header - Left Aligned */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-8 sticky top-0 z-20 shadow-sm overflow-x-auto">
                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={onBack}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition shadow-md"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-teal-800 flex items-center gap-2">
                            <Scale className="w-6 h-6" /> Trial Balance <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">AI Enhanced</span>
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">Dynamic financial visualization.</p>
                    </div>
                </div>

                <div className="h-10 w-px bg-gray-200 shrink-0"></div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-gray-100 p-1 rounded-lg flex gap-1 border border-gray-200">
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

                    {viewMode === 'table' && (
                        <div className="relative mr-2">
                            <select
                                value={reportFormat}
                                onChange={(e) => setReportFormat(e.target.value)}
                                className="appearance-none bg-indigo-50 border border-indigo-200 text-indigo-800 py-1.5 pl-3 pr-8 rounded-md text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                            >
                                <option value="comparative">1. Comparative Format</option>
                                <option value="accounting_cycle">2. Accounting Cycle Format</option>
                                <option value="inventory_heavy">3. Inventory/Manufacturing</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="appearance-none bg-blue-50 border border-blue-200 text-blue-800 py-1.5 pl-3 pr-8 rounded-md text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                        >
                            <option value="KHR">KHR Mode</option>
                            <option value="USD">USD Mode</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={fiscalYear}
                            onChange={(e) => setFiscalYear(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 text-gray-700 py-1.5 pl-3 pr-8 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer shadow-sm"
                            disabled={loading}
                        >
                            <option value="all">All Years (Total)</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>

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
                </div>
            </div>

            <div className="flex-1 p-8 overflow-auto">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                )}

                {viewMode === 'visual' && !loading && (
                    <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-12">

                        {/* Financial Header - Futuristic Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Assets Card */}
                            <div className="bg-[#0b1324] border border-blue-500/20 rounded-[20px] p-6 relative overflow-hidden group hover:border-blue-500/60 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-500">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all duration-700"></div>
                                <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,1)]"></div>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Total Assets</p>
                                        <p className="text-xs text-slate-500">System Liquidity</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border border-blue-500/30 bg-blue-500/10 flex items-center justify-center shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)]"></div>
                                    </div>
                                </div>
                                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-300 to-blue-600 tracking-tight font-mono">
                                    {currency} {totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>

                            {/* Liabilities Card */}
                            <div className="bg-[#0b1324] border border-rose-500/20 rounded-[20px] p-6 relative overflow-hidden group hover:border-rose-500/60 hover:shadow-[0_0_30px_rgba(244,63,94,0.15)] transition-all duration-500">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[40px] -mr-10 -mt-10 group-hover:bg-rose-500/20 transition-all duration-700"></div>
                                <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent via-rose-500 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_15px_rgba(244,63,94,1)]"></div>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-1">Total Liabilities</p>
                                        <p className="text-xs text-slate-500">System Debt</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border border-rose-500/30 bg-rose-500/10 flex items-center justify-center shadow-[inset_0_0_10px_rgba(244,63,94,0.2)]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,1)]"></div>
                                    </div>
                                </div>
                                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-rose-300 to-rose-600 tracking-tight font-mono">
                                    {currency} {totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>

                            {/* Equity Card */}
                            <div className={`bg-[#0b1324] border ${totalEquity >= 0 ? 'border-emerald-500/20 hover:border-emerald-500/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'border-red-500/20 hover:border-red-500/60 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]'} rounded-[20px] p-6 relative overflow-hidden group transition-all duration-500`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] -mr-10 -mt-10 transition-all duration-700 ${totalEquity >= 0 ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`}></div>
                                <div className={`absolute left-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ${totalEquity >= 0 ? 'via-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]' : 'via-red-500 shadow-[0_0_15px_rgba(239,68,68,1)]'}`}></div>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${totalEquity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Total Equity</p>
                                        <p className="text-xs text-slate-500">Net Worth</p>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${totalEquity >= 0 ? 'border-emerald-500/30 bg-emerald-500/10 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]' : 'border-red-500/30 bg-red-500/10 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${totalEquity >= 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,1)]' : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,1)]'}`}></div>
                                    </div>
                                </div>
                                <p className={`text-3xl font-black text-transparent bg-clip-text tracking-tight font-mono ${totalEquity >= 0 ? 'bg-gradient-to-br from-emerald-300 to-emerald-600' : 'bg-gradient-to-br from-red-300 to-red-600'}`}>
                                    {currency} {totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>

                            {/* Ledger Status */}
                            <div className="bg-[#0b1324] border border-white/5 rounded-[20px] p-6 relative overflow-hidden group hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-500 flex flex-col justify-between">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-all duration-700"></div>
                                <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,1)]"></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Ledger Status</p>
                                    <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">EQ DIFF: {Math.abs(totalAssets - (totalLiabilities + totalEquity)).toFixed(5)}</p>
                                </div>
                                
                                <div className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border relative overflow-hidden ${isAccountingBalanced ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400' : 'border-red-500/30 bg-red-950/30 text-red-500'}`}>
                                    {isAccountingBalanced && <div className="absolute inset-0 bg-emerald-500/5 pulse-glow"></div>}
                                    <div className={`w-2 h-2 rounded-full relative z-10 ${isAccountingBalanced ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-ping' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]'}`}></div>
                                    <span className="font-bold text-xs uppercase tracking-[0.15em] relative z-10">{isAccountingBalanced ? 'Fully Reconciled' : 'Unbalanced'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Assets Chart */}
                            <div className="bg-[#050b14] border border-blue-900/40 p-6 rounded-[24px] shadow-2xl relative overflow-hidden flex flex-col h-[500px] group hover:border-blue-700/50 transition-colors duration-500">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <h3 className="font-bold text-slate-200 text-sm tracking-widest uppercase">Asset Liquidity</h3>
                                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                        TOT: {currency} {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex-1 relative z-10 filter drop-shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                    {assetData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={assetData.map(a => ({ name: a.name, value: Math.abs(a.size), actualSize: a.size }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={130}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    stroke="none"
                                                    cornerRadius={6}
                                                >
                                                    {assetData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.size < 0 ? '#EF4444' : COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#F8FAFC', borderRadius: '12px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
                                                    itemStyle={{ color: '#60A5FA', fontWeight: 'bold', fontSize: '13px' }}
                                                    formatter={(value, name, props) => {
                                                        const actualSize = props.payload.actualSize;
                                                        return [`${currency} ${actualSize.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Balance'];
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-slate-600 font-mono text-xs tracking-widest uppercase">
                                            No Data Available
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Liabilities Chart */}
                            <div className="bg-[#050b14] border border-rose-900/30 p-6 rounded-[24px] shadow-2xl relative overflow-hidden flex flex-col h-[500px] group hover:border-rose-700/50 transition-colors duration-500">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>
                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <h3 className="font-bold text-slate-200 text-sm tracking-widest uppercase">Liability Struct</h3>
                                    <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                                        TOT: {currency} {totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex-1 relative z-10">
                                    {liabilityData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                layout="vertical"
                                                data={liabilityData.sort((a, b) => b.size - a.size).slice(0, 10)}
                                                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                            >
                                                <defs>
                                                    <linearGradient id="roseGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#BE123C" />
                                                        <stop offset="100%" stopColor="#FB7185" />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis type="number" stroke="#334155" fontSize={10} tickFormatter={(val) => `${val / 1000}k`} tickLine={false} axisLine={false} />
                                                <YAxis type="category" dataKey="name" width={110} stroke="#64748b" fontSize={10} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#F8FAFC', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#FB7185', fontWeight: 'bold' }}
                                                    formatter={(value) => [`${currency} ${value.toLocaleString()}`, 'Amount']}
                                                />
                                                <Bar dataKey="size" fill="url(#roseGradient)" radius={[0, 6, 6, 0]} barSize={16}>
                                                    {liabilityData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-slate-600 font-mono text-xs tracking-widest uppercase">
                                            No Active Liabilities
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Equity Chart */}
                            <div className="bg-[#050b14] border border-emerald-900/30 p-6 rounded-[24px] shadow-2xl relative overflow-hidden flex flex-col h-[500px] group hover:border-emerald-700/50 transition-colors duration-500">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <h3 className="font-bold text-slate-200 text-sm tracking-widest uppercase">Equity Struct</h3>
                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                        TOT: {currency} {totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex-1 relative z-10">
                                    {equityData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                layout="vertical"
                                                data={equityData.sort((a, b) => b.size - a.size).slice(0, 10)}
                                                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                            >
                                                <defs>
                                                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#047857" />
                                                        <stop offset="100%" stopColor="#34D399" />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis type="number" stroke="#334155" fontSize={10} tickFormatter={(val) => `${val / 1000}k`} tickLine={false} axisLine={false} />
                                                <YAxis type="category" dataKey="name" width={110} stroke="#64748b" fontSize={10} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#F8FAFC', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#34D399', fontWeight: 'bold' }}
                                                    formatter={(value) => [`${currency} ${value.toLocaleString()}`, 'Amount']}
                                                />
                                                <Bar dataKey="size" fill="url(#emeraldGradient)" radius={[0, 6, 6, 0]} barSize={16}>
                                                    {equityData.sort((a, b) => b.size - a.size).slice(0, 10).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.size >= 0 ? 'url(#emeraldGradient)' : '#EF4444'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-slate-600 font-mono text-xs tracking-widest uppercase">
                                            No Equity Data
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'table' && (
                    <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg border border-gray-300 overflow-hidden text-sm font-serif animate-fade-in">

                        {/* Audit Toolbar */}
                        <div className="bg-gray-100 p-2 flex justify-end items-center border-b border-gray-300 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={inThousands}
                                    onChange={(e) => setInThousands(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                                <span className="text-gray-700 font-sans text-xs font-semibold">Show in KHR'000 (Tax Mode)</span>
                            </label>
                        </div>

                        {loading && report.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 font-sans">Generating Audit Report...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse min-w-[900px]">
                                    {/* --- 1. COMPARATIVE FORMAT --- */}
                                    {reportFormat === 'comparative' && (
                                        <>
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-gray-300">
                                                    <th className="border-r border-gray-300 p-2 text-center w-20 text-xs text-gray-500 uppercase">Code</th>
                                                    <th className="border-r border-gray-300 p-2 text-center w-24 text-xs text-gray-500 uppercase">TOI Code</th>
                                                    <th className="border-r border-gray-300 p-2 text-left"></th>
                                                    <th className="border-r border-gray-300 p-2 text-center w-16 text-xs text-gray-500 uppercase">Note</th>
                                                    <th colSpan="2" className="border-r border-gray-300 p-2 text-center font-bold text-gray-900 bg-[#E2E8F0]/40">
                                                        For the year ended<br /><span className="text-xs font-normal">31-Dec-{fiscalYear}</span><br />
                                                        <span className="text-xs uppercase text-gray-500">{inThousands ? "KHR'000" : currency}</span>
                                                    </th>
                                                    <th colSpan="2" className="border-r border-gray-300 p-2 text-center font-bold text-gray-500 bg-gray-50">
                                                        For the year ended<br /><span className="text-xs font-normal">31-Dec-{fiscalYear - 1}</span><br />
                                                        <span className="text-xs uppercase text-gray-400">{inThousands ? "KHR'000" : currency}</span>
                                                    </th>
                                                    <th className="p-2 text-center w-16 text-xs text-gray-500 uppercase">Ref</th>
                                                </tr>
                                                <tr className="bg-[#1e293b] text-xs font-bold text-gray-300 border-b border-gray-400">
                                                    <th className="border-r border-gray-600 p-2 text-center"></th>
                                                    <th className="border-r border-gray-600 p-2 text-center"></th>
                                                    <th className="border-r border-gray-600 p-2 text-left pl-4 uppercase">Description</th>
                                                    <th className="border-r border-gray-600 p-2"></th>
                                                    <th className="border-r border-gray-600 p-2 text-right w-32 bg-[#334155]">Dr</th>
                                                    <th className="border-r border-gray-600 p-2 text-right w-32 bg-[#334155]">Cr</th>
                                                    <th className="border-r border-gray-600 p-2 text-right w-32 bg-[#1e293b]">Dr</th>
                                                    <th className="border-r border-gray-600 p-2 text-right w-32 bg-[#1e293b]">Cr</th>
                                                    <th className="p-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(prefix => {
                                                    const groupName = {
                                                        '1': 'ASSETS', '2': 'LIABILITIES', '3': 'EQUITY',
                                                        '4': 'INCOME', '5': 'COST OF SALES', '6': 'EXPENSES',
                                                        '7': 'OTHER INCOME', '8': 'OTHER EXPENSES', '9': 'NON-OPERATING'
                                                    }[prefix] || 'OTHER';

                                                    const groupRows = report.filter(r => r.code.startsWith(prefix)).sort((a, b) => a.code.localeCompare(b.code));
                                                    if (groupRows.length === 0) return null;

                                                    return (
                                                        <React.Fragment key={prefix}>
                                                            <tr className="bg-[#475569] border-t border-b border-gray-400">
                                                                <td colSpan="9" className="p-2 px-4 uppercase tracking-widest text-xs font-bold text-white">
                                                                    {groupName}
                                                                </td>
                                                            </tr>
                                                            {groupRows.map(row => {
                                                                const scale = inThousands ? 1000 : 1;
                                                                const dr = (currency === 'USD' ? row.drUSD : row.drKHR) ? (currency === 'USD' ? row.drUSD : row.drKHR) / scale : 0;
                                                                const cr = (currency === 'USD' ? row.crUSD : row.crKHR) ? (currency === 'USD' ? row.crUSD : row.crKHR) / scale : 0;
                                                                const pDr = (currency === 'USD' ? row.priorDrUSD : row.priorDrKHR) ? (currency === 'USD' ? row.priorDrUSD : row.priorDrKHR) / scale : 0;
                                                                const pCr = (currency === 'USD' ? row.priorCrUSD : row.priorCrKHR) ? (currency === 'USD' ? row.priorCrUSD : row.priorCrKHR) / scale : 0;

                                                                if (dr === 0 && cr === 0 && pDr === 0 && pCr === 0) return null;

                                                                return (
                                                                    <tr key={row.code} className="hover:bg-blue-50/50 transition border-b border-gray-200 text-sm bg-white group">
                                                                        <td className="border-r border-gray-300 p-2 text-center text-xs font-mono text-gray-500">{row.code}</td>
                                                                        <td className="border-r border-gray-300 p-2 text-center text-xs font-mono text-gray-400">{row.toiCode}</td>
                                                                        <td className="border-r border-gray-300 p-2 pl-4 text-gray-800 font-medium">{row.description}</td>
                                                                        <td className="border-r border-gray-300 p-2 text-center text-xs text-blue-600 font-bold">{row.note}</td>
                                                                        <td className="border-r border-gray-300 p-2 text-right font-mono text-gray-900 bg-slate-50">{dr > 0 ? dr.toLocaleString(undefined, { maximumFractionDigits: currency === 'USD' ? 2 : 0 }) : '-'}</td>
                                                                        <td className="border-r border-gray-300 p-2 text-right font-mono text-gray-900 bg-slate-50">{cr > 0 ? cr.toLocaleString(undefined, { maximumFractionDigits: currency === 'USD' ? 2 : 0 }) : '-'}</td>
                                                                        <td className="border-r border-gray-300 p-2 text-right font-mono text-gray-500 bg-white">{pDr > 0 ? pDr.toLocaleString(undefined, { maximumFractionDigits: currency === 'USD' ? 2 : 0 }) : '-'}</td>
                                                                        <td className="border-r border-gray-300 p-2 text-right font-mono text-gray-500 bg-white">{pCr > 0 ? pCr.toLocaleString(undefined, { maximumFractionDigits: currency === 'USD' ? 2 : 0 }) : '-'}</td>
                                                                        <td className="p-2 text-center text-xs text-gray-400">{row.note}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })}
                                                <tr className="bg-[#1e293b] font-bold border-t-2 border-gray-400 text-white">
                                                    <td className="border-r border-gray-600"></td>
                                                    <td className="border-r border-gray-600"></td>
                                                    <td className="border-r border-gray-600 p-3 text-right uppercase text-xs text-gray-300">Total</td>
                                                    <td className="border-r border-gray-600"></td>
                                                    <td className="border-r border-gray-600 p-3 text-right text-teal-400 bg-[#334155]">{((currency === 'USD' ? totals.drUSD : totals.drKHR) / (inThousands ? 1000 : 1)).toLocaleString(undefined, { maximumFractionDigits: currency === 'USD' ? 2 : 0 })}</td>
                                                    <td className="border-r border-gray-600 p-3 text-right text-teal-400 bg-[#334155]">{((currency === 'USD' ? totals.crUSD : totals.crKHR) / (inThousands ? 1000 : 1)).toLocaleString(undefined, { maximumFractionDigits: currency === 'USD' ? 2 : 0 })}</td>
                                                    <td className="border-r border-gray-600 p-3 text-right text-gray-300">{((currency === 'USD' ? totals.priorDrUSD : totals.priorDrKHR) ? ((currency === 'USD' ? totals.priorDrUSD : totals.priorDrKHR) / (inThousands ? 1000 : 1)) : 0).toLocaleString(undefined, { maximumFractionDigits: currency === 'USD' ? 2 : 0 })}</td>
                                                    <td className="border-r border-gray-600 p-3 text-right text-gray-300">{((currency === 'USD' ? totals.priorCrUSD : totals.priorCrKHR) ? ((currency === 'USD' ? totals.priorCrUSD : totals.priorCrKHR) / (inThousands ? 1000 : 1)) : 0).toLocaleString(undefined, { maximumFractionDigits: currency === 'USD' ? 2 : 0 })}</td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </>
                                    )}

                                    {/* --- 2. ACCOUNTING CYCLE FORMAT (Auditor's View) --- */}
                                    {reportFormat === 'accounting_cycle' && (
                                        <>
                                            <thead>
                                                <tr className="bg-slate-100 border-b border-gray-300">
                                                    <th className="border-r border-gray-300 p-2 text-center w-20 text-xs text-gray-500 uppercase">Code</th>
                                                    <th className="border-r border-gray-300 p-2 text-center w-24 text-xs text-gray-500 uppercase">TOI Code</th>
                                                    <th className="border-r border-gray-300 p-2 text-left"></th>
                                                    <th className="border-r border-gray-300 p-2 text-center w-16 text-xs text-gray-500 uppercase">Note</th>

                                                    <th colSpan="2" className="border-r border-gray-300 p-2 text-center font-bold text-gray-600 bg-slate-200 uppercase text-xs">
                                                        Unadjusted ({fiscalYear})
                                                    </th>
                                                    <th colSpan="2" className="border-r border-gray-300 p-2 text-center font-bold text-gray-800 bg-white uppercase text-xs" style={{ borderTop: '4px solid #3B82F6' }}>
                                                        Adjustments ({fiscalYear})
                                                    </th>
                                                    <th colSpan="2" className="border-r border-gray-300 p-2 text-center font-bold text-gray-600 bg-slate-200 uppercase text-xs">
                                                        Adjusted ({fiscalYear})
                                                    </th>

                                                    <th className="p-2 text-center w-16 text-xs text-gray-500 uppercase">Ref</th>
                                                </tr>
                                                <tr className="bg-slate-300 text-xs font-bold text-gray-700 border-b border-gray-400">
                                                    <th className="border-r border-gray-400 p-2 text-center"></th>
                                                    <th className="border-r border-gray-400 p-2 text-center"></th>
                                                    <th className="border-r border-gray-400 p-2 text-left pl-4 uppercase">Description</th>
                                                    <th className="border-r border-gray-400 p-2"></th>

                                                    <th className="border-r border-gray-400 p-2 text-right w-28 bg-slate-200">Dr (KHR)</th>
                                                    <th className="border-r border-gray-400 p-2 text-right w-28 bg-slate-200">Cr (KHR)</th>

                                                    <th className="border-r border-gray-400 p-2 text-right w-28 bg-white border-l-2 border-l-blue-500">Dr (KHR)</th>
                                                    <th className="border-r border-gray-400 p-2 text-right w-28 bg-white">Cr (KHR)</th>

                                                    <th className="border-r border-gray-400 p-2 text-right w-28 bg-slate-200 border-l-2 border-l-gray-400">Dr (KHR)</th>
                                                    <th className="border-r border-gray-400 p-2 text-right w-28 bg-slate-200">Cr (KHR)</th>

                                                    <th className="p-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(prefix => {
                                                    const groupName = {
                                                        '1': 'ASSETS', '2': 'LIABILITIES', '3': 'EQUITY',
                                                        '4': 'INCOME', '5': 'COST OF SALES', '6': 'EXPENSES',
                                                        '7': 'OTHER INCOME', '8': 'OTHER EXPENSES', '9': 'NON-OPERATING'
                                                    }[prefix] || 'OTHER';

                                                    const groupRows = report.filter(r => r.code.startsWith(prefix)).sort((a, b) => a.code.localeCompare(b.code));
                                                    if (groupRows.length === 0) return null;

                                                    return (
                                                        <React.Fragment key={prefix}>
                                                            <tr className="bg-gray-200 border-t border-b border-gray-300">
                                                                <td colSpan="11" className="p-2 px-4 uppercase tracking-widest text-xs font-bold text-gray-800">
                                                                    {groupName}
                                                                </td>
                                                            </tr>
                                                            {groupRows.map(row => {
                                                                const scale = inThousands ? 1000 : 1;
                                                                const unAdDr = (row.unadjDrKHR || 0) / scale;
                                                                const unAdCr = (row.unadjCrKHR || 0) / scale;
                                                                const adDr = (row.adjDrKHR || 0) / scale;
                                                                const adCr = (row.adjCrKHR || 0) / scale;
                                                                const dr = row.drKHR ? row.drKHR / scale : 0;
                                                                const cr = row.crKHR ? row.crKHR / scale : 0;

                                                                if (dr === 0 && cr === 0 && unAdDr === 0 && unAdCr === 0) return null;

                                                                return (
                                                                    <tr key={row.code} className="hover:bg-blue-50 transition border-b border-gray-200 text-sm group">
                                                                        <td className="border-r border-gray-300 p-2 text-center text-xs font-mono text-gray-600">{row.code}</td>
                                                                        <td className="border-r border-gray-300 p-2 text-center text-xs font-mono text-gray-500">{row.toiCode}</td>
                                                                        <td className="border-r border-gray-300 p-2 pl-4 text-gray-800 font-medium">{row.description}</td>
                                                                        <td className="border-r border-gray-300 p-2 text-center text-xs text-blue-600 font-bold">{row.note}</td>

                                                                        {/* Unadjusted */}
                                                                        <td className="border-r border-gray-300 p-2 text-right font-mono text-gray-500 bg-slate-100">{unAdDr > 0 ? unAdDr.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>
                                                                        <td className="border-r border-gray-300 p-2 text-right font-mono text-gray-500 bg-slate-100">{unAdCr > 0 ? unAdCr.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>

                                                                        {/* Adjustments */}
                                                                        <td className="border-r border-gray-300 p-2 text-right font-mono text-blue-700 bg-white border-l-2 border-l-blue-200">{adDr > 0 ? adDr.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>
                                                                        <td className="border-r border-gray-300 p-2 text-right font-mono text-blue-700 bg-white">{adCr > 0 ? adCr.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>

                                                                        {/* Adjusted */}
                                                                        <td className="border-r border-gray-300 p-2 text-right font-mono text-gray-900 bg-slate-200 font-bold border-l-2 border-l-gray-300">{dr > 0 ? dr.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>
                                                                        <td className="border-r border-gray-300 p-2 text-right font-mono text-gray-900 bg-slate-200 font-bold">{cr > 0 ? cr.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>

                                                                        <td className="p-2 text-center text-xs text-gray-400"></td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })}
                                                <tr className="bg-slate-300 font-bold border-t-2 border-gray-400">
                                                    <td className="border-r border-gray-400"></td>
                                                    <td className="border-r border-gray-400"></td>
                                                    <td className="border-r border-gray-400 p-3 text-right uppercase text-xs">Total</td>
                                                    <td className="border-r border-gray-400"></td>

                                                    <td className="border-r border-gray-400 p-3 text-right text-gray-600">{(report.reduce((sum, r) => sum + (r.unadjDrKHR || 0), 0) / (inThousands ? 1000 : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    <td className="border-r border-gray-400 p-3 text-right text-gray-600">{(report.reduce((sum, r) => sum + (r.unadjCrKHR || 0), 0) / (inThousands ? 1000 : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>

                                                    <td className="border-r border-gray-400 p-3 text-right text-blue-800 border-l-2 border-l-blue-400">{(report.reduce((sum, r) => sum + (r.adjDrKHR || 0), 0) / (inThousands ? 1000 : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    <td className="border-r border-gray-400 p-3 text-right text-blue-800">{(report.reduce((sum, r) => sum + (r.adjCrKHR || 0), 0) / (inThousands ? 1000 : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>

                                                    <td className="border-r border-gray-400 p-3 text-right text-gray-900 border-l-2 border-l-gray-400">{(totals.drKHR / (inThousands ? 1000 : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    <td className="border-r border-gray-400 p-3 text-right text-gray-900">{(totals.crKHR / (inThousands ? 1000 : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </>
                                    )}

                                    {/* --- 3. INVENTORY / MANUFACTURING FORMAT --- */}
                                    {reportFormat === 'inventory_heavy' && (
                                        <>
                                            <thead>
                                                <tr className="bg-[#111827] border-b border-[#374151]">
                                                    <th className="border-r border-[#374151] p-2 text-center w-20 text-xs text-gray-400 uppercase">Code</th>
                                                    <th className="border-r border-[#374151] p-2 text-center w-24 text-xs text-gray-400 uppercase">TOI Code</th>
                                                    <th className="border-r border-[#374151] p-2 text-left"></th>
                                                    <th className="border-r border-[#374151] p-2 text-center w-16 text-xs text-gray-400 uppercase">Note</th>
                                                    <th colSpan="3" className="border-r border-[#374151] p-2 text-center font-bold text-gray-100 bg-[#1f2937]">
                                                        For the period ended<br /><span className="text-xs text-[#60a5fa] font-normal">31-Dec-{fiscalYear}</span><br />
                                                        <span className="text-xs uppercase text-gray-400">{inThousands ? "KHR'000" : "KHR"}</span>
                                                    </th>
                                                    <th colSpan="3" className="border-r border-[#374151] p-2 text-center font-bold text-gray-400 bg-[#111827]">
                                                        For the period ended<br /><span className="text-xs font-normal">31-Dec-{fiscalYear - 1}</span><br />
                                                        <span className="text-xs uppercase text-gray-500">{inThousands ? "KHR'000" : "KHR"}</span>
                                                    </th>
                                                    <th className="p-2 text-center w-16 text-xs text-gray-500 uppercase">Ref</th>
                                                </tr>
                                                <tr className="bg-[#1f2937] text-xs font-bold text-gray-300 border-b border-[#4b5563]">
                                                    <th className="border-r border-[#374151] p-2 text-center"></th>
                                                    <th className="border-r border-[#374151] p-2 text-center"></th>
                                                    <th className="border-r border-[#374151] p-2 text-left pl-4 uppercase">Description</th>
                                                    <th className="border-r border-[#374151] p-2"></th>
                                                    <th className="border-r border-[#374151] p-2 text-right w-24 text-[#9ca3af]">Quantity</th>
                                                    <th className="border-r border-[#374151] p-2 text-right w-32 bg-[#374151]">Dr (KHR)</th>
                                                    <th className="border-r border-[#374151] p-2 text-right w-32 bg-[#374151]">Cr (KHR)</th>
                                                    <th className="border-r border-[#374151] p-2 text-right w-24 text-[#9ca3af]">Quantity (units)</th>
                                                    <th className="border-r border-[#374151] p-2 text-right w-32 bg-[#111827]">Dr (KHR)</th>
                                                    <th className="border-r border-[#374151] p-2 text-right w-32 bg-[#111827]">Cr (KHR)</th>
                                                    <th className="p-2"></th>
                                                </tr>
                                            </thead>
                                            {/* Using black theme body for manufacturing to match wireframe exactly */}
                                            <tbody className="bg-[#030712] text-white">
                                                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(prefix => {
                                                    const groupName = {
                                                        '1': 'ASSETS', '2': 'LIABILITIES', '3': 'EQUITY',
                                                        '4': 'INCOME', '5': 'COST OF SALES', '6': 'EXPENSES',
                                                        '7': 'OTHER INCOME', '8': 'OTHER EXPENSES', '9': 'NON-OPERATING'
                                                    }[prefix] || 'OTHER';

                                                    const groupRows = report.filter(r => r.code.startsWith(prefix)).sort((a, b) => a.code.localeCompare(b.code));
                                                    if (groupRows.length === 0) return null;

                                                    return (
                                                        <React.Fragment key={prefix}>
                                                            <tr className="bg-[#1f2937] border-t border-b border-[#374151]">
                                                                <td colSpan="11" className="p-2 px-4 uppercase tracking-widest text-xs font-bold text-gray-200">
                                                                    {groupName}
                                                                </td>
                                                            </tr>
                                                            {groupRows.map(row => {
                                                                const scale = inThousands ? 1000 : 1;
                                                                const dr = row.drKHR ? row.drKHR / scale : 0;
                                                                const cr = row.crKHR ? row.crKHR / scale : 0;
                                                                const pDr = row.priorDrKHR ? row.priorDrKHR / scale : 0;
                                                                const pCr = row.priorCrKHR ? row.priorCrKHR / scale : 0;

                                                                if (dr === 0 && cr === 0 && pDr === 0 && pCr === 0) return null;

                                                                // Mocking Quantity logic for Inventory formatting representation
                                                                const isInventory = (row.description?.toLowerCase() || '').includes('inventory') || row.code.startsWith('51') || (row.description?.toLowerCase() || '').includes('materials');
                                                                const mockedQuantity = isInventory && (dr || cr) ? Math.floor((dr || cr) / 4000) : '-';
                                                                const mockedPriorQuantity = isInventory && (pDr || pCr) ? Math.floor((pDr || pCr) / 4000) : '-';

                                                                return (
                                                                    <tr key={row.code} className="hover:bg-[#111827] transition border-b border-[#1f2937] text-sm group">
                                                                        <td className="border-r border-[#1f2937] p-2 text-center text-xs font-mono text-gray-500">{row.code}</td>
                                                                        <td className="border-r border-[#1f2937] p-2 text-center text-xs font-mono text-gray-600">{row.toiCode}</td>
                                                                        <td className="border-r border-[#1f2937] p-2 pl-4 text-gray-300 group-hover:text-white font-medium">{row.description}</td>
                                                                        <td className="border-r border-[#1f2937] p-2 text-left pl-4 text-xs text-gray-400">{row.description}</td>
                                                                        <td className="border-r border-[#1f2937] p-2 text-right font-mono text-[#9ca3af]">{mockedQuantity !== '-' ? mockedQuantity.toLocaleString() : '-'}</td>
                                                                        <td className="border-r border-[#1f2937] p-2 text-right font-mono text-gray-100">{dr > 0 ? dr.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>
                                                                        <td className="border-r border-[#1f2937] p-2 text-right font-mono text-gray-100">{cr > 0 ? cr.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>
                                                                        <td className="border-r border-[#1f2937] p-2 text-right font-mono text-[#6b7280]">{mockedPriorQuantity !== '-' ? mockedPriorQuantity.toLocaleString() : '-'}</td>
                                                                        <td className="border-r border-[#1f2937] p-2 text-right font-mono text-gray-400">{pDr > 0 ? pDr.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>
                                                                        <td className="border-r border-[#1f2937] p-2 text-right font-mono text-gray-400">{pCr > 0 ? pCr.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>
                                                                        <td className="p-2 text-center text-xs text-gray-600">{row.note}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })}
                                                <tr className="bg-[#111827] font-bold border-t border-[#4b5563] text-white">
                                                    <td className="border-r border-[#374151]"></td>
                                                    <td className="border-r border-[#374151]"></td>
                                                    <td className="border-r border-[#374151] p-3 text-right uppercase text-xs text-gray-400">Total</td>
                                                    <td className="border-r border-[#374151]"></td>
                                                    <td className="border-r border-[#374151]"></td>
                                                    <td className="border-r border-[#374151] p-3 text-right text-gray-100">{(totals.drKHR / (inThousands ? 1000 : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    <td className="border-r border-[#374151] p-3 text-right text-gray-100">{(totals.crKHR / (inThousands ? 1000 : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    <td className="border-r border-[#374151]"></td>
                                                    <td className="border-r border-[#374151] p-3 text-right text-gray-400">{(totals.priorDrKHR ? (totals.priorDrKHR / (inThousands ? 1000 : 1)) : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    <td className="border-r border-[#374151] p-3 text-right text-gray-400">{(totals.priorCrKHR ? (totals.priorCrKHR / (inThousands ? 1000 : 1)) : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </>
                                    )}
                                </table>
                            </div>
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
