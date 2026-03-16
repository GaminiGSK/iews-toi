import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, TrendingUp, AlertCircle, RefreshCw, Bot, ArrowLeft, Calendar, Layout } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const FinancialStatements = ({ onBack }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('annual'); // 'annual' | 'monthly'
    const [companyNameEn, setCompanyNameEn] = useState('Your Company');
    const [companyNameKh, setCompanyNameKh] = useState('');
    const [inUSD, setInUSD] = useState(false);
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
            if (res.data.companyNameEn) setCompanyNameEn(res.data.companyNameEn);
            if (res.data.companyNameKh) setCompanyNameKh(res.data.companyNameKh);
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
            if (res.data.companyNameEn) setCompanyNameEn(res.data.companyNameEn);
            if (res.data.companyNameKh) setCompanyNameKh(res.data.companyNameKh);
        } catch (err) {
            setError("Failed to load monthly financial data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Calculation Logic (Annual) ---
    const exchangeRate = 4050; // Standard yearly KHR to USD exchange rate
    const scale = inUSD ? exchangeRate : 1;

    const getCr = (r) => (r.crKHR || 0) / scale;
    const getDr = (r) => (r.drKHR || 0) / scale;
    const getPriorCr = (r) => (r.priorCrKHR || 0) / scale;
    const getPriorDr = (r) => (r.priorDrKHR || 0) / scale;

    // 1. Profit & Loss Data (Annual)
    const revenue = report.filter(r => r.code.startsWith('4'));
    const costOfSales = report.filter(r => r.code.startsWith('5'));
    const expenses = report.filter(r => ['6', '7', '8', '9'].some(p => r.code.startsWith(p)));

    const totalRev = revenue.reduce((sum, r) => sum + getCr(r), 0);
    const totalCOS = costOfSales.reduce((sum, r) => sum + getDr(r), 0);
    const grossProfit = totalRev - totalCOS;
    const totalExp = expenses.reduce((sum, r) => sum + getDr(r), 0);
    const netProfit = grossProfit - totalExp;

    // 2. Balance Sheet Data (Annual)
    const assets = report.filter(r => r.code.startsWith('1'));
    const liabilities = report.filter(r => r.code.startsWith('2'));
    const equity = report.filter(r => r.code.startsWith('3'));

    const totalAssets = assets.reduce((sum, r) => sum + (getDr(r) - getCr(r)), 0);
    const totalLiabs = liabilities.reduce((sum, r) => sum + (getCr(r) - getDr(r)), 0);
    const totalEquity = equity.reduce((sum, r) => sum + (getCr(r) - getDr(r)), 0);

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
        const matches = report.filter(r => keywords.some(k => (r.description?.toLowerCase() || '').includes(k.toLowerCase())));
        return matches.reduce((sum, r) => sum + (getDr(r) - getCr(r)), 0);
    };

    const deprExp = findBalance(['depreciation', 'amortization']);
    const intExp = findBalance(['interest expense', 'finance cost']);
    const intInc = -findBalance(['interest income', 'investment income']); // Credit balance, so negate for display

    // Working Capital Changes (Simplified: Diff between current accounts if they exist)
    const receivables = findBalance(['receivable', 'debtor']);
    const payables = -findBalance(['payable', 'creditor']); // Credit balance
    const inventory = findBalance(['inventory', 'stock']);

    // Helpers for Render
    const renderRow = (label, valueCY, valuePY = 0, bold = false, indent = false) => (
        <tr className={`border-b border-gray-100 hover:bg-gray-50 ${bold ? 'font-bold bg-gray-50' : ''}`}>
            <td className={`p-3 ${indent ? 'pl-8' : 'pl-4'} text-gray-800 uppercase`} style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{label}</td>
            <td className="p-3 text-center font-mono text-gray-500 w-16 text-xs border-l border-gray-100">-</td>
            <td className="p-3 text-right font-mono w-40 border-l border-gray-200 text-gray-900">
                {valueCY !== 0 ? valueCY.toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 }) : '-'}
            </td>
            <td className="p-3 text-right font-mono w-40 border-l border-gray-200 text-gray-500">
                {valuePY !== 0 ? valuePY.toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 }) : '-'}
            </td>
        </tr>
    );

    const renderMonthRow = (label, months, bold = false, indent = false) => (
        <tr className={`border-b border-gray-100 hover:bg-gray-50 ${bold ? 'font-bold bg-gray-50' : ''}`}>
            <td className={`p-3 ${indent ? 'pl-8' : 'pl-4'} text-gray-800 sticky left-0 bg-white min-w-[200px] border-r border-gray-200 z-10 uppercase`} style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{label}</td>
            {MONTHS.map((_, idx) => {
                const val = months[idx + 1] / scale;
                return (
                    <td key={idx} className="p-3 text-right font-mono text-gray-900 min-w-[100px]">
                        {val !== 0 ? val.toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 }) : '-'}
                    </td>
                );
            })}
            <td className="p-3 text-right font-mono text-gray-900 font-bold bg-gray-50 border-l border-gray-200 min-w-[120px]">
                {months[0] / scale !== 0 ? (months[0] / scale).toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 }) : '-'}
            </td>
        </tr>
    );

    const renderSectionHeader = (title, monthly = false) => (
        <tr className="bg-blue-50/50 border-b border-blue-100">
            <td colSpan={monthly ? 14 : 4} className="p-3 pl-4 font-bold text-blue-800 uppercase text-xs tracking-wider sticky left-0 z-10" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{title}</td>
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
        doc.text(companyNameEn.toUpperCase(), 14, 20);
        doc.setFontSize(12);
        doc.text(titleMap[activeTab] || "FINANCIAL REPORT", 14, 28);
        doc.setFontSize(10);
        doc.setFont('serif', 'normal');
        doc.text(`For the year ended 31 December ${new Date().getFullYear()}`, 14, 34);
        doc.text(`Expressed in ${inUSD ? "United States Dollar (USD)" : "Cambodian Riel (KHR)"}`, 14, 40);

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

        doc.save(`${companyNameEn}_${activeTab}_${viewMode}.pdf`);
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
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-8 shadow-sm overflow-x-auto print:hidden">
                <div className="flex items-center gap-4 shrink-0">
                    <button onClick={onBack} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition shrink-0 shadow-md print:hidden">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 font-serif">Financial Statements</h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Bot size={14} className="text-blue-500" />
                            Generated by Blue Agent (CIFRS Compliant)
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
                            checked={inUSD}
                            onChange={(e) => setInUSD(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="text-gray-700 font-sans text-xs font-semibold">View in {inUSD ? "USD" : "KHR"}</span>
                    </label>
                    <button onClick={() => window.print()} className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Print A4 Layout
                    </button>
                    <button onClick={handleDownloadPDF} className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-md">
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Insight Banner */}
            <div className="bg-indigo-900 text-white px-8 py-3 flex justify-between items-center text-sm shadow-md print:hidden">
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
                    <span>Currency: {inUSD ? "USD" : "KHR"}</span>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className={`flex-1 overflow-hidden flex flex-col mx-auto w-full p-8 print:p-0 print:min-w-full print:max-w-none ${viewMode === 'monthly' ? 'max-w-[1400px]' : 'max-w-5xl'}`}>
                {/* Tabs */}
                <div className="flex gap-2 mb-0 print:hidden">
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
                                Notes (CIFRS)
                            </button>
                        </>
                    )}
                </div>

                {/* Report Paper */}
                <div className="print-container bg-white rounded-b-xl rounded-tr-xl shadow-xl border border-gray-200 p-10 print:p-0 min-h-[600px] font-sans relative overflow-auto print:overflow-visible select-text print:shadow-none print:border-none print:bg-transparent print:rounded-none print:max-w-none print:w-full print:m-0">
                    <style>
                        {`
                            @media print {
                                @page { 
                                    size: ${viewMode === 'annual' ? 'A4 portrait !important' : 'A4 landscape !important'}; margin: 10mm; 
                                }
                                body * { visibility: hidden !important; }
                                .print-container, .print-container * { visibility: visible !important; }
                                .print-container { 
                                    position: absolute !important; 
                                    left: 0 !important; 
                                    top: 0 !important; 
                                    width: 100% !important; 
                                    border: none !important; 
                                    box-shadow: none !important; 
                                    margin: 0 !important; 
                                    padding: 0 !important; 
                                    background: white !important;
                                }
                                .print-section { 
                                    page-break-after: always; 
                                    page-break-inside: avoid;
                                    display: block !important; 
                                    width: 100% !important; 
                                    background: white !important;
                                }
                                .print-section:last-child { page-break-after: auto; }
                                .print-content-wrapper { overflow: visible !important; }
                                .print\\:hidden { display: none !important; }
                            }
                        `}
                    </style>
                    {/* Watermark */}
                    {error && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-50 text-[100px] font-bold rotate-45 pointer-events-none select-none uppercase">
                            ERROR
                        </div>
                    )}

                    
                    {viewMode === 'annual' && (
                    <div className="print-section">
                        {/* Page 1: Income Statement */}
                        <div className={`${activeTab === 'pl' ? 'block' : 'hidden print:block'}`}>
                            <div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">
                                <div className="flex justify-between items-start mb-8">
                                    <div><h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{companyNameKh}</h1><h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2 px-1">{companyNameEn}</h2></div>
                                    <div className="text-right flex flex-col items-end gap-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Detail</div><h3 className="text-xl font-bold text-black uppercase tracking-widest mt-1">របាយការណ៍លទ្ធផល / INCOME STATEMENT</h3><div className="text-sm font-bold text-black mt-1">For the year ended 31 December {new Date().getFullYear()}</div><div className="text-sm font-bold text-black">Reporting Currency: {inUSD ? "USD" : "KHR"}</div></div>
                                </div>
                            </div>
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍លទ្ធផល / INCOME STATEMENT</h3>
                                <p className="text-sm text-gray-500 italic">For the year ended 31 December {new Date().getFullYear()}</p>
                            </div>
                            <div className="overflow-x-auto print-content-wrapper">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-gray-300">
                                            <th className="p-3 text-left font-bold text-gray-600 uppercase text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ / DESCRIPTION</th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-20" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាំ<br/>NOTE</th>
                                            <th className="p-3 text-center font-bold text-gray-800 uppercase text-xs w-48 bg-white border-l border-gray-200" style={{ borderTop: '4px solid #3B82F6', fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-blue-600 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear()} {inUSD ? 'USD' : 'KHR'}</span></th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-48 bg-slate-50 border-l border-gray-200" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-gray-500 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear() - 1} {inUSD ? 'USD' : 'KHR'}</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {renderSectionHeader("ចំណូល / REVENUE")}
                                        {revenue.map(r => renderRow(r.description, getCr(r), getPriorCr(r), false, true))}
                                        {renderRow("ចំណូលសរុប / TOTAL REVENUE", totalRev, revenue.reduce((sum, r) => sum + getPriorCr(r), 0), true)}

                                        {renderSectionHeader("ថ្លៃដើមលក់ / COST OF SALES")}
                                        {costOfSales.map(r => renderRow(r.description, getDr(r), getPriorDr(r), false, true))}
                                        {renderRow("ប្រាក់ចំណេញដុល / GROSS PROFIT", grossProfit, revenue.reduce((sum, r) => sum + getPriorCr(r), 0) - costOfSales.reduce((sum, r) => sum + getPriorDr(r), 0), true)}

                                        {renderSectionHeader("ចំណាយប្រតិបត្តិការ / OPERATING EXPENSES")}
                                        {expenses.map(r => renderRow(r.description, getDr(r), getPriorDr(r), false, true))}
                                        {renderRow("ចំណាយប្រតិបត្តិការសរុប / TOTAL OPERATING EXPENSES", totalExp, expenses.reduce((sum, r) => sum + getPriorDr(r), 0), true)}

                                        <tr className="h-4"></tr>
                                        <tr className="border-t-4 border-gray-800 border-b-4 border-gray-800 bg-gray-50">
                                            <td className="p-4 font-bold text-lg uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញសុទ្ធសម្រាប់ឆ្នាំ / NET PROFIT FOR THE YEAR</td>
                                            <td className="p-4 text-center font-mono text-gray-500">-</td>
                                            <td className="p-4 text-right font-bold font-mono text-lg border-l border-gray-200">{netProfit.toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                            <td className="p-4 text-right font-bold font-mono text-lg border-l border-gray-200">{(revenue.reduce((sum, r) => sum + getPriorCr(r), 0) - costOfSales.reduce((sum, r) => sum + getPriorDr(r), 0) - expenses.reduce((sum, r) => sum + getPriorDr(r), 0)).toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}

                    {viewMode === 'annual' && (
                    <div className="print-section">
                        {/* Page 2: Balance Sheet */}
                        <div className={`${activeTab === 'bs' ? 'block' : 'hidden print:block'}`}>
                            <div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">
                                <div className="flex justify-between items-start mb-8">
                                    <div><h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{companyNameKh}</h1><h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2 px-1">{companyNameEn}</h2></div>
                                    <div className="text-right flex flex-col items-end gap-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Detail</div><h3 className="text-xl font-bold text-black uppercase tracking-widest mt-1">របាយការណ៍ស្ថានភាពហិរញ្ញវត្ថុ / STATEMENT OF FINANCIAL POSITION</h3><div className="text-sm font-bold text-black mt-1">As at 31 December {new Date().getFullYear()}</div><div className="text-sm font-bold text-black">Reporting Currency: {inUSD ? "USD" : "KHR"}</div></div>
                                </div>
                            </div>
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍ស្ថានភាពហិរញ្ញវត្ថុ / STATEMENT OF FINANCIAL POSITION</h3>
                                <p className="text-sm text-gray-500 italic">As at 31 December {new Date().getFullYear()}</p>
                            </div>
                            <div className="overflow-x-auto print-content-wrapper">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-gray-300">
                                            <th className="p-3 text-left font-bold text-gray-600 uppercase text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ / DESCRIPTION</th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-20" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាំ<br/>NOTE</th>
                                            <th className="p-3 text-center font-bold text-gray-800 uppercase text-xs w-48 bg-white border-l border-gray-200" style={{ borderTop: '4px solid #3B82F6', fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-blue-600 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear()} {inUSD ? 'USD' : 'KHR'}</span></th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-48 bg-slate-50 border-l border-gray-200" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-gray-500 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear() - 1} {inUSD ? 'USD' : 'KHR'}</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {renderSectionHeader("ទ្រព្យសកម្ម / ASSETS")}
                                        {assets.map(r => renderRow(r.description, getDr(r) - getCr(r), getPriorDr(r) - getPriorCr(r), false, true))}
                                        {renderRow("ទ្រព្យសកម្មសរុប / TOTAL ASSETS", totalAssets, assets.reduce((sum, r) => sum + (getPriorDr(r) - getPriorCr(r)), 0), true)}

                                        <tr className="h-6"></tr>

                                        {renderSectionHeader("មូលធន និង បំណុល / EQUITY & LIABILITIES")}

                                        {renderSectionHeader("មូលធន / EQUITY")}
                                        {equity.map(r => renderRow(r.description, getCr(r) - getDr(r), getPriorCr(r) - getPriorDr(r), false, true))}
                                        {renderRow("ប្រាក់ចំណេញបច្ចុប្បន្ន / CURRENT YEAR EARNINGS", netProfit, revenue.reduce((sum, r) => sum + getPriorCr(r), 0) - costOfSales.reduce((sum, r) => sum + getPriorDr(r), 0) - expenses.reduce((sum, r) => sum + getPriorDr(r), 0), false, true)} {/* Auto Inserted */}
                                        {renderRow("មូលធនសរុប / TOTAL EQUITY", totalEquity + netProfit, equity.reduce((sum, r) => sum + (getPriorCr(r) - getPriorDr(r)), 0) + (revenue.reduce((sum, r) => sum + getPriorCr(r), 0) - costOfSales.reduce((sum, r) => sum + getPriorDr(r), 0) - expenses.reduce((sum, r) => sum + getPriorDr(r), 0)), true)}

                                        {renderSectionHeader("បំណុល / LIABILITIES")}
                                        {liabilities.map(r => renderRow(r.description, getCr(r) - getDr(r), getPriorCr(r) - getPriorDr(r), false, true))}
                                        {renderRow("បំណុលសរុប / TOTAL LIABILITIES", totalLiabs, liabilities.reduce((sum, r) => sum + (getPriorCr(r) - getPriorDr(r)), 0), true)}

                                        <tr className="h-4"></tr>
                                        <tr className="border-t-4 border-gray-800 border-b-4 border-gray-800 bg-gray-50">
                                            <td className="p-4 font-bold text-lg uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មូលធន និង បំណុលសរុប / TOTAL EQUITY & LIABILITIES</td>
                                            <td className="p-4 text-center font-mono text-gray-500">-</td>
                                            <td className="p-4 text-right font-bold font-mono text-lg border-l border-gray-200">{(totalLiabs + totalEquity + netProfit).toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                            <td className="p-4 text-right font-bold font-mono text-lg border-l border-gray-200">
                                                {(
                                                    liabilities.reduce((sum, r) => sum + (getPriorCr(r) - getPriorDr(r)), 0) +
                                                    equity.reduce((sum, r) => sum + (getPriorCr(r) - getPriorDr(r)), 0) +
                                                    (revenue.reduce((sum, r) => sum + getPriorCr(r), 0) - costOfSales.reduce((sum, r) => sum + getPriorDr(r), 0) - expenses.reduce((sum, r) => sum + getPriorDr(r), 0))
                                                ).toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}

                    {viewMode === 'annual' && (
                    <div className="print-section">
                        {/* Page 3: Cash Flow */}
                        <div className={`${activeTab === 'cf' ? 'block' : 'hidden print:block'}`}>
                            <div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">
                                <div className="flex justify-between items-start mb-8">
                                    <div><h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{companyNameKh}</h1><h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2 px-1">{companyNameEn}</h2></div>
                                    <div className="text-right flex flex-col items-end gap-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Detail</div><h3 className="text-xl font-bold text-black uppercase tracking-widest mt-1">របាយការណ៍លំហូរសាច់ប្រាក់ / STATEMENT OF CASH FLOWS</h3><div className="text-sm font-bold text-black mt-1">For the year ended 31 December {new Date().getFullYear()}</div><div className="text-sm font-bold text-black">Reporting Currency: {inUSD ? "USD" : "KHR"}</div></div>
                                </div>
                            </div>
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍លំហូរសាច់ប្រាក់ / STATEMENT OF CASH FLOWS</h3>
                                <p className="text-sm text-gray-500 italic">For the year ended 31 December {new Date().getFullYear()}</p>
                            </div>
                            <div className="overflow-x-auto print-content-wrapper">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-gray-300">
                                            <th className="p-3 text-left font-bold text-gray-600 uppercase text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ / DESCRIPTION</th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-20" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាំ<br/>NOTE</th>
                                            <th className="p-3 text-center font-bold text-gray-800 uppercase text-xs w-48 bg-white border-l border-gray-200" style={{ borderTop: '4px solid #3B82F6', fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-blue-600 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear()} {inUSD ? 'USD' : 'KHR'}</span></th>
                                            <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-48 bg-slate-50 border-l border-gray-200" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្រាប់ឆ្នាំបញ្ជប់<br/>FOR THE YEAR ENDED<br/><span className="text-gray-500 text-[10px] uppercase font-mono mt-1 block">31-Dec-{new Date().getFullYear() - 1} {inUSD ? 'USD' : 'KHR'}</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {renderSectionHeader("លំហូរសាច់ប្រាក់ពីសកម្មភាពប្រតិបត្តិការ / CASH FLOWS FROM OPERATING ACTIVITIES")}
                                        {renderRow("ប្រាក់ចំណេញសុទ្ធមុនបង់ពន្ធ / NET PROFIT BEFORE TAX", netProfit, 0, true)}
                                        {renderRow("កែតម្រូវសម្រាប់ / ADJUSTMENTS FOR:", 0, 0, false, true)}
                                        {renderRow(" - រំលស់ទ្រព្យសកម្ម / DEPRECIATION AND AMORTIZATION", deprExp, 0, false, true)}
                                        {renderRow(" - ចំណូលការប្រាក់ / INTEREST INCOME", -intInc, 0, false, true)}
                                        {renderRow(" - ចំណាយការប្រាក់ / INTEREST EXPENSE", intExp, 0, false, true)}
                                        <tr className="h-2"></tr>
                                        {renderRow("បម្រែបម្រួលទុនបង្វិល / CHANGES IN WORKING CAPITAL:", 0, 0, false, true)}
                                        {renderRow(" - កើនឡើង ឬ ថយចុះនូវស្តុក / (INC)/DEC IN INVENTORIES", -inventory, 0, false, true)}
                                        {renderRow(" - កើនឡើង ឬ ថយចុះនូវប្រាក់ត្រូវទទួល / (INC)/DEC IN RECEIVABLES", -receivables, 0, false, true)}
                                        {renderRow(" - កើនឡើង ឬ ថយចុះនូវប្រាក់ត្រូវសង / INC/(DEC) IN PAYABLES", payables, 0, false, true)}
                                        <tr className="border-t border-gray-300"><td colSpan="4"></td></tr>
                                        {renderRow("សាច់ប្រាក់សុទ្ធពីសកម្មភាពប្រតិបត្តិ / NET CASH FROM OPERATING ACTIVITIES", netProfit + deprExp + intExp - intInc - inventory - receivables + payables, 0, true)}

                                        <tr className="h-6"></tr>

                                        {renderSectionHeader("លំហូរសាច់ប្រាក់ពីសកម្មភាពវិនិយោគ / CASH FLOWS FROM INVESTING ACTIVITIES")}
                                        {assets.filter(a => (a.description?.toLowerCase() || '').includes('fixed') || (a.description?.toLowerCase() || '').includes('equipment')).map(r =>
                                            renderRow(`PURCHASE OF ${r.description}`, -(getDr(r) - getCr(r)), 0, false, true)
                                        )}
                                        {renderRow("ការប្រាក់ទទួលបាន / INTEREST RECEIVED", intInc, 0, false, true)}
                                        <tr className="border-t border-gray-300"><td colSpan="4"></td></tr>
                                        {renderRow("សាច់ប្រាក់សុទ្ធពីសកម្មភាពវិនិយោគ / NET CASH USED IN INVESTING ACTIVITIES", assets.filter(a => (a.description?.toLowerCase() || '').includes('fixed') || (a.description?.toLowerCase() || '').includes('equipment')).reduce((sum, r) => sum - (getDr(r) - getCr(r)), 0) + intInc, 0, true)}

                                        <tr className="h-6"></tr>

                                        {renderSectionHeader("លំហូរសាច់ប្រាក់ពីសកម្មភាពហិរញ្ញប្បទាន / CASH FLOWS FROM FINANCING ACTIVITIES")}
                                        {equity.filter(e => (e.description?.toLowerCase() || '').includes('capital')).map(r =>
                                            renderRow(`ISSUANCE OF ${r.description}`, (getCr(r) - getDr(r)), 0, false, true)
                                        )}
                                        {renderRow("ភាគលាភបានបើក / DIVIDENDS PAID", 0, 0, false, true)}
                                        {renderRow("ការប្រាក់បានបង់ / INTEREST PAID", -intExp, 0, false, true)}
                                        <tr className="border-t border-gray-300"><td colSpan="4"></td></tr>
                                        {renderRow("សាច់ប្រាក់សុទ្ធពីសកម្មភាពហិរញ្ញប្បទាន / NET CASH USED IN FINANCING ACTIVITIES", equity.filter(e => (e.description?.toLowerCase() || '').includes('capital')).reduce((sum, r) => sum + (getCr(r) - getDr(r)), 0) - intExp, 0, true)}

                                        <tr className="h-8"></tr>
                                        <tr className="border-t-4 border-gray-800 border-b-4 border-gray-800 bg-gray-50">
                                            <td className="p-4 font-bold text-lg uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>កំណើនសាច់ប្រាក់សុទ្ធ / NET INCREASE IN CASH</td>
                                            <td className="p-4 text-center font-mono text-gray-500">-</td>
                                            <td className="p-4 text-right font-bold font-mono text-lg border-l border-gray-200">
                                                {(
                                                    netProfit +
                                                    assets.filter(a => (a.description?.toLowerCase() || '').includes('fixed') || (a.description?.toLowerCase() || '').includes('equipment')).reduce((sum, r) => sum - (getDr(r) - getCr(r)), 0) +
                                                    equity.filter(e => (e.description?.toLowerCase() || '').includes('capital')).reduce((sum, r) => sum + (getCr(r) - getDr(r)), 0)
                                                ).toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}
                                            </td>
                                            <td className="p-4 text-right border-l border-gray-200 text-gray-400 font-mono">-</td>
                                        </tr>
                                        {renderRow("សាច់ប្រាក់ដើមគ្រា / CASH AT BEGINNING OF YEAR", 0, 0, false, true)}
                                        {renderRow("សាច់ប្រាក់ចុងគ្រា / CASH AT END OF YEAR", (
                                            netProfit +
                                            assets.filter(a => (a.description?.toLowerCase() || '').includes('fixed') || (a.description?.toLowerCase() || '').includes('equipment')).reduce((sum, r) => sum - (getDr(r) - getCr(r)), 0) +
                                            equity.filter(e => (e.description?.toLowerCase() || '').includes('capital')).reduce((sum, r) => sum + (getCr(r) - getDr(r)), 0)
                                        ), 0, true)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}

                    {viewMode === 'annual' && (
                    <div className="print-section">
                        {/* Page 4: Statement of Changes in Equity */}
                        <div className={`${activeTab === 'sce' ? 'block' : 'hidden print:block'}`}>
                            <div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">
                                <div className="flex justify-between items-start mb-8">
                                    <div><h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{companyNameKh}</h1><h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2 px-1">{companyNameEn}</h2></div>
                                    <div className="text-right flex flex-col items-end gap-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Detail</div><h3 className="text-xl font-bold text-black uppercase tracking-widest mt-1">តារាងបម្រែបម្រួលមូលធន / STATEMENT OF CHANGES IN EQUITY</h3><div className="text-sm font-bold text-black mt-1">For the year ended 31 December {new Date().getFullYear()}</div><div className="text-sm font-bold text-black">Reporting Currency: {inUSD ? "USD" : "KHR"}</div></div>
                                </div>
                            </div>
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងបម្រែបម្រួលមូលធន / STATEMENT OF CHANGES IN EQUITY</h3>
                                <p className="text-sm text-gray-500 italic">For the year ended 31 December {new Date().getFullYear()}</p>
                            </div>
                            <div className="overflow-x-auto print-content-wrapper">
                                <table className="w-full text-sm border-collapse">
                                    <tbody>
                                        <tr className="bg-gray-50 font-bold border-b border-gray-300">
                                            <td className="p-3">Description</td>
                                            <td className="p-3 text-right">Owner Capital</td>
                                            <td className="p-3 text-right">Retained Earnings</td>
                                            <td className="p-3 text-right">Total Equity</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="p-3 pl-4">Opening Balance</td>
                                            <td className="p-3 text-right font-mono">{(equity.reduce((sum, e) => sum + (getPriorCr(e) - getPriorDr(e)), 0)).toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                            <td className="p-3 text-right font-mono">0</td>
                                            <td className="p-3 text-right font-mono">{(equity.reduce((sum, e) => sum + (getPriorCr(e) - getPriorDr(e)), 0)).toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="p-3 pl-4">Capital Injections / (Drawings)</td>
                                            <td className="p-3 text-right font-mono">{(equity.reduce((sum, e) => sum + (getCr(e) - getDr(e) - (getPriorCr(e) - getPriorDr(e))), 0)).toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                            <td className="p-3 text-right font-mono">-</td>
                                            <td className="p-3 text-right font-mono">{(equity.reduce((sum, e) => sum + (getCr(e) - getDr(e) - (getPriorCr(e) - getPriorDr(e))), 0)).toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="p-3 pl-4">Profit for the year</td>
                                            <td className="p-3 text-right font-mono">-</td>
                                            <td className="p-3 text-right font-mono">{netProfit.toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                            <td className="p-3 text-right font-mono">{netProfit.toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                        </tr>
                                        <tr className="h-4"></tr>
                                        <tr className="border-t-2 border-black border-b-2 border-double bg-gray-50 font-bold">
                                            <td className="p-3">Balance at 31 December {new Date().getFullYear()}</td>
                                            <td className="p-3 text-right font-mono">{totalEquity.toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                            <td className="p-3 text-right font-mono">{netProfit.toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                            <td className="p-3 text-right font-mono">{(totalEquity + netProfit).toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    )}

                    {viewMode === 'annual' && (
                    <div className="print-section">
                        {/* Page 5: Notes */}
                        <div className={`${activeTab === 'notes' ? 'block' : 'hidden print:block'}`}>
                            <div className="hidden print:block pb-6 mb-8 border-b-2 border-black mt-2">
                                <div className="flex justify-between items-start mb-8">
                                    <div><h1 className="text-3xl font-bold text-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{companyNameKh}</h1><h2 className="text-xl font-bold text-black uppercase tracking-widest mt-2 px-1">{companyNameEn}</h2></div>
                                    <div className="text-right flex flex-col items-end gap-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Detail</div><h3 className="text-xl font-bold text-black uppercase tracking-widest mt-1">កំណត់សម្គាល់លើរបាយការណ៍ហិរញ្ញវត្ថុ / NOTES TO THE FINANCIAL STATEMENTS</h3><div className="text-sm font-bold text-black mt-1">For the year ended 31 December {new Date().getFullYear()}</div><div className="text-sm font-bold text-black">Reporting Currency: {inUSD ? "USD" : "KHR"}</div></div>
                                </div>
                            </div>
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>កំណត់សម្គាល់លើរបាយការណ៍ហិរញ្ញវត្ថុ / NOTES TO THE FINANCIAL STATEMENTS</h3>
                                <p className="text-sm text-gray-500 italic">For the year ended 31 December {new Date().getFullYear()}</p>
                            </div>
                            <div className="overflow-x-auto print-content-wrapper">
                                <div className="p-6 font-sans w-full block">
                                                <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">1. BASIS OF PREPARATION</h4>
                                                <p className="text-gray-700 leading-relaxed mb-6">These financial statements have been prepared in accordance with the Cambodian International Financial Reporting Standards (CIFRS) and CIFRS for SMEs, as directed by the Accounting and Auditing Regulator (ACAR). The financial statements have been prepared under the historical cost convention, modified by the revaluation of certain financial instruments.</p>

                                                <h4 className="font-bold text-gray-900 border-b pb-2 mb-4">2. SIGNIFICANT ACCOUNTING POLICIES</h4>
                                                <div className="space-y-4 text-gray-700">
                                                    <p><strong>Revenue Recognition:</strong> Revenue from technology consulting and factory projects is recognized when control of goods or services is transferred to the customer across specified project milestones.</p>
                                                    <p><strong>Property, Plant, and Equipment:</strong> PPE is stated at cost less accumulated depreciation. Depreciation for technology equipment (e.g., Computers) and fleet vehicles (e.g., Automobiles) is calculated on a straight-line basis using rates strictly adhering to GDT tax depreciation schedules.</p>
                                                    <p><strong>Foreign Currencies:</strong> The functional and presentation currency is the Cambodian Riel (KHR) as per ACAR legal requirements. Transactions in foreign currencies are translated into the functional currency using the exchange rates prevailing at the dates of the transactions.</p>
                                                </div>

                                                <h4 className="font-bold text-gray-900 border-b pb-2 mb-4 mt-8">3. CRITICAL ACCOUNTING ESTIMATES AND JUDGEMENTS</h4>
                                                <p className="text-gray-700 leading-relaxed">The preparation of financial statements requires the use of certain critical accounting estimates. It also requires management to exercise its judgement in the process of applying the entity's accounting policies. Related Party Transactions or special itemized expenses are explicitly reconciled with physical bank statements and invoices.</p>
                                            </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {viewMode === 'monthly' && (
                        <div className="print-section">
                            <div className="text-center mb-8 print:hidden">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest mb-2">{companyNameEn}</h2>
                                <h3 className="text-lg font-bold text-gray-600 mb-1 leading-tight uppercase font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                    {activeTab === 'pl' ? 'របាយការណ៍លទ្ធផលបំបែកប្រចាំខែ / MONTHLY INCOME STATEMENT' : 'របាយការណ៍ស្ថានភាពហិរញ្ញវត្ថុ / STATEMENT OF FINANCIAL POSITION'}
                                </h3>
                            </div>
                            <div className="overflow-x-auto print-content-wrapper">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-300">
                                            <th className="p-2 text-left bg-gray-50 sticky left-0 z-10 border-r border-gray-200">Account</th>
                                            {MONTHS.map(m => <th key={m} className="p-2 text-right min-w-[100px] text-gray-600 font-sans font-medium">{m}</th>)}
                                            <th className="p-2 text-right min-w-[120px] font-bold bg-gray-50 border-l border-gray-200">TOTAL</th>
                                        </tr>
                                    </thead>
                                    {activeTab === 'pl' && (
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
                                    {activeTab === 'bs' && (
                                        <tbody>
                                            {renderSectionHeader("ASSETS", true)}
                                            {mAssets.map(r => renderMonthRow(r.description, r.months, false, true))}
                                            {renderMonthRow("Total Assets", mTotalAssets, true)}
                                            <tr className="h-6"></tr>
                                            {renderSectionHeader("EQUITY & LIABILITIES", true)}
                                            {renderSectionHeader("Equity", true)}
                                            {mEquity.map(r => renderMonthRow(r.description, r.months, false, true))}
                                            {renderMonthRow("Current Year Earnings", mNetProfit, false, true)}
                                            {renderMonthRow("Total Equity", mTotalEquity.map((v, i) => v + mNetProfit[i]), true)}
                                            {renderSectionHeader("Liabilities", true)}
                                            {mLiabs.map(r => renderMonthRow(r.description, r.months, false, true))}
                                            {renderMonthRow("Total Liabilities", mTotalLiabs, true)}
                                            <tr className="h-4"></tr>
                                            {renderMonthRow("TOTAL EQUITY & LIABILITIES", mTotalLiabs.map((v, i) => v + mTotalEquity[i] + mNetProfit[i]), true)}
                                        </tbody>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}
                    
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
