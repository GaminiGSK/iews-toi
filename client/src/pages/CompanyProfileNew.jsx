import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle, Table, Save, X, Eye, FileText, CloudUpload, Calendar, Book, Tag, DollarSign, Scale, TrendingUp, ArrowLeft, ShieldCheck } from 'lucide-react';
import GeneralLedger from './GeneralLedger';
import AccountingCodes from './AccountingCodes';
import CurrencyExchange from './CurrencyExchange';
import TrialBalance from './TrialBalance';
import FinancialStatements from './FinancialStatements';
import ToiAcar from './ToiAcar';
import MOCCertificate from '../components/MOCCertificate';

export default function CompanyProfile() {
    const [view, setView] = useState('home'); // home, profile, bank
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingBank, setUploadingBank] = useState(false);
    const [savingBank, setSavingBank] = useState(false);

    // MOC Inspector State
    const [viewDoc, setViewDoc] = useState(null); // { docType, path, ... }
    const [regenerating, setRegenerating] = useState(false);

    // Helper: Parse Date (Handles DD/MM/YYYY and standard formats)
    const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0);
        // Try standard parsing
        let d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;

        // Try parsing DD/MM/YYYY
        if (typeof dateStr === 'string') {
            if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
                const [day, month, year] = dateStr.split('/');
                d = new Date(`${year}-${month}-${day}`);
                if (!isNaN(d.getTime())) return d;
            }
            // Try parsing YYYY-MM-DD
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                d = new Date(dateStr);
                if (!isNaN(d.getTime())) return d;
            }
            // Try parsing MMM DD YYYY (e.g. Jul 01 2025 or Jul 01, 2025)
            if (dateStr.match(/^[A-Za-z]{3}\s\d{1,2},?\s\d{4}/)) {
                d = new Date(dateStr.replace(',', '')); // Remove comma for reliable parsing
                if (!isNaN(d.getTime())) return d;
            }
            // Try parsing DD-MMM-YYYY (e.g. 01-Jul-2025)
            if (dateStr.match(/^\d{1,2}-[A-Za-z]{3}-\d{4}/)) {
                d = new Date(dateStr);
                if (!isNaN(d.getTime())) return d;
            }
        }
        return new Date(0); // Fallback
    };

    // Helper: Safe Date Formatting
    const formatDateSafe = (dateStr) => {
        if (!dateStr) return '-';
        const d = parseDate(dateStr); // Use the robust parser
        if (d.getTime() === 0 || isNaN(d.getTime())) return dateStr; // Fallback to raw string if still invalid
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Helper: Get Document URL (Local vs Drive)
    const getDocUrl = (doc) => {
        if (!doc?.path) return '';
        if (doc.path.startsWith('drive:')) {
            const id = doc.path.split(':')[1];
            // Pass token in query for access
            return `/api/company/files/${id}?token=${localStorage.getItem('token')}`;
        }
        // Fallback for legacy local files
        return '/' + doc.path.replace(/\\\\/g, '/');
    };

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
            .flatMap(f => (f.transactions || []).map(t => ({
                ...t,
                // CRITICAL: Preserve driveId from parent file if available
                driveId: f.driveId || t.driveId,
                // Also preserve path if available (backup)
                path: f.path || t.path
            })))
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

    // Fetch existing profile on mount (Protected Route Logic)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
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

            // --- FETCH BANK DATA (Files + Transactions) ---
            try {
                // 1. Get BankFile Registry
                const fileRes = await axios.get('/api/company/bank-files', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const registryFiles = fileRes.data.files || [];

                // 2. Get All Transactions
                const txRes = await axios.get('/api/company/transactions', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const allTxs = txRes.data.transactions || [];

                // 3. Map Transactions to Registry Files
                let usedTxIds = new Set();

                const mappedFiles = registryFiles.map(file => {
                    // Filter transactions that match this file's Drive ID
                    const fileTxs = allTxs.filter(tx =>
                        tx.originalData && tx.originalData.driveId === file.driveId
                    );

                    // Mark IDs as used
                    fileTxs.forEach(tx => usedTxIds.add(tx._id));

                    // Restore moneyIn/moneyOut for UI convenience
                    fileTxs.forEach(tx => {
                        const amount = parseFloat(tx.amount || 0);
                        tx.moneyIn = amount > 0 ? amount : 0;
                        tx.moneyOut = amount < 0 ? Math.abs(amount) : 0;
                    });

                    return {
                        ...file,
                        status: 'Saved', // It's from DB
                        transactions: fileTxs.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                    };
                });

                // 4. Handle Legacy/Orphan Transactions (No Registry File)
                // These are transactions that don't belong to any uploaded BankFile (legacy data)
                const orphans = allTxs.filter(tx => !usedTxIds.has(tx._id));

                if (orphans.length > 0) {
                    // Group orphans by Month (Legacy "Virtual Files")
                    const groups = {};
                    orphans.forEach(tx => {
                        const amount = parseFloat(tx.amount || 0);
                        tx.moneyIn = amount > 0 ? amount : 0;
                        tx.moneyOut = amount < 0 ? Math.abs(amount) : 0;

                        const dateObj = new Date(tx.date);
                        const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(tx);
                    });

                    const virtualFiles = Object.keys(groups).sort((a, b) => a.localeCompare(b)).map(key => {
                        const [year, month] = key.split('-');
                        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
                        const groupTxs = groups[key].sort((a, b) => new Date(a.date) - new Date(b.date));

                        // Date Range
                        const dates = groupTxs.map(t => new Date(t.date).getTime());
                        const start = new Date(Math.min(...dates)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                        const end = new Date(Math.max(...dates)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                        return {
                            originalName: `Saved History: ${monthName} ${year}`,
                            dateRange: `${start} - ${end}`,
                            status: 'Saved',
                            transactions: groupTxs,
                            path: null, // No real file
                            isVirtual: true, // Flag for UI distinctions
                            _id: 'virtual-' + key // Temporary ID
                        };
                    });

                    mappedFiles.push(...virtualFiles);
                }

                setBankFiles(mappedFiles);

            } catch (txErr) {
                console.error("Error fetching bank data:", txErr);
            }

        } catch (err) {
            console.log("No existing profile found or error fetching.");
            if (err.response && err.response.status === 401) {
                // Token invalid/expired
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
    };

    // --- Sub-Components ---

    const renderHome = () => (
        <div className="max-w-6xl mx-auto pt-12 px-6 animate-fade-in relative z-10">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-0 w-full h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none -z-10" />

            <div className="flex items-center gap-12 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
                        Welcome, {formData.companyNameEn || formData.companyCode || 'Admin'}
                    </h1>
                    <p className="text-gray-400 text-lg">Manage your entity and financial data with AI precision. <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded ml-2 border border-white/10">v2.3 Night</span></p>
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }}
                    className="text-sm text-red-400 hover:text-red-300 font-medium hover:bg-red-500/10 px-6 py-3 rounded-lg transition border border-red-500/20 hover:border-red-500/40 shrink-0"
                >
                    Log Out
                </button>
            </div>

            {/* Main Grid Layout - Sleek Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* --- ROW 1: CORE OPERATIONS & COMPLIANCE --- */}

                {/* 1. Bank Statements */}
                <div onClick={() => setView('bank')} className="group relative bg-slate-800/50 hover:bg-slate-800/80 border border-white/5 hover:border-green-500/50 backdrop-blur-xl p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden shadow-xl hover:shadow-green-900/20">
                    <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300 border border-green-500/20">
                        <Table className="text-green-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-300 transition-colors">Bank Statements</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">Upload monthly statements, parse transactions via AI, and sync data.</p>
                </div>

                {/* 2. General Ledger */}
                <div onClick={() => setView('ledger')} className="group relative bg-slate-800/50 hover:bg-slate-800/80 border border-white/5 hover:border-purple-500/50 backdrop-blur-xl p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden shadow-xl hover:shadow-purple-900/20">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300 border border-purple-500/20">
                        <Book className="text-purple-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">General Ledger</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">View chronological financial history of all audited transactions.</p>
                </div>

                {/* 3. Financial Statements (Standard Card) */}
                <div onClick={() => setView('financials')} className="group relative bg-slate-800/50 hover:bg-slate-800/80 border border-white/5 hover:border-indigo-500/50 backdrop-blur-xl p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden shadow-xl hover:shadow-indigo-900/20">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300 border border-indigo-500/20">
                        <TrendingUp className="text-indigo-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">Financial Stmts</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">Generate final audited reports (Income, Balance Sheet, Cash Flow).</p>
                </div>

                {/* 4. TOI & ACAR (New Topic) */}
                <div onClick={() => setView('toi_acar')} className="group relative bg-slate-800/50 hover:bg-slate-800/80 border border-white/5 hover:border-rose-500/50 backdrop-blur-xl p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden shadow-xl hover:shadow-rose-900/20">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300 border border-rose-500/20">
                        <ShieldCheck className="text-rose-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-rose-300 transition-colors">TOI & ACAR</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">Tax on Income & ACAR Compliance reporting and auditing tools.</p>
                </div>

                {/* --- ROW 2: REPORTS & SETTINGS --- */}

                {/* 5. Trial Balance (Moved to Row 2) */}
                <div onClick={() => setView('report')} className="group relative bg-slate-800/50 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/50 backdrop-blur-xl p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden shadow-xl hover:shadow-cyan-900/20">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300 border border-cyan-500/20">
                        <Scale className="text-cyan-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">Trial Balance</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">View Unadjusted & Adjusted Trial Balance reports.</p>
                </div>

                {/* 6. Company Profile */}
                <div onClick={() => setView('profile')} className="group relative bg-slate-800/50 hover:bg-slate-800/80 border border-white/5 hover:border-blue-500/50 backdrop-blur-xl p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden shadow-xl hover:shadow-blue-900/20">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300 border border-blue-500/20">
                        <FileText className="text-blue-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">Company Profile</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">Update official registration details, MOC certificates, and shareholders.</p>
                </div>

                {/* 7. Accounting Codes */}
                <div onClick={() => setView('codes')} className="group relative bg-slate-800/50 hover:bg-slate-800/80 border border-white/5 hover:border-orange-500/50 backdrop-blur-xl p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden shadow-xl hover:shadow-orange-900/20">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300 border border-orange-500/20">
                        <Tag className="text-orange-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-300 transition-colors">Accounting Codes</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">Manage Chart of Accounts codes and standard descriptions.</p>
                </div>

                {/* 8. Currency Exchange */}
                <div onClick={() => setView('currency')} className="group relative bg-slate-800/50 hover:bg-slate-800/80 border border-white/5 hover:border-teal-500/50 backdrop-blur-xl p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden shadow-xl hover:shadow-teal-900/20">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300 border border-teal-500/20">
                        <DollarSign className="text-teal-400 w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">Currency Exchange</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">Set Annual Exchange Rates (USD to KHR) for compliance.</p>
                </div>

            </div>
        </div>
    );

    // --- Profile UI Logic (v2.0 Redesign) ---
    const DOC_TYPES = [
        { id: 'moc_cert', label: '1. MOC Certificate', icon: FileText, color: 'blue' },
        { id: 'kh_extract', label: '2. Business Extract (KH)', icon: FileText, color: 'indigo' },
        { id: 'en_extract', label: '3. Business Extract (EN)', icon: FileText, color: 'indigo' },
        { id: 'tax_patent', label: '4. Tax Patent', icon: Table, color: 'green' },
        { id: 'tax_id', label: '5. VAT Certificate', icon: Table, color: 'green' },
        { id: 'bank_opening', label: '6. Bank Opening Letter', icon: FileText, color: 'purple' },
    ];

    const [uploadingDoc, setUploadingDoc] = useState(null);
    const [debugLog, setDebugLog] = useState(null); // New On-Screen Error Console

    const handleRegUpload = async (files, docType) => {
        if (files.length === 0) return;
        setUploadingDoc(docType);
        setMessage(`Analyzing ${docType.replace('_', ' ')}...`);

        const formData = new FormData();
        formData.append('file', files[0]);
        formData.append('docType', docType);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/upload-registration', formData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            setMessage('Document Verified & Data Extracted!');

            // Refresh Profile to see new data and doc status
            const profileRes = await axios.get('/api/company/profile', { headers: { 'Authorization': `Bearer ${token}` } });
            setFormData(prev => ({ ...prev, ...profileRes.data }));

        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message;
            if (errMsg === 'Token is not valid' || err.response?.status === 401) {
                alert('Session Expired. Please Login Again.');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            setMessage('Error: ' + errMsg);
            alert('Upload Failed: ' + errMsg);
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleClearDoc = async (docType) => {
        if (!window.confirm('Are you sure you want to clear this document?')) return;

        try {
            const token = localStorage.getItem('token');
            // Use URL Param for robustness
            await axios.delete(`/api/company/document/${docType}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // NUCLEAR OPTION: Force Reload to ensure state sync
            alert('Document cleared. Page will reload.');
            window.location.reload();

        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message;
            if (errMsg === 'Token is not valid' || err.response?.status === 401) {
                alert('Session Expired. Please Login Again.');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }

            // Show On-Screen Error
            setDebugLog({
                title: 'Clear Document Failed',
                message: errMsg,
                details: JSON.stringify(err.response?.data || {}, null, 2)
            });

        }
    };


    const renderProfile = () => (
        <div className="w-full h-[calc(100vh-80px)] pt-6 px-4 animate-fade-in flex flex-col">
            <div className="mb-4 flex items-center gap-4">
                <button
                    onClick={() => setView('home')}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition shrink-0 shadow-md"
                    title="Back to Dashboard"
                >
                    <ArrowLeft size={20} />
                </button>
                <span className="text-gray-500 text-sm font-medium">Back to Dashboard</span>
            </div>

            <div className="flex flex-1 gap-6 min-h-0">

                {/* COL 1: UPLOAD ZONES */}
                <div className="w-64 shrink-0 flex flex-col space-y-3 overflow-y-auto pr-1">
                    <h3 className="font-bold text-gray-700 mb-1">Documents Needed</h3>
                    {DOC_TYPES.map((doc) => (
                        <div
                            key={doc.id}
                            className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition group
                                ${uploadingDoc === doc.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}
                            `}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                                e.preventDefault(); e.stopPropagation();
                                if (!uploadingDoc) handleRegUpload(Array.from(e.dataTransfer.files), doc.id);
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={!!uploadingDoc}
                                onChange={(e) => {
                                    if (e.target.files?.length > 0) handleRegUpload(Array.from(e.target.files), doc.id);
                                }}
                            />

                            {uploadingDoc === doc.id ? (
                                <Loader2 className="animate-spin text-blue-600 mb-2" />
                            ) : (
                                <doc.icon size={24} className={`text-${doc.color}-500 mb-2 opacity-70 group-hover:scale-110 transition`} />
                            )}

                            <span className="text-xs font-bold text-gray-600">{doc.label}</span>
                            <span className="text-[10px] text-gray-400 mt-1">Drag or Click</span>
                        </div>
                    ))}
                </div>

                {/* COL 2: STATUS LIST */}
                <div className="w-72 shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700">
                        Document Status
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {DOC_TYPES.map(type => {
                            const uploaded = (formData.documents || []).find(d => d.docType === type.id);
                            const isVerified = uploaded?.status === 'Verified';

                            return (
                                <div
                                    key={type.id}
                                    className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm transition-all ${uploaded ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200' : ''}`}
                                    onClick={() => {
                                        // alert('Debug: Clicked Row. Uploaded: ' + (uploaded ? 'YES' : 'NO'));
                                        if (uploaded) setViewDoc(uploaded);
                                    }}
                                >
                                    <div className="flex items-center min-w-0">
                                        <div className={`w-2 h-2 rounded-full mr-2 ${isVerified ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <div className="flex flex-col truncate">
                                            <span className="text-xs font-bold text-gray-700 truncate">{type.label}</span>
                                            <span className="text-[10px] text-gray-400 truncate">
                                                {uploaded ? uploaded.originalName : 'Missing'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {/* VIEW BUTTON (Explicit Trigger) */}
                                        {uploaded && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setViewDoc(uploaded);
                                                }}
                                                className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition mr-1 flex items-center gap-1"
                                                title="View Document & Replica"
                                            >
                                                <Eye size={12} />
                                                <span className="text-[10px] font-bold">VIEW</span>
                                            </button>
                                        )}

                                        {isVerified && <CheckCircle size={14} className="text-green-500 shrink-0" />}

                                        {/* Clear Button */}
                                        {uploaded && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClearDoc(type.id);
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition z-10"
                                                title="Clear Document"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* COL 3: EXTRACTED DATA FORM */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700 flex justify-between items-center">
                        <span>Extracted Data</span>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Auto-Filled by AI</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Section 1: Identity */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center">
                                <FileText size={12} className="mr-1" /> Company Identity
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Company Name (KH)</label>
                                    <input value={formData.companyNameKh || ''} disabled className="w-full text-sm font-bold bg-gray-50 border-gray-200 rounded-md py-2 px-3" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Company Name (EN)</label>
                                    <input value={formData.companyNameEn || ''} disabled className="w-full text-sm font-bold bg-gray-50 border-gray-200 rounded-md py-2 px-3" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Registration ID</label>
                                    <input value={formData.registrationNumber || ''} disabled className="w-full text-sm font-mono bg-gray-50 border-gray-200 rounded-md py-2 px-3" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Incorporation Date</label>
                                    <input value={formData.incorporationDate || ''} disabled className="w-full text-sm font-mono bg-gray-50 border-gray-200 rounded-md py-2 px-3" />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 my-2" />

                        {/* Section 2: Tax & Location */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center">
                                <Table size={12} className="mr-1" /> Tax & Location
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">VAT TIN</label>
                                    <input value={formData.vatTin || ''} disabled className="w-full text-sm font-mono bg-yellow-50 border-yellow-100 text-yellow-800 rounded-md py-2 px-3" />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs text-gray-500">Registered Address</label>
                                    <textarea value={formData.address || ''} disabled rows={2} className="w-full text-sm bg-gray-50 border-gray-200 rounded-md py-2 px-3 resize-none" />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 my-2" />

                        {/* Section 3: Bank Info */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center">
                                <Table size={12} className="mr-1" /> Bank Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Bank Name</label>
                                    <input value={formData.bankName || ''} disabled className="w-full text-sm font-bold bg-gray-50 border-gray-200 rounded-md py-2 px-3" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Account Number</label>
                                    <input value={formData.bankAccountNumber || ''} disabled className="w-full text-sm font-mono bg-green-50 border-green-100 text-green-800 rounded-md py-2 px-3" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div >
    );

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

            // Set active file to the first new file if there are no files currently
            setBankFiles(prev => {
                const combined = [...prev, ...safeFiles];
                // Sort by date (oldest first)
                return combined.sort((a, b) => {
                    const dateA = a.transactions?.[0]?.date ? parseDate(a.transactions[0].date) : new Date(0);
                    const dateB = b.transactions?.[0]?.date ? parseDate(b.transactions[0].date) : new Date(0);
                    return dateA - dateB;
                });
            });

            // Auto-select first file if we had none
            if (bankFiles.length === 0 && safeFiles.length > 0) {
                setActiveFileIndex(0);
            }

            const newCount = safeFiles.reduce((acc, f) => acc + (f.transactions?.length || 0), 0);
            setMessage(`Success! Appended ${newCount} transactions from ${safeFiles.length} new files.`);

        } catch (err) {
            console.error("Bank Upload Error:", err);
            const errMsg = err.response?.data?.message || err.message;

            if (errMsg === 'Token is not valid' || err.response?.status === 401) {
                alert('Session Expired. Please Login Again.');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }

            setMessage('Error: ' + errMsg);

            // Show On-Screen Error
            setDebugLog({
                title: 'Bank Upload Failed',
                message: errMsg,
                details: JSON.stringify(err.response?.data || {}, null, 2)
            });

        } finally {
            setUploadingBank(false);
        }
    };

    // ==========================================
    // 🔒 PROTECTED CORE LOGIC - DO NOT MODIFY
    // The following `handleDelete` function is critical for data integrity.
    // It handles both database transactions and Google Drive file cleanup.
    // Lengthy comments removed for brevity but logic is preserved.
    // ==========================================
    const handleDelete = async (idx, file) => {
        // Robust check for saved status
        const isSaved = file.status === 'Saved' || (file.transactions && file.transactions.some(t => t._id));

        if (!window.confirm(`Delete ${isSaved ? 'PERMANENTLY' : 'this'} item?`)) return;

        if (isSaved) {
            try {
                const token = localStorage.getItem('token');

                // If it's a Bank Registry File (has _id), use the new delete-bank-file API
                if (file._id && !file.isVirtual) {
                    await axios.delete(`/api/company/bank-files/${file._id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } else {
                    // Fallback to legacy transaction deletion (for Virtual Files or unlinked transactions)
                    const ids = file.transactions ? file.transactions.map(t => t._id).filter(Boolean) : [];
                    if (ids.length > 0) {
                        await axios.post('/api/company/delete-transactions', {
                            transactionIds: ids
                        }, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    }
                }

                alert(`Document and transactions deleted. Page will reload.`);
                window.location.reload();

            } catch (err) {
                console.error('Delete API Error:', err);

                // If 404, it means they are already gone from DB. Just clean up UI.
                if (err.response && err.response.status === 404) {
                    console.warn("Transactions not found in DB, removing from UI only.");
                    setBankFiles(prev => prev.filter((_, i) => i !== idx));
                    if (activeFileIndex === idx) setActiveFileIndex(0);
                    return;
                }

                const errMsg = err.response?.data?.message || err.message;

                // Force Remove Option
                if (window.confirm(`Delete failed on server (${errMsg}). \n\nDo you want to FORCE REMOVE this item from your list anyway?`)) {
                    setBankFiles(prev => prev.filter((_, i) => i !== idx));
                    if (activeFileIndex === idx) setActiveFileIndex(0);
                    return;
                }

                if (errMsg === 'Token is not valid' || err.response?.status === 401) {
                    alert('Session Expired. Please Login Again.');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return;
                }

                // Show On-Screen Error
                setDebugLog({
                    title: 'Delete Failed',
                    message: errMsg,
                    details: JSON.stringify(err.response?.data || {}, null, 2)
                });
            }
        } else {
            // Delete Unsaved - No reload needed
            setBankFiles(prev => prev.filter((_, i) => i !== idx));
            if (activeFileIndex === idx) setActiveFileIndex(0);
        }
    };

    const renderBank = () => (
        <div className="w-full h-[calc(100vh-80px)] pt-6 px-4 animate-fade-in flex flex-col">
            <div className="mb-4 flex items-center gap-4">
                <button
                    onClick={() => setView('home')}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition shrink-0 shadow-md"
                    title="Back to Dashboard"
                >
                    <ArrowLeft size={20} />
                </button>
                <span className="text-gray-500 text-sm font-medium">Back to Dashboard</span>
            </div>

            <div className="flex flex-1 gap-6 min-h-0">

                {/* COLUMN 1: UPLOAD ZONE (Vertical) */}
                <div className="w-64 shrink-0 flex flex-col">
                    <div
                        className="flex-1 bg-white border-2 border-dashed border-green-200 rounded-2xl p-4 text-center hover:border-green-400 hover:bg-green-50/30 transition relative group flex flex-col items-center justify-center cursor-pointer"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (uploadingBank) return;
                            const fileList = Array.from(e.dataTransfer.files);
                            if (fileList.length === 0) return;
                            handleFiles(fileList);
                        }}
                    >
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            onChange={(e) => {
                                if (e.target.files?.length > 0) handleFiles(Array.from(e.target.files));
                            }}
                            disabled={uploadingBank}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        {uploadingBank && (
                            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center backdrop-blur-md rounded-2xl">
                                <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
                                <p className="text-xs font-bold text-gray-700 animate-pulse">Ai is Analyzing the statment...</p>
                            </div>
                        )}

                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 mb-4">
                            <CloudUpload size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm mb-2 leading-tight">
                            Submit your bank statement
                        </h3>
                        <p className="text-xs text-gray-400">
                            Drag & drop or Click to Upload
                        </p>
                    </div>
                </div>

                {/* COLUMN 2: FILE LIST */}
                <div className="w-80 shrink-0 flex flex-col space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 flex flex-col gap-3 shrink-0">
                            <div className="flex justify-between items-center">
                                <span>Uploaded Files ({bankFiles.length})</span>
                                {bankFiles.length > 0 && bankFiles.every(f => f.status === 'Saved') ? (
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded flex items-center gap-1">
                                        <CheckCircle size={10} /> All Saved
                                    </span>
                                ) : bankFiles.length > 0 ? (
                                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded flex items-center gap-1">
                                        <AlertCircle size={10} /> Pending Save
                                    </span>
                                ) : null}
                            </div>
                            {/* SAVE BUTTON MOVED TO TOP */}
                            {bankFiles.length > 0 && (
                                <button
                                    onClick={handleSaveTransactions}
                                    disabled={savingBank}
                                    className="w-full bg-black text-white px-3 py-2 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400 flex items-center justify-center gap-2 shadow-sm text-xs"
                                >
                                    {savingBank ? <Loader2 className="animate-spin h-3 w-3" /> : <Save size={14} />}
                                    {savingBank ? 'SAVING...' : 'SAVE ALL'}
                                </button>
                            )}
                        </div>
                        <div className="divide-y divide-gray-100 overflow-y-auto flex-1 p-2">
                            {bankFiles.map((file, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 mb-2 rounded-lg flex items-center justify-between transition cursor-pointer group ${activeFileIndex === idx ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                                    onClick={() => setActiveFileIndex(idx)}
                                >
                                    <div className="flex-1 min-w-0 mr-2">
                                        {/* Primary Title: Date Range */}
                                        <p className="font-bold text-gray-800 text-xs truncate mb-1">
                                            {file.transactions?.length > 0
                                                ? `${formatDateSafe(file.transactions[0].date)} - ${formatDateSafe(file.transactions[file.transactions.length - 1].date)}`
                                                : file.originalName}
                                        </p>

                                        {/* Metdata: Original Name + Count */}
                                        <div className="flex items-center text-[10px] text-gray-400 mt-0.5">
                                            <FileText size={10} className="mr-1 opacity-50" />
                                            <span className="truncate max-w-[120px] mr-2" title={file.originalName}>{file.originalName}</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="ml-2 font-mono">{(file.transactions || []).length} txs</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-1">
                                        {/* DELETE */}
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                handleDelete(idx, file);
                                            }}
                                            className="p-1.5 rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 transition"
                                        >
                                            <X size={14} />
                                        </button>
                                        {/* EYE */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveFileIndex(idx); }}
                                            className={`p-1.5 rounded-full transition ${activeFileIndex === idx ? 'text-blue-600 bg-blue-100' : 'text-gray-300 hover:text-blue-500'}`}
                                        >
                                            <Eye size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {bankFiles.length === 0 && (
                                <div className="text-center py-10 text-gray-300 text-xs italic">
                                    No files yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMN 3: DETAILS TABLE */}
                <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                <Table className="text-blue-500" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Page Details</h3>
                                <p className="text-xs text-gray-500">
                                    {bankFiles[activeFileIndex]?.transactions?.length > 0
                                        ? `${formatDateSafe(bankFiles[activeFileIndex].transactions[0].date)} - ${formatDateSafe(bankFiles[activeFileIndex].transactions[bankFiles[activeFileIndex].transactions.length - 1].date)}`
                                        : (bankFiles[activeFileIndex]?.dateRange || 'Select a file')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* NEW: View Original PDF Button */}
                            {(bankFiles[activeFileIndex]?.path?.startsWith('drive:') || bankFiles[activeFileIndex]?.driveId) && (
                                <a
                                    href={`${getDocUrl(bankFiles[activeFileIndex] || { path: 'drive:' + bankFiles[activeFileIndex].driveId })}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:text-blue-600 hover:border-blue-300 transition flex items-center gap-2 mr-2"
                                >
                                    <FileText size={12} />
                                    <span>View Original</span>
                                </a>
                            )}
                            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center">
                                <CheckCircle size={12} className="mr-1" /> Verified
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-white">
                        <table className="w-full text-left">
                            <thead className="bg-white text-gray-800 text-xs font-bold uppercase sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                                <tr>
                                    <th className="px-4 py-4 whitespace-nowrap w-[100px]">Date</th>
                                    <th className="px-4 py-4 w-[700px]">Transaction Details</th>
                                    <th className="px-4 py-4 text-right w-[110px]">Money In</th>
                                    <th className="px-4 py-4 text-right w-[110px]">Money Out</th>
                                    <th className="px-4 py-4 text-right w-[110px]">Balance</th>
                                    <th className="px-4 py-4 w-[80px]">Actions</th>
                                    <th className="px-4 py-4 w-full"></th> {/* SPACER */}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(bankFiles[activeFileIndex]?.transactions || []).length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10 text-gray-400">No transactions to display</td>
                                    </tr>
                                ) : (
                                    (bankFiles[activeFileIndex]?.transactions || []).map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition group">
                                            <td className="px-4 py-4 text-xs text-gray-600 font-bold whitespace-nowrap align-top">
                                                {formatDateSafe(tx?.date)}
                                            </td>
                                            <td className="px-4 py-4 text-xs text-gray-700 font-medium align-top">
                                                <div className="whitespace-pre-wrap leading-relaxed">
                                                    {tx?.description || ''}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-right font-medium text-green-600 align-top whitespace-nowrap">
                                                {tx?.moneyIn && parseFloat(tx.moneyIn) > 0 ? parseFloat(tx.moneyIn).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                                            </td>
                                            <td className="px-4 py-4 text-xs text-right font-medium text-red-600 align-top whitespace-nowrap">
                                                {tx?.moneyOut && parseFloat(tx.moneyOut) > 0 ? parseFloat(tx.moneyOut).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                                            </td>
                                            <td className="px-4 py-4 text-xs text-right text-gray-800 font-bold align-top whitespace-nowrap">
                                                {tx?.balance ? parseFloat(String(tx.balance).replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-xs align-top">
                                                {/* Actions */}
                                            </td>
                                            <td className="px-4 py-4"></td> {/* SPACER */}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`mt-4 mx-auto max-w-lg p-3 rounded-full text-xs font-bold text-center fixed top-6 left-0 right-0 shadow-lg z-50 animate-bounce-in ${message.includes('Error') ? 'bg-red-500 text-white' : 'bg-black text-white'}`}>
                    {message}
                </div>
            )}

            {/* DEBUG CONSOLE (For User Feedback) */}
            {debugLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full border-2 border-red-500 relative">
                        <button
                            onClick={() => setDebugLog(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X />
                        </button>
                        <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center">
                            <span className="bg-red-100 p-2 rounded-full mr-3">⚠️</span>
                            {debugLog.title}
                        </h3>
                        <p className="text-gray-800 font-medium mb-4">{debugLog.message}</p>

                        <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                            <pre className="text-xs font-mono text-gray-600">
                                {debugLog.details}
                            </pre>
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            Please take a screenshot of this error and send it to support.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    // --- Inspector Handlers ---
    const handleRegenerate = async () => {
        if (!viewDoc) return;
        setRegenerating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/regenerate-document', {
                docType: viewDoc.docType
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update Form Data
            setFormData(prev => ({ ...prev, ...res.data.profile }));

            // Flash Update
            setMessage('Document Re-scanned Successfully!');

        } catch (err) {
            console.error(err);
            alert('Regeneration Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setRegenerating(false);
        }
    };

    // RENDER LOGIC
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-white">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 shadow-lg h-16 flex items-center px-6 justify-between">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 text-sm tracking-tighter group-hover:scale-105 transition-transform">
                        GK
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">GK SMART <span className="text-gray-500 font-normal">& Ai</span></span>
                </div>
                {/* Quick Actions or User Menu could go here */}
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                {view === 'home' && renderHome()}
                {view === 'profile' && renderProfile()}
                {view === 'bank' && renderBank()}
                {view === 'ledger' && <GeneralLedger onBack={() => setView('home')} />}
                {view === 'codes' && <AccountingCodes onBack={() => setView('home')} />}
                {view === 'currency' && <CurrencyExchange onBack={() => setView('home')} />}
                {view === 'report' && <TrialBalance onBack={() => setView('home')} />}
                {view === 'financials' && <FinancialStatements onBack={() => setView('home')} />}
                {view === 'toi_acar' && <ToiAcar onBack={() => setView('home')} />}
            </main>

            {/* DOCUMENT INSPECTOR MODAL */}
            {viewDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
                    {/* {alert('Debug: Rendering Modal for ' + viewDoc.docType)} */}
                    <div className="bg-white w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">

                        {/* Modal Header */}
                        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <FileText size={20} className="text-blue-600" />
                                Inspecting: <span className="text-blue-900">{viewDoc.originalName}</span>
                            </h3>
                            <button onClick={() => setViewDoc(null)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Split View Body */}
                        <div className="flex-1 flex overflow-hidden bg-gray-100">

                            {/* LEFT: Image Preview (Scrollable) */}
                            <div className="w-1/2 overflow-auto p-8 flex items-start justify-center bg-gray-900/5 shadow-inner">
                                <img
                                    src={getDocUrl(viewDoc)}
                                    alt="Document Preview"
                                    className="max-w-full shadow-2xl rounded-sm border border-gray-300"
                                />
                            </div>

                            {/* RIGHT: Digital Replica */}
                            <div className="w-1/2 overflow-auto p-8 bg-white border-l border-gray-200 flex flex-col items-center">
                                {/* Only show MOC Replica for MOC Cert, else standard form or JSON */}
                                {viewDoc.docType === 'moc_cert' ? (
                                    <MOCCertificate
                                        data={formData}
                                        onRegenerate={handleRegenerate}
                                        regenerating={regenerating}
                                    />
                                ) : (
                                    <div className="text-center text-gray-500 mt-20 w-full">
                                        <p className="mb-4 font-bold text-gray-700">No Digital Replica available for this document type.</p>
                                        <p className="text-sm mb-4">You can verify the raw data below:</p>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-left text-xs font-mono overflow-auto max-h-[500px]">
                                            <pre>
                                                {JSON.stringify(JSON.parse(viewDoc.extractedText || '{}'), null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}



            {/* Toast/Debug Overlay */}
            {message && (
                <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up z-50">
                    {uploadingBank || savingBank || regenerating ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} className="text-green-400" />}
                    <span className="font-medium text-sm">{message}</span>
                </div>
            )}

            {debugLog && (
                <div className="fixed bottom-6 left-6 max-w-sm bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl shadow-lg animate-slide-up z-50">
                    <div className="flex justify-between items-start mb-2">
                        <strong className="text-sm flex items-center gap-2"><AlertCircle size={14} /> {debugLog.title}</strong>
                        <button onClick={() => setDebugLog(null)}><X size={14} /></button>
                    </div>
                    <p className="text-xs mb-2">{debugLog.message}</p>
                    <pre className="bg-white p-2 rounded border border-red-100 text-[10px] overflow-auto max-h-32">
                        {debugLog.details}
                    </pre>
                    <p className="text-[10px] text-red-400 mt-2">
                        Please take a screenshot of this error and send it to support.
                    </p>
                </div>
            )}
        </div>
    );
}
