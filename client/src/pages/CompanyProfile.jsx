import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle, Table, Save, X, Eye, FileText, CloudUpload, Calendar } from 'lucide-react';

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

    const renderHome = () => (
        <div className="max-w-4xl mx-auto pt-20 px-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {formData.companyNameEn || formData.companyCode || 'Admin'}</h1>
            <p className="text-gray-500 mb-12">Manage your company entity and financial data.</p>

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
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="max-w-3xl mx-auto pt-10 px-6 animate-fade-in">
            <button onClick={() => setView('home')} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center text-sm font-medium transition">
                ← Back to Dashboard
            </button>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Company Profile</h2>
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Profile editing is currently read-only in this demo version.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <label className="text-xs text-gray-400 uppercase font-bold">Company Name (KH)</label>
                            <p className="font-medium text-gray-800">{formData.companyNameKh || '-'}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <label className="text-xs text-gray-400 uppercase font-bold">Company Name (EN)</label>
                            <p className="font-medium text-gray-800">{formData.companyNameEn || '-'}</p>
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
            setMessage('Error processing files.');
            console.error(err);
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

                await axios.delete('/api/company/transactions', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    data: { transactionIds: ids }
                });

                setMessage(`Deleted ${ids.length} transactions from DB.`);
                // Force Reload
                await fetchProfile();
            } catch (err) {
                console.error(err);
                alert("Server Error deleting: " + (err.response?.data?.message || err.message));
                // Reload to restore state if error
                fetchProfile();
            }
        } else {
            // Delete Unsaved
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
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {view === 'home' && renderHome()}
            {view === 'profile' && renderProfile()}
            {view === 'bank' && renderBank()}
        </div>
    );
}
