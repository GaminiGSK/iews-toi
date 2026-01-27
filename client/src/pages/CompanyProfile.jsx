import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Loader2, CheckCircle, Table, Save, X, Eye, FileText, CloudUpload,
    LayoutDashboard, PieChart, Users, Receipt, RefreshCw, BarChart3,
    FileSpreadsheet, Landmark, ChevronRight, Calculator, Shield,
    ShieldCheck, TrendingUp, Scale, Tag, DollarSign, LogOut, BookOpen
} from 'lucide-react';
import DigitalCertificate from '../components/DigitalCertificate';

export default function CompanyProfile() {
    const [view, setView] = useState('home'); // home, profile, bank
    const [subView, setSubView] = useState('dashboard'); // dashboard, income, expenses, etc.
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingBank, setUploadingBank] = useState(false);
    const [savingBank, setSavingBank] = useState(false);

    // Bank Data State
    const [bankFiles, setBankFiles] = useState([]);
    const [activeFileIndex, setActiveFileIndex] = useState(0);

    const [formData, setFormData] = useState({
        companyNameKh: '',
        companyNameEn: '',
        companyCode: ''
    });

    const handleSaveTransactions = async () => {
        // Only save transactions that haven't been saved yet (no _id)
        const newTransactions = (bankFiles || [])
            .flatMap(f => f.transactions || [])
            .filter(tx => !tx._id);

        if (newTransactions.length === 0) {
            setMessage('All transactions are already saved through v3.4 History Sync.');
            return;
        }

        setSavingBank(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/save-transactions', { transactions: newTransactions }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setMessage(`Successfully saved ${newTransactions.length} new transactions! (v3.4 SYNCED)`);

            // Refresh Profile & History to get the new _ids and group efficiently
            setTimeout(() => {
                fetchProfile();
                setMessage('');
            }, 2000);

        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message || 'Error saving transactions.';
            setMessage(errMsg);
        } finally {
            setSavingBank(false);
        }
    };

    // Fetch existing profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data) {
                setFormData(prev => ({ ...prev, ...res.data }));
            }

            // Also Fetch Saved Transactions
            try {
                const txRes = await axios.get('/api/company/transactions', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const allTxs = txRes.data.transactions || [];
                if (allTxs.length > 0) {
                    // Group by Month (YYYY-MM)
                    const groups = {};
                    allTxs.forEach(tx => {
                        const dateObj = new Date(tx.date);
                        const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(tx);
                    });

                    // Convert to Virtual Files
                    const historyFiles = Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(key => {
                        const [year, month] = key.split('-');
                        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
                        const groupTxs = groups[key];

                        // Calculate Date Range
                        const dates = groupTxs.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);
                        const start = new Date(dates[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                        const end = new Date(dates[dates.length - 1]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                        return {
                            originalName: `Saved History: ${monthName} ${year}`,
                            dateRange: `${start} - ${end}`,
                            status: 'Saved',
                            transactions: groupTxs
                        };
                    });

                    setBankFiles(historyFiles);
                }

            } catch (txErr) {
                console.error("Error fetching history:", txErr);
                // Don't block profile load
            }

        } catch (err) {
            console.log("No existing profile found or error fetching.");
        }
    };

    // --- Sub-Components ---

    const renderHome = () => {
        const cards = [
            {
                id: 'iews',
                title: 'IEWS',
                desc: 'Enterprise Work System. Manage workflow packages.',
                icon: Shield,
                color: 'blue',
                badge: 'NEW'
            },
            {
                id: 'bank',
                title: 'Bank Statements',
                desc: 'Upload monthly statements, parse transactions via AI, and sync data.',
                icon: PieChart,
                color: 'green'
            },
            {
                id: 'ledger',
                title: 'General Ledger',
                desc: 'View chronological financial history of all audited transactions.',
                icon: BookOpen,
                color: 'purple'
            },
            {
                id: 'trial',
                title: 'Trial Balance',
                desc: 'View Unadjusted & Adjusted Trial Balance reports.',
                icon: Scale,
                color: 'cyan'
            },
            {
                id: 'financial',
                title: 'Financial Stmts',
                desc: 'Generate final audited reports (Income, Balance Sheet, Cash Flow).',
                icon: TrendingUp,
                color: 'indigo'
            },
            {
                id: 'toi',
                title: 'TOI & ACAR',
                desc: 'Live Tax Form, Tax on Income & ACAR Compliance.',
                icon: ShieldCheck,
                color: 'red'
            },
            {
                id: 'profile',
                title: 'Company Profile',
                desc: 'Update official registration details, MOC certificates, and shareholders.',
                icon: FileText,
                color: 'blue'
            },
            {
                id: 'codes',
                title: 'Accounting Codes',
                desc: 'Manage Chart of Accounts codes and standard descriptions.',
                icon: Tag,
                color: 'orange'
            },
            {
                id: 'currency',
                title: 'Currency Exchange',
                desc: 'Set Annual Exchange Rates (USD to KHR) for compliance.',
                icon: DollarSign,
                color: 'teal'
            },
        ];

        return (
            <div className="min-h-screen bg-[#0f172a] text-white animate-fade-in overflow-x-hidden">
                {/* TOP HEADER */}
                <header className="px-8 py-4 border-b border-gray-800/50 flex items-center justify-between backdrop-blur-md sticky top-0 z-[100] bg-[#0f172a]/80">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/40">
                            <Users size={18} className="text-white" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight">GK SMART <span className="text-gray-500 font-normal">& Ai</span></h1>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-8 py-16">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">Welcome, <span className="text-white">{formData.companyNameEn || 'GK SMART'}</span></h2>
                            <div className="flex items-center flex-wrap gap-3">
                                <p className="text-gray-400 text-lg">Manage your entity and financial data with AI precision.</p>
                                <span className="bg-gray-800/80 text-[10px] font-bold text-gray-400 px-2 py-0.5 rounded ring-1 ring-gray-700/50 backdrop-blur-sm">v2.3 Night</span>
                            </div>
                        </div>
                        <button className="self-start md:self-center flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-800 bg-[#1e293b]/50 text-red-500/90 font-bold text-sm hover:bg-red-500/10 transition-all active:scale-95 shadow-lg">
                            Log Out
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {cards.map((card) => {
                            const Icon = card.icon;
                            const colors = {
                                blue: 'from-blue-600/15 hover:border-blue-500/40 icon:bg-blue-500/20 text:text-blue-400',
                                green: 'from-green-600/15 hover:border-green-500/40 icon:bg-green-500/20 text:text-green-400',
                                purple: 'from-purple-600/15 hover:border-purple-500/40 icon:bg-purple-500/20 text:text-purple-400',
                                cyan: 'from-cyan-600/15 hover:border-cyan-500/40 icon:bg-cyan-500/20 text:text-cyan-400',
                                indigo: 'from-indigo-600/15 hover:border-indigo-500/40 icon:bg-indigo-500/20 text:text-indigo-400',
                                red: 'from-red-600/15 hover:border-red-500/40 icon:bg-red-500/20 text:text-red-400',
                                orange: 'from-orange-600/15 hover:border-orange-500/40 icon:bg-orange-500/20 text:text-orange-400',
                                teal: 'from-teal-600/15 hover:border-teal-500/40 icon:bg-teal-500/20 text:text-teal-400',
                            };

                            const theme = colors[card.color] || colors.blue;
                            const [glowBase, borderHover, iconBg, iconText] = theme.split(' ');

                            return (
                                <div
                                    key={card.id}
                                    onClick={() => {
                                        if (card.id === 'bank' || card.id === 'iews') setView('bank');
                                        else if (card.id === 'profile') setView('profile');
                                    }}
                                    className={`group relative bg-[#1e293b]/30 border border-gray-800/50 p-8 rounded-[2rem] cursor-pointer transition-all duration-500 hover:scale-[1.02] ${borderHover} overflow-hidden flex flex-col h-[280px] hover:shadow-2xl hover:shadow-black/50`}
                                >
                                    {/* Glassmorphic Gradient Glow */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${glowBase} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>

                                    {/* Badge */}
                                    {card.badge && (
                                        <div className="absolute top-6 right-6 z-20">
                                            <span className="bg-blue-600 text-[10px] font-bold px-3 py-1 rounded-full text-white shadow-lg shadow-blue-900/50 ring-1 ring-blue-400/40 animate-pulse">
                                                {card.badge}
                                            </span>
                                        </div>
                                    )}

                                    {/* Icon Container */}
                                    <div className={`w-14 h-14 rounded-2xl ${iconBg.split(':')[1]} border border-gray-700/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 relative z-10 shadow-inner`}>
                                        <Icon className={`${iconText.split(':')[1]} w-7 h-7`} />
                                    </div>

                                    {/* Text Content */}
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold mb-3 tracking-tight group-hover:text-white transition-colors duration-300">
                                            {card.title}
                                        </h3>
                                        <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                            {card.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        );
    };


    const renderProfile = () => {
        // Mode 1: No file uploaded yet (Show Upload Box)
        if (!formData.registrationFile && !formData.companyNameEn) {
            return (
                <div className="max-w-3xl mx-auto pt-10 px-6 animate-fade-in">
                    <button onClick={() => setView('home')} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center text-sm font-medium transition">
                        ← Back to Dashboard
                    </button>
                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Company Registration</h2>
                        <p className="text-gray-500 mb-8">Upload your MOC Certificate to auto-fill details.</p>

                        <div className="border-2 border-dashed border-blue-100 rounded-xl p-10 hover:bg-blue-50/50 transition relative group cursor-pointer">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={async (e) => {
                                    if (e.target.files?.[0]) {
                                        setLoading(true);
                                        setMessage("Scanning Document with AI...");
                                        try {
                                            const file = e.target.files[0];
                                            const fd = new FormData();
                                            fd.append('file', file);

                                            const token = localStorage.getItem('token');
                                            const res = await axios.post('/api/company/upload-registration', fd, {
                                                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                                            });

                                            // Auto-fill form
                                            setFormData(prev => ({
                                                ...prev,
                                                ...res.data.data,
                                                registrationFile: URL.createObjectURL(file) // Preview
                                            }));
                                            setMessage("Data Extracted! Please verify.");
                                        } catch (err) {
                                            console.error(err);
                                            setMessage("Error scanning document.");
                                        } finally {
                                            setLoading(false);
                                        }
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                                <CloudUpload size={32} />
                            </div>
                            <h3 className="font-bold text-gray-700">Upload MOC Certificate</h3>
                            <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, PDF</p>
                        </div>
                    </div>
                    {loading && (
                        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center">
                                <Loader2 className="animate-spin text-blue-600 h-8 w-8 mb-3" />
                                <p className="font-bold text-gray-800">Analyzing Document...</p>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Mode 2: File Uploaded (Split Screen: Image Left | Form Right)
        return (
            <div className="w-full h-[calc(100vh-80px)] pt-4 px-4 flex gap-6 animate-fade-in">

                {/* LEFT COLUMN: DOCUMENT VIEWER */}
                <div className="w-1/2 bg-gray-900 rounded-2xl overflow-hidden shadow-lg flex flex-col relative">
                    <div className="bg-gray-800 px-4 py-3 flex justify-between items-center z-10">
                        <span className="text-white text-xs font-bold flex items-center">
                            <FileText size={14} className="mr-2" /> Original Document
                        </span>
                        <button onClick={() => setFormData(prev => ({ ...prev, registrationFile: null }))} className="text-gray-400 hover:text-white text-xs underline">
                            Reset Image
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-900 p-4 relative">
                        {formData.registrationFile ? (
                            <img src={formData.registrationFile} alt="Certificate" className="max-w-full h-auto shadow-2xl rounded-lg" />
                        ) : (
                            <div className="text-center w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl hover:bg-gray-800/50 transition cursor-pointer relative group">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={async (e) => {
                                        if (e.target.files?.[0]) {
                                            setLoading(true);
                                            setMessage("Scanning Document...");
                                            try {
                                                const file = e.target.files[0];
                                                const fd = new FormData();
                                                fd.append('file', file);

                                                const token = localStorage.getItem('token');
                                                const res = await axios.post('/api/company/upload-registration', fd, {
                                                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                                                });

                                                // Update state but keep existing form data if user has edited it, or overwrite?
                                                // Let's overwrite fields that are found new, but keep others? 
                                                // Actually, usually we want to see the new data.
                                                setFormData(prev => ({
                                                    ...prev,
                                                    ...res.data.data, // Merge extracted details
                                                    registrationFile: URL.createObjectURL(file)
                                                }));
                                                setMessage("Document Analyzed.");
                                            } catch (err) {
                                                console.error(err);
                                                setMessage("Error uploading.");
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <CloudUpload size={48} className="text-gray-600 mb-4 group-hover:text-blue-400 transition" />
                                <p className="text-gray-400 font-medium group-hover:text-white">Upload Certificate</p>
                                <p className="text-gray-600 text-xs mt-2">to view side-by-side</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: DIGITAL CERTIFICATE TWIN */}
                <div className="w-1/2 flex flex-col h-full">
                    <div className="bg-white rounded-t-2xl p-4 border-b border-gray-100 flex justify-between items-center shadow-sm z-10 shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                <span className="w-2 h-6 bg-[#b8860b] mr-2 rounded-sm"></span>
                                Digital Certificate Twin
                            </h2>
                            <p className="text-xs text-gray-400 pl-4">Review and edit directly on the certificate</p>
                        </div>
                        <button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const token = localStorage.getItem('token');
                                    await axios.post('/api/company/update-profile', formData, {
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    setMessage("Profile Verified & Saved!");
                                    setTimeout(() => setView('home'), 1500);
                                } catch (err) {
                                    setMessage("Error saving profile.");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="bg-[#1a365d] hover:bg-[#2c5282] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition flex items-center"
                        >
                            <CheckCircle size={16} className="mr-2" /> Verify & Save
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-100 p-6 flex justify-center">
                        <div className="transform scale-90 origin-top">
                            <DigitalCertificate
                                data={formData}
                                onUpdate={(field, val) => setFormData(prev => ({ ...prev, [field]: val }))}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleFiles = async (fileList) => {
        if (fileList.length === 0) return;

        setMessage(`Processing ${fileList.length} files...`);
        setUploadingBank(true);

        const formData = new FormData();
        fileList.forEach(file => formData.append('files', file));

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/upload-bank-statement', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            let safeFiles = res.data.files || [];
            if (!Array.isArray(safeFiles)) safeFiles = [];

            setBankFiles(prev => {
                const combined = [...prev, ...safeFiles];
                return combined.sort((a, b) => {
                    const dateA = a.transactions?.[0]?.date ? new Date(a.transactions[0].date) : new Date(0);
                    const dateB = b.transactions?.[0]?.date ? new Date(b.transactions[0].date) : new Date(0);
                    return dateA - dateB;
                });
            });

            // Set active file to the first new file if there are new files
            if (safeFiles.length > 0) {
                setActiveFileIndex(bankFiles.length); // Index of the first newly added file
            }

            const newCount = safeFiles.reduce((acc, f) => acc + (f.transactions?.length || 0), 0);
            setMessage(`Success! Appended ${newCount} transactions from ${safeFiles.length} new files.`);

        } catch (err) {
            setMessage('Error processing files.');
            console.error(err);
        } finally {
            setUploadingBank(false);
        }
    };

    const handleDelete = async (idx, file) => {
        const isSaved = file.transactions?.some(t => t._id);
        if (!window.confirm(`Delete ${isSaved ? 'SAVED' : 'this'} file?`)) return;

        if (isSaved) {
            // Delete from DB
            const ids = file.transactions.filter(t => t._id).map(t => t._id);
            try {
                const token = localStorage.getItem('token');
                await axios.delete('/api/company/transactions', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    data: { transactionIds: ids }
                });
                // Force Reload
                await fetchProfile();
                setMessage('Deleted saved transactions.');
            } catch (err) {
                console.error(err);
                alert("Error deleting: " + (err.response?.data?.message || err.message));
            }
        } else {
            // Delete Unsaved
            setBankFiles(prev => prev.filter((_, i) => i !== idx));
            if (activeFileIndex === idx) setActiveFileIndex(0);
        }
    };

    const renderFinancialDashboard = () => {
        const navItems = [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'income', label: 'Income', icon: PieChart },
            { id: 'expenses', label: 'Expenses', icon: Receipt },
            { id: 'customer', label: 'Customer', icon: Users },
            { id: 'invoice', label: 'Invoice', icon: FileSpreadsheet },
            { divider: true },
            { id: 'auto-reporting', label: 'Auto Reporting', icon: RefreshCw },
            { id: 'financial-reports', label: 'Financial Reports', icon: BarChart3 },
            { id: 'gdt-toi', label: 'GDT TOI Submission', icon: Landmark },
            { id: 'acar', label: 'ACAR Submission', icon: CloudUpload },
        ];

        return (
            <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
                {/* SIDEBAR */}
                <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <span className="text-orange-600 font-bold text-xl">🤓</span>
                            </div>
                            <div>
                                <h2 className="font-bold text-[#1e293b] leading-none">IEWS</h2>
                                <p className="text-[10px] text-red-500 font-bold">Your AI Accountant</p>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            {navItems.map((item, i) => {
                                if (item.divider) return <div key={i} className="my-4 border-t border-gray-100"></div>;
                                const Icon = item.icon;
                                const isActive = subView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setSubView(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-auto p-4">
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                            <p className="text-[10px] font-bold text-orange-600 mb-1">4,128 KHR / USD</p>
                            <p className="text-[10px] text-blue-800 font-medium">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <button className="text-[10px] text-blue-600 underline mt-2 block">Exchange Rate Table</button>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden text-gray-900">
                    {/* TOP HEADER */}
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
                        <div>
                            <h1 className="text-lg font-bold text-[#1e293b] capitalize">{subView.replace('-', ' ')}</h1>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                <button onClick={() => setView('home')} className="hover:text-blue-500">Home</button>
                                <ChevronRight size={10} />
                                <span className="capitalize">{subView.replace('-', ' ')}</span>
                            </div>
                        </div>
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border border-blue-200">
                            <Users size={16} />
                        </div>
                    </header>

                    {/* CONTENT SCROLL AREA */}
                    <div className="flex-1 overflow-auto p-8 bg-gray-50/50">
                        {subView === 'dashboard' && (
                            <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
                                <p className="text-gray-500 font-medium">You're logged in!</p>
                            </div>
                        )}

                        {subView === 'income' && (
                            <div className="flex flex-col h-full gap-6">
                                <div className="flex gap-6 h-[400px] shrink-0">
                                    {/* UPLOAD ZONE */}
                                    <div className="w-64 shrink-0">
                                        <div
                                            className="h-full bg-white border-2 border-dashed border-green-200 rounded-2xl p-4 text-center hover:border-green-400 hover:bg-green-50/30 transition relative group flex flex-col items-center justify-center cursor-pointer shadow-sm"
                                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            onDrop={async (e) => {
                                                e.preventDefault(); e.stopPropagation();
                                                if (uploadingBank) return;
                                                const fileList = Array.from(e.dataTransfer.files);
                                                if (fileList.length > 0) handleFiles(fileList);
                                            }}
                                        >
                                            <input
                                                type="file" accept="image/*,.pdf" multiple
                                                onChange={(e) => { if (e.target.files?.length > 0) handleFiles(Array.from(e.target.files)); }}
                                                disabled={uploadingBank}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            {uploadingBank && (
                                                <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center backdrop-blur-md rounded-2xl">
                                                    <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
                                                    <p className="text-xs font-bold text-gray-700 animate-pulse">Analyzing...</p>
                                                </div>
                                            )}
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 mb-4">
                                                <CloudUpload size={24} />
                                            </div>
                                            <h3 className="font-bold text-gray-800 text-sm mb-2">Submit bank statement</h3>
                                            <p className="text-xs text-gray-400">Drag & drop or Click to Upload</p>
                                        </div>
                                    </div>

                                    {/* FILE LIST */}
                                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                                        <div className="p-4 bg-gray-50/50 border-b border-gray-100 font-bold text-gray-700 flex justify-between items-center">
                                            <span>Uploaded Files ({bankFiles.length})</span>
                                        </div>
                                        <div className="divide-y divide-gray-100 overflow-y-auto flex-1 p-2">
                                            {bankFiles.map((file, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setActiveFileIndex(idx)}
                                                    className={`p-3 mb-1 rounded-lg flex items-center justify-between transition cursor-pointer ${activeFileIndex === idx ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50 border border-transparent'}`}
                                                >
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <p className="font-bold text-gray-800 text-[11px] truncate">{file.originalName}</p>
                                                        <p className="text-[9px] text-gray-400 font-mono italic">{file.dateRange || 'Processing...'}</p>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(idx, file); }} className="p-1.5 rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 transition">
                                                            <X size={12} />
                                                        </button>
                                                        <button className={`p-1.5 rounded-full ${activeFileIndex === idx ? 'text-blue-600 bg-blue-100' : 'text-gray-300'}`}>
                                                            <Eye size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {bankFiles.length === 0 && <div className="text-center py-10 text-gray-300 text-xs italic">No files yet.</div>}
                                        </div>
                                        <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex gap-2">
                                            <button
                                                onClick={handleSaveTransactions}
                                                disabled={savingBank || bankFiles.length === 0}
                                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-300 flex items-center justify-center gap-2 shadow-sm text-xs"
                                            >
                                                {savingBank ? <Loader2 className="animate-spin h-3 w-3" /> : <Save size={14} />}
                                                {savingBank ? 'SAVING...' : 'SAVE ALL'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* TABLE AREA */}
                                <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                                                <Table size={18} />
                                            </div>
                                            <h3 className="font-bold text-gray-700 text-sm">Statement Transactions</h3>
                                        </div>
                                        <span className="text-[10px] bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">VERIFIED</span>
                                    </div>
                                    <div className="flex-1 overflow-auto">
                                        <table className="w-full text-left text-[11px]">
                                            <thead className="bg-[#f8fafc] text-gray-500 font-bold uppercase sticky top-0 z-10 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-3 w-[120px]">Date</th>
                                                    <th className="px-6 py-3">Description</th>
                                                    <th className="px-6 py-3 text-right">In</th>
                                                    <th className="px-6 py-3 text-right">Out</th>
                                                    <th className="px-6 py-3 text-right">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {(bankFiles[activeFileIndex]?.transactions || []).length === 0 ? (
                                                    <tr><td colSpan="5" className="text-center py-20 text-gray-300 italic">No data selected</td></tr>
                                                ) : (
                                                    (bankFiles[activeFileIndex]?.transactions || []).map((tx, idx) => (
                                                        <tr key={idx} className="hover:bg-blue-50/30 transition">
                                                            <td className="px-6 py-3 text-gray-500 font-medium">
                                                                {tx.date ? new Date(tx.date).toLocaleDateString('en-GB') : '-'}
                                                            </td>
                                                            <td className="px-6 py-3 text-gray-700 font-medium">{tx.description}</td>
                                                            <td className="px-6 py-3 text-right text-green-600 font-bold">
                                                                {tx.moneyIn > 0 ? parseFloat(tx.moneyIn).toLocaleString() : ''}
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-red-600 font-bold">
                                                                {tx.moneyOut > 0 ? parseFloat(tx.moneyOut).toLocaleString() : ''}
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-blue-900 font-bold">
                                                                {tx.balance ? parseFloat(String(tx.balance).replace(/[^0-9.-]+/g, "")).toLocaleString() : '-'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {subView !== 'dashboard' && subView !== 'income' && (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 grayscale pointer-events-none">
                                <Landmark size={80} className="mb-4 text-blue-900" />
                                <h2 className="text-2xl font-bold uppercase tracking-widest">{subView.replace('-', ' ')}</h2>
                                <p className="font-mono text-sm mt-2">v3.4 Standalone Module | Pending Setup</p>
                            </div>
                        )}
                    </div>
                </main>

                {message && (
                    <div className="fixed bottom-8 right-8 z-[100] animate-bounce-in">
                        <div className={`px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold text-sm ${message.includes('Error') ? 'bg-red-500 text-white' : 'bg-[#1e293b] text-white border border-blue-500/30'}`}>
                            {message.includes('Error') ? <X size={20} /> : <CheckCircle size={20} className="text-blue-400" />}
                            {message}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0f172a]">
            {view === 'home' && renderHome()}
            {view === 'profile' && renderProfile()}
            {view === 'bank' && renderFinancialDashboard()}
        </div>
    );
}
