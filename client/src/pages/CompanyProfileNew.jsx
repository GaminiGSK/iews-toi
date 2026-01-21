import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle, Table, Save, X, Eye, FileText, CloudUpload, Calendar, Book, Tag, DollarSign, Scale } from 'lucide-react';
import GeneralLedger from './GeneralLedger';
import AccountingCodes from './AccountingCodes';
import CurrencyExchange from './CurrencyExchange';
import TrialBalance from './TrialBalance';

export default function CompanyProfile() {
    const [view, setView] = useState('home'); // home, profile, bank
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingBank, setUploadingBank] = useState(false);
    const [savingBank, setSavingBank] = useState(false);

    // Helper: Parse Date (Handles DD/MM/YYYY and standard formats)
    const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0);
        // Try standard parsing
        let d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;

        // Try parsing DD/MM/YYYY
        if (typeof dateStr === 'string' && dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
            const [day, month, year] = dateStr.split('/');
            d = new Date(`${year}-${month}-${day}`);
            if (!isNaN(d.getTime())) return d;
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
                        // FIX: Restore moneyIn/moneyOut for UI
                        const amount = parseFloat(tx.amount || 0);
                        tx.moneyIn = amount > 0 ? amount : 0;
                        tx.moneyOut = amount < 0 ? Math.abs(amount) : 0;

                        const dateObj = new Date(tx.date);
                        const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(tx);
                    });

                    // Convert to Virtual Files
                    // Sort keys (YYYY-MM) Ascending (Jan -> Dec)
                    const historyFiles = Object.keys(groups).sort((a, b) => a.localeCompare(b)).map(key => {
                        const [year, month] = key.split('-');
                        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });

                        // Sort transactions in this group Oldest -> Newest
                        const groupTxs = groups[key].sort((a, b) => new Date(a.date) - new Date(b.date));

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
            if (err.response && err.response.status === 401) {
                // Token invalid/expired
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
    };

    // --- Sub-Components ---

    const renderHome = () => (
        <div className="max-w-4xl mx-auto pt-20 px-6 animate-fade-in relative">
            <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {formData.companyNameEn || formData.companyCode || 'Admin'}</h1>
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }}
                    className="text-sm text-red-500 font-medium hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition"
                >
                    Log Out
                </button>
            </div>
            <p className="text-gray-500 mb-12">Manage your company entity and financial data. <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded ml-2">v2.3 (Verbose Error)</span></p>

            <div className="grid md:grid-cols-2 gap-6">
                <div
                    onClick={() => setView('profile')}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition group"
                >
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <FileText className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Company Profile</h3>
                    <p className="text-gray-500 text-sm">Update official registration details, MOC certificates, and shareholders.</p>
                </div>

                <div
                    onClick={() => setView('bank')}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition group"
                >
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <Table className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Bank Statements</h3>
                    <p className="text-gray-500 text-sm">Upload monthly statements, parse transactions via AI, and sync data.</p>
                </div>

                <div
                    onClick={() => setView('ledger')}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition group"
                >
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <Book className="text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">General Ledger</h3>
                    <p className="text-gray-500 text-sm">View chronological financial history of all transactions.</p>
                </div>

                <div
                    onClick={() => setView('codes')}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition group"
                >
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <Tag className="text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Accounting Codes</h3>
                    <p className="text-gray-500 text-sm">Manage Chart of Accounts codes and descriptions.</p>
                </div>

                <div
                    onClick={() => setView('currency')}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition group"
                >
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <DollarSign className="text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Currency Exchange</h3>
                    <p className="text-gray-500 text-sm">Set Annual Exchange Rates (USD to KHR).</p>
                </div>

                <div
                    onClick={() => setView('report')}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition group"
                >
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <Scale className="text-teal-800" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Trial Balance</h3>
                    <p className="text-gray-500 text-sm">View Consolidated Report (Dr/Cr).</p>
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
            <button onClick={() => setView('home')} className="text-gray-400 hover:text-gray-600 mb-4 flex items-center text-sm font-medium transition shrink-0">
                ← Back to Dashboard
            </button>

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
                                <div key={type.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <div className="flex items-center min-w-0">
                                        <div className={`w-2 h-2 rounded-full mr-2 ${isVerified ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <div className="flex flex-col truncate">
                                            <span className="text-xs font-bold text-gray-700 truncate">{type.label}</span>
                                            <span className="text-[10px] text-gray-400 truncate">
                                                {uploaded ? uploaded.originalName : 'Missing'}
                                            </span>
                                        </div>
                                    </div>
                                    {isVerified && <CheckCircle size={14} className="text-green-500 shrink-0 mr-2" />}

                                    {/* Clear Button */}
                                    {uploaded && (
                                        <button
                                            onClick={() => handleClearDoc(type.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                            title="Clear Document"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
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
        </div>
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

    const handleDelete = async (idx, file) => {
        // Robust check for saved status
        const isSaved = file.status === 'Saved' || (file.transactions && file.transactions.some(t => t._id));

        if (!window.confirm(`Delete ${isSaved ? 'PERMANENTLY' : 'this'} item?`)) return;

        if (isSaved) {
            // Delete from DB
            const ids = file.transactions.filter(t => t._id).map(t => t._id);

            if (ids.length === 0) {
                alert("Error: No Transaction IDs found in database for this file.");
                return;
            }

            try {
                const token = localStorage.getItem('token');

                // Optimistic UI update
                setBankFiles(prev => prev.filter((_, i) => i !== idx));

                await axios.post('/api/company/delete-transactions', {
                    transactionIds: ids
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                alert(`Deleted ${ids.length} transactions. Page will reload.`);
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

                // Show On-Screen Error for Screenshotting
                setDebugLog({
                    title: 'Delete Failed',
                    message: errMsg,
                    details: JSON.stringify(err.response?.data || {}, null, 2)
                });

                // Reload to restore state if error
                fetchProfile();
            }
        } else {
            // Delete Unsaved - No reload needed
            setBankFiles(prev => prev.filter((_, i) => i !== idx));
            if (activeFileIndex === idx) setActiveFileIndex(0);
        }
    };

    const renderBank = () => (
        <div className="w-full h-[calc(100vh-80px)] pt-6 px-4 animate-fade-in flex flex-col">
            <button onClick={() => setView('home')} className="text-gray-400 hover:text-gray-600 mb-4 flex items-center text-sm font-medium transition shrink-0">
                ← Back to Dashboard
            </button>

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
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Saved</span>
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
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center">
                            <CheckCircle size={12} className="mr-1" /> Verified
                        </span>
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

    // RENDER LOGIC
    if (view === 'home') return renderHome();
    if (view === 'ledger') return <GeneralLedger onBack={() => setView('home')} />;
    if (view === 'codes') return <AccountingCodes onBack={() => setView('home')} />;
    if (view === 'currency') return <CurrencyExchange onBack={() => setView('home')} />;
    if (view === 'report') return <TrialBalance onBack={() => setView('home')} />;
    if (view === 'profile') return renderProfile();
    if (view === 'bank') return renderBank();

    // Default or fallback view
    return (
        <div className="min-h-screen bg-gray-50">
            <p>Unknown view: {view}</p>
        </div>
    );
}
