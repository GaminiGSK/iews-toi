import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, TrendingUp, AlertCircle, RefreshCw, Bot, ArrowLeft, Calendar, Layout } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const FinancialStatements = ({ onBack }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('annual'); // 'annual' | 'monthly'
    const [companyName, setCompanyName] = useState('Your Company');
    const [inThousands, setInThousands] = useState(false);
    const [report, setReport] = useState([]); // Annual Data
    const [monthlyData, setMonthlyData] = useState({ pl: [], bs: [] }); // Monthly Data
    const [activeTab, setActiveTab] = useState('pl'); // 'pl' | 'bs' | 'cf' | 'sce' | 'notes'

    useEffect(() => {
        if (viewMode === 'annual') {
            fetchReport();
        } else {
            fetchMonthlyReport();
        }
    }, [viewMode]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/trial-balance', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setReport(res.data.report || []);
            if (res.data.companyName) setCompanyName(res.data.companyName);
        } catch (err) {
            setError("Failed to load annual financial data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyReport = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/financials-monthly', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMonthlyData(res.data || { pl: [], bs: [] });
            if (res.data.companyName) setCompanyName(res.data.companyName);
        } catch (err) {
            setError("Failed to load monthly financial data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Calculation Logic (Annual) ---
    const scale = inThousands ? 1000 : 1;

    // 1. Profit & Loss Data (Annual)
    const revenue = report.filter(r => r.code.startsWith('4'));
    const costOfSales = report.filter(r => r.code.startsWith('5'));
    const expenses = report.filter(r => ['6', '7', '8', '9'].some(p => r.code.startsWith(p)));

    const totalRev = revenue.reduce((sum, r) => sum + r.crKHR, 0) / scale;
    const totalCOS = costOfSales.reduce((sum, r) => sum + r.drKHR, 0) / scale;
    const grossProfit = totalRev - totalCOS;
    const totalExp = expenses.reduce((sum, r) => sum + r.drKHR, 0) / scale;
    const netProfit = grossProfit - totalExp;

    // 2. Balance Sheet Data (Annual)
    const assets = report.filter(r => r.code.startsWith('1'));
    const liabilities = report.filter(r => r.code.startsWith('2'));
    const equity = report.filter(r => r.code.startsWith('3'));

    const totalAssets = assets.reduce((sum, r) => sum + (r.drKHR - r.crKHR), 0) / scale;
    const totalLiabs = liabilities.reduce((sum, r) => sum + (r.crKHR - r.drKHR), 0) / scale;
    const totalEquity = equity.reduce((sum, r) => sum + (r.crKHR - r.drKHR), 0) / scale;

    const checkDiff = totalAssets - (totalLiabs + totalEquity + netProfit);

    // --- Calculation Logic (Monthly) ---
    // Helper to sum a row of monthly data (index 1-12)
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Group Monthly Data
    const monthlyPL = monthlyData.pl || [];
    const monthlyBS = monthlyData.bs || [];

    const mRevenue = monthlyPL.filter(r => r.code.startsWith('4'));
    const mCOS = monthlyPL.filter(r => r.code.startsWith('5'));
    const mExpenses = monthlyPL.filter(r => ['6', '7', '8', '9'].some(p => r.code.startsWith(p)));

    const mAssets = monthlyBS.filter(r => r.code.startsWith('1'));
    const mLiabs = monthlyBS.filter(r => r.code.startsWith('2'));
    const mEquity = monthlyBS.filter(r => r.code.startsWith('3'));

    // Helpers to Sum Monthly Arrays [0..12]
    const sumMonthlyRows = (rows) => {
        const totals = Array(13).fill(0);
        rows.forEach(r => {
            for (let i = 1; i <= 12; i++) totals[i] += r.months[i];
            totals[0] += r.months[0];
        });
        return totals;
    };

    const mTotalRev = sumMonthlyRows(mRevenue);
    const mTotalCOS = sumMonthlyRows(mCOS);
    const mGrossProfit = mTotalRev.map((v, i) => v - mTotalCOS[i]);
    const mTotalExp = sumMonthlyRows(mExpenses);
    const mNetProfit = mGrossProfit.map((v, i) => v - mTotalExp[i]);

    // Helpers to find specific account values for Cash Flow
    const findBalance = (keywords) => {
        const matches = report.filter(r => keywords.some(k => r.description.toLowerCase().includes(k.toLowerCase())));
        return matches.reduce((sum, r) => sum + (r.drKHR - r.crKHR), 0) / scale;
    };

    const deprExp = findBalance(['depreciation', 'amortization']);
    const intExp = findBalance(['interest expense', 'finance cost']);
    const intInc = -findBalance(['interest income', 'investment income']); // Credit balance, so negate for display

    // Working Capital Changes (Simplified: Diff between current accounts if they exist)
    const receivables = findBalance(['receivable', 'debtor']);
    const payables = -findBalance(['payable', 'creditor']); // Credit balance
    const inventory = findBalance(['inventory', 'stock']);

    // Helpers for Render
    const renderRow = (label, value, bold = false, indent = false) => (
        <tr className={`border-b border-gray-100 hover:bg-gray-50 ${bold ? 'font-bold bg-gray-50' : ''}`}>
            <td className={`p-3 ${indent ? 'pl-8' : 'pl-4'} text-gray-800`}>{label}</td>
            <td className="p-3 text-right font-mono text-gray-900">
                {value !== 0 ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
            </td>
        </tr>
    );

    const renderMonthRow = (label, months, bold = false, indent = false) => (
        <tr className={`border-b border-gray-100 hover:bg-gray-50 ${bold ? 'font-bold bg-gray-50' : ''}`}>
            <td className={`p-3 ${indent ? 'pl-8' : 'pl-4'} text-gray-800 sticky left-0 bg-white min-w-[200px] border-r border-gray-200 z-10`}>{label}</td>
            {MONTHS.map((_, idx) => {
                const val = months[idx + 1] / scale;
                return (
                    <td key={idx} className="p-3 text-right font-mono text-gray-900 min-w-[100px]">
                        {val !== 0 ? val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                    </td>
                );
            })}
            <td className="p-3 text-right font-mono text-gray-900 font-bold bg-gray-50 border-l border-gray-200 min-w-[120px]">
                {months[0] / scale !== 0 ? (months[0] / scale).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
            </td>
        </tr>
    );

    const renderSectionHeader = (title, monthly = false) => (
        <tr className="bg-blue-50/50 border-b border-blue-100">
            <td colSpan={monthly ? 14 : 2} className="p-3 pl-4 font-bold text-blue-800 uppercase text-xs tracking-wider sticky left-0 z-10">{title}</td>
        </tr>
    );

    const handleDownloadPDF = () => {
        const doc = new jsPDF(viewMode === 'monthly' ? 'l' : 'p');
        const titleMap = {
            pl: "STATEMENT OF PROFIT OR LOSS",
            bs: "STATEMENT OF FINANCIAL POSITION",
            cf: "STATEMENT OF CASH FLOWS",
            sce: "STATEMENT OF CHANGES IN EQUITY",
            notes: "NOTES TO THE FINANCIAL STATEMENTS"
        };

        // Header
        doc.setFontSize(16);
        doc.setFont('serif', 'bold');
        doc.text(companyName.toUpperCase(), 14, 20);
        doc.setFontSize(12);
        doc.text(titleMap[activeTab] || "FINANCIAL REPORT", 14, 28);
        doc.setFontSize(10);
        doc.setFont('serif', 'normal');
        doc.text(`For the year ended 31 December ${new Date().getFullYear()}`, 14, 34);
        doc.text(`Expressed in ${inThousands ? "thousands of " : ""}Cambodian Riel (KHR)`, 14, 40);

        // Content
        if (activeTab === 'notes') {
            doc.setFontSize(10);
            const notesText = `
                1. BASIS OF PREPARATION
                These financial statements have been prepared in accordance with International Financial Reporting Standards (IFRS) as issued by the International Accounting Standards Board (IASB).
                
                2. SIGNIFICANT ACCOUNTING POLICIES
                Revenue is recognized when control of goods or services is transferred to the customer. PPE is stated at cost less accumulated depreciation.
            `;
            const splitText = doc.splitTextToSize(notesText, 180);
            doc.text(splitText, 14, 50);
        } else {
            doc.autoTable({
                html: 'table',
                startY: 50,
                styles: { font: 'serif', fontSize: 9 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { top: 50 }
            });
        }

        doc.save(`${companyName}_${activeTab}_${viewMode}.pdf`);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-pulse">
            <RefreshCw className="animate-spin mb-2" size={32} />
            <p>Generating {viewMode} report...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-50/50 animate-fade-in text-gray-900">
            {/* Header / Toolbar - Left Aligned */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-8 shadow-sm overflow-x-auto">
                <div className="flex items-center gap-4 shrink-0">
                    <button onClick={onBack} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition shrink-0 shadow-md">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 font-serif">Financial Statements</h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Bot size={14} className="text-blue-500" />
                            Generated by Blue Agent (IAS/IFRS Compliant)
                        </p>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="h-10 w-px bg-gray-200 shrink-0"></div>

                <div className="flex items-center gap-4 shrink-0">
                    {/* View Mode Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
                        <button
                            onClick={() => setViewMode('annual')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'annual' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Annual
                        </button>
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Monthly Extra
                        </button>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-200 transition">
                        <input
                            type="checkbox"
                            checked={inThousands}
                            onChange={(e) => setInThousands(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="text-gray-700 font-sans text-xs font-semibold">Values in {inThousands ? "KHR'000" : "KHR"}</span>
                    </label>
                    <button onClick={handleDownloadPDF} className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-md">
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Insight Banner */}
            <div className="bg-indigo-900 text-white px-8 py-3 flex justify-between items-center text-sm shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-1.5 rounded-lg"><TrendingUp size={16} className="text-indigo-200" /></div>
                    <span>
                        <span className="font-bold text-indigo-200">AI Insight: </span>
                        {viewMode === 'annual'
                            ? `Net Profit Margin is ${(totalRev > 0 ? (netProfit / totalRev) * 100 : 0).toFixed(1)}%.`
                            : `Displaying 12-Month breakdown.`}
                        {viewMode === 'annual' && checkDiff !== 0 && <span className="text-red-300 ml-2 font-bold flex items-center gap-1 inline-flex"><AlertCircle size={14} /> Balance Sheet out by {checkDiff.toFixed(2)}</span>}
                    </span>
                </div>
                <div className="flex gap-4 font-mono text-xs opacity-80">
                    <span>Code Standard: TOI-2025</span>
                    <span>Currency: KHR</span>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className={`flex-1 overflow-hidden flex flex-col mx-auto w-full p-8 ${viewMode === 'monthly' ? 'max-w-[1400px]' : 'max-w-5xl'}`}>
                {/* Tabs */}
                <div className="flex gap-2 mb-0">
                    <button
                        onClick={() => setActiveTab('pl')}
                        className={`px-6 py-3 rounded-t-xl font-medium text-sm transition-all ${activeTab === 'pl' ? 'bg-white text-blue-700 shadow-sm border-t border-x border-gray-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        Income Statement
                    </button>
                    <button
                        onClick={() => setActiveTab('bs')}
                        className={`px-6 py-3 rounded-t-xl font-medium text-sm transition-all ${activeTab === 'bs' ? 'bg-white text-blue-700 shadow-sm border-t border-x border-gray-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        Balance Sheet
                    </button>
                    {viewMode === 'annual' && (
                        <>
                            <button
                                onClick={() => setActiveTab('cf')}
                                className={`px-6 py-3 rounded-t-xl font-medium text-sm transition-all ${activeTab === 'cf' ? 'bg-white text-blue-700 shadow-sm border-t border-x border-gray-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                Cash Flow
                            </button>
                            <button
                                onClick={() => setActiveTab('sce')}
                                className={`px-6 py-3 rounded-t-xl font-medium text-sm transition-all ${activeTab === 'sce' ? 'bg-white text-blue-700 shadow-sm border-t border-x border-gray-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                Equity Changes
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`px-6 py-3 rounded-t-xl font-medium text-sm transition-all ${activeTab === 'notes' ? 'bg-white text-blue-700 shadow-sm border-t border-x border-gray-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                Notes (IAS)
                            </button>
                        </>
                    )}
                </div>

                {/* Report Paper */}
                <div className="bg-white rounded-b-xl rounded-tr-xl shadow-xl border border-gray-200 p-10 min-h-[600px] font-serif relative overflow-auto">
                    {/* Watermark */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-50 text-[100px] font-bold rotate-45 pointer-events-none select-none uppercase">
                        {error ? "ERROR" : "DRAFT"}
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyName}</h2>
                        <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight">
                            {activeTab === 'pl' ? 'INCOME STATEMENT'
                                : activeTab === 'bs' ? 'STATEMENT OF FINANCIAL POSITION'
                                    : activeTab === 'cf' ? 'STATEMENT OF CASH FLOWS'
                                        : activeTab === 'sce' ? 'STATEMENT OF CHANGES IN EQUITY'
                                            : 'NOTES TO THE FINANCIAL STATEMENTS'}
                        </h3>
                        <p className="text-sm text-gray-500 italic">
                            {activeTab === 'bs' ? 'As at' : 'For the year ended'} 31 December {new Date().getFullYear()}
                        </p>
                        <p className="text-xs text-gray-400 mt-2 uppercase font-sans">
                            (Expressed in {inThousands ? "thousands of Cambodian Riel" : "Cambodian Riel"}) - {viewMode === 'monthly' ? 'Monthly Breakdown' : 'Annual Total'}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            {viewMode === 'monthly' && (
                                <thead>
                                    <tr className="border-b border-gray-300">
                                        <th className="p-2 text-left bg-gray-50 sticky left-0 z-10 border-r border-gray-200">Account</th>
                                        {MONTHS.map(m => <th key={m} className="p-2 text-right min-w-[100px] text-gray-600 font-sans font-medium">{m}</th>)}
                                        <th className="p-2 text-right min-w-[120px] font-bold bg-gray-50 border-l border-gray-200">TOTAL</th>
                                    </tr>
                                </thead>
                            )}

                            {/* --- ANNUAL VIEW --- */}
                            {viewMode === 'annual' && activeTab === 'pl' && (
                                <tbody>
                                    {renderSectionHeader("Revenue")}
                                    {revenue.map(r => renderRow(r.description, r.crKHR / scale, false, true))}
                                    {renderRow("Total Revenue", totalRev, true)}

                                    {renderSectionHeader("Cost of Sales")}
                                    {costOfSales.map(r => renderRow(r.description, r.drKHR / scale, false, true))}
                                    {renderRow("Gross Profit", grossProfit, true)}

                                    {renderSectionHeader("Operating Expenses")}
                                    {expenses.map(r => renderRow(r.description, r.drKHR / scale, false, true))}
                                    {renderRow("Total Operating Expenses", totalExp, true)}

                                    <tr className="h-4"></tr>
                                    <tr className="border-t-2 border-black border-b-2 border-double">
                                        <td className="p-4 font-bold text-lg">NET PROFIT FOR THE YEAR</td>
                                        <td className="p-4 text-right font-bold font-mono text-lg">{netProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    </tr>
                                </tbody>
                            )}

                            {viewMode === 'annual' && activeTab === 'bs' && (
                                <tbody>
                                    {renderSectionHeader("ASSETS")}
                                    {assets.map(r => renderRow(r.description, (r.drKHR - r.crKHR) / scale, false, true))}
                                    {renderRow("TOTAL ASSETS", totalAssets, true)}

                                    <tr className="h-6"></tr>

                                    {renderSectionHeader("EQUITY & LIABILITIES")}

                                    {renderSectionHeader("Equity")}
                                    {equity.map(r => renderRow(r.description, (r.crKHR - r.drKHR) / scale, false, true))}
                                    {renderRow("Current Year Earnings", netProfit, false, true)} {/* Auto Inserted */}
                                    {renderRow("Total Equity", totalEquity + netProfit, true)}

                                    {renderSectionHeader("Liabilities")}
                                    {liabilities.map(r => renderRow(r.description, (r.crKHR - r.drKHR) / scale, false, true))}
                                    {renderRow("Total Liabilities", totalLiabs, true)}

                                    <tr className="h-4"></tr>
                                    <tr className="border-t-2 border-black border-b-2 border-double">
                                        <td className="p-4 font-bold text-lg">TOTAL EQUITY & LIABILITIES</td>
                                        <td className="p-4 text-right font-bold font-mono text-lg">{(totalLiabs + totalEquity + netProfit).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    </tr>
                                </tbody>
                            )}

                            {viewMode === 'annual' && activeTab === 'cf' && (
                                <tbody>
                                    {renderSectionHeader("CASH FLOWS FROM OPERATING ACTIVITIES")}
                                    {renderRow("Net Profit before Tax", netProfit, true)}
                                    {renderRow("Adjustments for:", 0, false, true)}
                                    {renderRow(" - Depreciation and Amortization", deprExp, false, true)}
                                    {renderRow(" - Interest Income", -intInc, false, true)}
                                    {renderRow(" - Interest Expense", intExp, false, true)}
                                    <tr className="h-2"></tr>
                                    {renderRow("Changes in Working Capital:", 0, false, true)}
                                    {renderRow(" - (Increase)/Decrease in Inventories", -inventory, false, true)}
                                    {renderRow(" - (Increase)/Decrease in Receivables", -receivables, false, true)}
                                    {renderRow(" - Increase/(Decrease) in Payables", payables, false, true)}
                                    <tr className="border-t border-gray-300"><td colSpan="2"></td></tr>
                                    {renderRow("Net Cash from Operating Activities", netProfit + deprExp + intExp - intInc - inventory - receivables + payables, true)}

                                    <tr className="h-6"></tr>

                                    {renderSectionHeader("CASH FLOWS FROM INVESTING ACTIVITIES")}
                                    {assets.filter(a => a.description.toLowerCase().includes('fixed') || a.description.toLowerCase().includes('equipment')).map(r =>
                                        renderRow(`Purchase of ${r.description}`, -(r.drKHR - r.crKHR) / scale, false, true)
                                    )}
                                    {renderRow("Interest Received", intInc, false, true)}
                                    <tr className="border-t border-gray-300"><td colSpan="2"></td></tr>
                                    {renderRow("Net Cash generated from/(used in) Investing Activities", assets.filter(a => a.description.toLowerCase().includes('fixed') || a.description.toLowerCase().includes('equipment')).reduce((sum, r) => sum - ((r.drKHR - r.crKHR) / scale), 0) + intInc, true)}

                                    <tr className="h-6"></tr>

                                    {renderSectionHeader("CASH FLOWS FROM FINANCING ACTIVITIES")}
                                    {equity.filter(e => e.description.toLowerCase().includes('capital')).map(r =>
                                        renderRow(`Issuance of ${r.description}`, (r.crKHR - r.drKHR) / scale, false, true)
                                    )}
                                    {renderRow("Dividends Paid", 0, false, true)}
                                    {renderRow("Interest Paid", -intExp, false, true)}
                                    <tr className="border-t border-gray-300"><td colSpan="2"></td></tr>
                                    {renderRow("Net Cash generated from/(used in) Financing Activities", equity.filter(e => e.description.toLowerCase().includes('capital')).reduce((sum, r) => sum + ((r.crKHR - r.drKHR) / scale), 0) - intExp, true)}

                                    <tr className="h-8"></tr>
                                    <tr className="border-t-2 border-black border-b-2 border-double">
                                        <td className="p-4 font-bold text-lg">NET INCREASE IN CASH AND CASH EQUIVALENTS</td>
                                        <td className="p-4 text-right font-bold font-mono text-lg">
                                            {(
                                                netProfit +
                                                assets.filter(a => a.description.toLowerCase().includes('fixed') || a.description.toLowerCase().includes('equipment')).reduce((sum, r) => sum - ((r.drKHR - r.crKHR) / scale), 0) +
                                                equity.filter(e => e.description.toLowerCase().includes('capital')).reduce((sum, r) => sum + ((r.crKHR - r.drKHR) / scale), 0)
                                            ).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                    {renderRow("Cash and Cash Equivalents at Beginning of Year", 0, false, true)}
                                    {renderRow("Cash and Cash Equivalents at End of Year", (
                                        netProfit +
                                        assets.filter(a => a.description.toLowerCase().includes('fixed') || a.description.toLowerCase().includes('equipment')).reduce((sum, r) => sum - ((r.drKHR - r.crKHR) / scale), 0) +
                                        equity.filter(e => e.description.toLowerCase().includes('capital')).reduce((sum, r) => sum + ((r.crKHR - r.drKHR) / scale), 0)
                                    ), true)}
                                </tbody>
                            )}

                            {/* --- STATEMENT OF CHANGES IN EQUITY (IFRS) --- */}
                            {viewMode === 'annual' && activeTab === 'sce' && (
                                <tbody>
                                    <tr className="bg-gray-50 font-bold border-b border-gray-300">
                                        <td className="p-3">Description</td>
                                        <td className="p-3 text-right">Share Capital</td>
                                        <td className="p-3 text-right">Retained Earnings</td>
                                        <td className="p-3 text-right">Total Equity</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="p-3 pl-4">Balance at 1 January {new Date().getFullYear()}</td>
                                        <td className="p-3 text-right font-mono">{totalEquity.toLocaleString()}</td>
                                        <td className="p-3 text-right font-mono">0</td>
                                        <td className="p-3 text-right font-mono">{totalEquity.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="p-3 pl-4">Profit for the year</td>
                                        <td className="p-3 text-right font-mono">-</td>
                                        <td className="p-3 text-right font-mono">{netProfit.toLocaleString()}</td>
                                        <td className="p-3 text-right font-mono">{netProfit.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="p-3 pl-4">Other Comprehensive Income</td>
                                        <td className="p-3 text-right font-mono">0</td>
                                        <td className="p-3 text-right font-mono">0</td>
                                        <td className="p-3 text-right font-mono">0</td>
                                    </tr>
                                    <tr className="h-4"></tr>
                                    <tr className="border-t-2 border-black border-b-2 border-double bg-gray-50 font-bold">
                                        <td className="p-3">Balance at 31 December {new Date().getFullYear()}</td>
                                        <td className="p-3 text-right font-mono">{totalEquity.toLocaleString()}</td>
                                        <td className="p-3 text-right font-mono">{netProfit.toLocaleString()}</td>
                                        <td className="p-3 text-right font-mono">{(totalEquity + netProfit).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            )}

                            {/* --- NOTES TO THE FINANCIAL STATEMENTS (IFRS/ACCA) --- */}
                            {viewMode === 'annual' && activeTab === 'notes' && (
                                <tbody className="font-sans">
                                    <tr>
                                        <td colSpan="2" className="p-6">
                                            <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">1. BASIS OF PREPARATION</h4>
                                            <p className="text-gray-700 leading-relaxed mb-6">
                                                These financial statements have been prepared in accordance with International Financial Reporting Standards (IFRS) as issued by the International Accounting Standards Board (IASB).
                                                The financial statements have been prepared under the historical cost convention, modified by the revaluation of certain financial instruments.
                                            </p>

                                            <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">2. SIGNIFICANT ACCOUNTING POLICIES</h4>
                                            <div className="space-y-4 text-gray-700">
                                                <p>
                                                    <strong>Revenue Recognition:</strong> Revenue is recognized when control of goods or services is transferred to the customer at an amount that reflects the consideration to which the entity expects to be entitled.
                                                </p>
                                                <p>
                                                    <strong>Property, Plant, and Equipment:</strong> PPE is stated at cost less accumulated depreciation. Depreciation is calculated on a straight-line basis over the estimated useful lives of the assets.
                                                </p>
                                                <p>
                                                    <strong>Foreign Currencies:</strong> The functional and presentation currency is the Cambodian Riel (KHR). Transactions in foreign currencies are translated into the functional currency using the exchange rates prevailing at the dates of the transactions.
                                                </p>
                                            </div>

                                            <h4 className="font-bold text-gray-900 border-b pb-2 mb-4 mt-8">3. CRITICAL ACCOUNTING ESTIMATES AND JUDGEMENTS</h4>
                                            <p className="text-gray-700 leading-relaxed">
                                                The preparation of financial statements requires the use of certain critical accounting estimates. It also requires management to exercise its judgement in the process of applying the entity's accounting policies.
                                            </p>
                                        </td>
                                    </tr>
                                </tbody>
                            )}

                            {/* --- MONTHLY VIEW --- */}
                            {viewMode === 'monthly' && activeTab === 'pl' && (
                                <tbody>
                                    {renderSectionHeader("Revenue", true)}
                                    {mRevenue.map(r => renderMonthRow(r.description, r.months, false, true))}
                                    {renderMonthRow("Total Revenue", mTotalRev, true)}

                                    {renderSectionHeader("Cost of Sales", true)}
                                    {mCOS.map(r => renderMonthRow(r.description, r.months, false, true))}
                                    {renderMonthRow("Gross Profit", mGrossProfit, true)}

                                    {renderSectionHeader("Operating Expenses", true)}
                                    {mExpenses.map(r => renderMonthRow(r.description, r.months, false, true))}
                                    {renderMonthRow("Total Operating Expenses", mTotalExp, true)}

                                    <tr className="h-4"></tr>
                                    {renderMonthRow("NET PROFIT", mNetProfit, true)}
                                </tbody>
                            )}

                            {viewMode === 'monthly' && activeTab === 'bs' && (
                                <tbody>
                                    {renderSectionHeader("ASSETS", true)}
                                    {mAssets.map(r => renderMonthRow(r.description, r.months, false, true))}

                                    <tr className="h-6"></tr>
                                    {renderSectionHeader("EQUITY & LIABILITIES", true)}
                                    {renderSectionHeader("Equity", true)}
                                    {mEquity.map(r => renderMonthRow(r.description, r.months, false, true))}

                                    {renderSectionHeader("Liabilities", true)}
                                    {mLiabs.map(r => renderMonthRow(r.description, r.months, false, true))}
                                </tbody>
                            )}

                        </table>
                    </div>


                    <div className="mt-12 pt-8 border-t border-gray-300 flex justify-between text-xs text-center text-gray-500 font-sans">
                        <div className="w-1/3">
                            <div className="h-16 border-b border-gray-300 mb-2"></div>
                            <p>Prepared by</p>
                            <p className="font-bold">Blue AI Agent</p>
                        </div>
                        <div className="w-1/3">
                            <div className="h-16 border-b border-gray-300 mb-2"></div>
                            <p>Reviewed by</p>
                            <p className="font-bold">Finance Manager</p>
                        </div>
                        <div className="w-1/3">
                            <div className="h-16 border-b border-gray-300 mb-2"></div>
                            <p>Approved by</p>
                            <p className="font-bold">Director</p>
                        </div>
                    </div>
                </div >
            </div >
        </div >
    );
};

export default FinancialStatements;
