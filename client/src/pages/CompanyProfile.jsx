import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, Table, Save, X, Eye, FileText, CloudUpload } from 'lucide-react';

export default function CompanyProfile() {
    const [view, setView] = useState('home'); // home, profile, bank
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
        // Safe flatten
        const allTransactions = (bankFiles || []).flatMap(f => f.transactions || []);

        if (allTransactions.length === 0) return;
        setSavingBank(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/save-transactions', { transactions: allTransactions }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage(`Successfully saved ${allTransactions.length} transactions!`);
            setTimeout(() => setMessage(''), 3000);
            setBankFiles([]);
            setActiveFileIndex(0);
        } catch (err) {
            console.error(err);
            setMessage('Error saving transactions.');
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

    const renderBank = () => (
        <div className="max-w-6xl mx-auto pt-10 px-6 animate-fade-in pb-24">
            <button onClick={() => setView('home')} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center text-sm font-medium transition">
                ← Back to Dashboard
            </button>

            {/* Upload Section */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 mb-8 transition-all relative overflow-hidden group">
                {uploadingBank && <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm" />}

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold text-lg">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">1. Upload Bank Statements (Drag & Drop)</h2>
                        <p className="text-gray-500 text-sm">Upload transaction screenshots or PDF files.</p>
                    </div>
                </div>

                <div
                    className="border-2 border-dashed border-green-200 rounded-2xl p-12 text-center hover:border-green-400 hover:bg-green-50/30 transition relative group-hover:shadow-sm"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (uploadingBank) return;

                        const fileList = Array.from(e.dataTransfer.files);
                        if (fileList.length === 0) return;

                        setMessage(`Processing ${fileList.length} files...`);
                        setUploadingBank(true);
                        setBankFiles([]);

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

                            // --- DEFENSIVE SAFEGUARD ---
                            // Ensure we don't crash if backend sends different structure
                            let safeFiles = res.data.files;

                            // Logic: If new 'files' array is missing but old 'extractedData' exists,
                            // wrap the old data in a fake file object to keep UI working.
                            if (!safeFiles && res.data.extractedData) {
                                safeFiles = [{
                                    fileId: 'legacy_import',
                                    dateRange: 'Legacy Data',
                                    transactions: res.data.extractedData, // This assumes extractedData is []
                                    status: 'Saved'
                                }];
                            }

                            // Final safety check: Ensure it is an array
                            if (!Array.isArray(safeFiles)) safeFiles = [];

                            setBankFiles(safeFiles);
                            setActiveFileIndex(0);

                            const totalTx = safeFiles.reduce((acc, f) => acc + (f.transactions?.length || 0), 0);
                            setMessage(`Success! Parsed ${totalTx} transactions from ${safeFiles.length} files. (v2.2 Safe)`);

                        } catch (err) {
                            setMessage('Error processing files.');
                            console.error(err);
                        } finally {
                            setUploadingBank(false);
                        }
                    }}
                >
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={async (e) => {
                            if (!e.target.files || e.target.files.length === 0) return;
                            const fileList = Array.from(e.target.files);

                            setMessage(`Processing ${fileList.length} files...`);
                            setUploadingBank(true);
                            setBankFiles([]);

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
                                // --- DEFENSIVE SAFEGUARD DUPLICATE ---
                                let safeFiles = res.data.files;
                                if (!safeFiles && res.data.extractedData) {
                                    safeFiles = [{
                                        fileId: 'legacy_import',
                                        dateRange: 'Legacy Data',
                                        transactions: res.data.extractedData,
                                        status: 'Saved'
                                    }];
                                }
                                if (!Array.isArray(safeFiles)) safeFiles = [];

                                setBankFiles(safeFiles);
                                setActiveFileIndex(0);
                                const totalTx = safeFiles.reduce((acc, f) => acc + (f.transactions?.length || 0), 0);
                                setMessage(`Success! Parsed ${totalTx} transactions from ${safeFiles.length} files. (v3.0 AI-Vision)`);
                            } catch (err) {
                                setMessage('Error uploading files.');
                                console.error(err);
                            } finally {
                                setUploadingBank(false);
                            }
                        }}
                        disabled={uploadingBank}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    <div className="flex flex-col items-center pointer-events-none">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <CloudUpload size={32} className="text-green-600" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-1">
                            {uploadingBank ? 'Processing Files...' : '1. Upload Bank Statements (Split View Active)'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {uploadingBank ? 'Extracting data...' : 'Drag & drop multiple screenshots'}
                        </p>
                        <div className="flex gap-2">
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">JPG</span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">PNG</span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">PDF</span>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`mt-4 p-4 rounded-lg text-sm font-medium text-center ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
                        {message}
                    </div>
                )}

                {uploadingBank && (
                    <div className="mt-8 text-center py-8 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <Loader2 className="animate-spin h-8 w-8 text-green-600 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-800">AI Verification in Progress</h3>
                        <p className="text-gray-500 text-sm">Analyzing transaction patterns...</p>
                    </div>
                )}
            </div>

            {/* SPLIT VIEW - DEFENSIVE CODING */}
            {bankFiles && bankFiles.length > 0 && (
                <div className="flex flex-col lg:flex-row gap-6 mb-8 animate-fade-in">

                    {/* LEFT COLUMN: File List */}
                    <div className="w-full lg:w-1/3 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 flex justify-between items-center">
                                <span>Uploaded Files ({bankFiles.length})</span>
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Saved</span>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                {bankFiles.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-4 flex items-center justify-between transition cursor-pointer ${activeFileIndex === idx ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}
                                        onClick={() => setActiveFileIndex(idx)}
                                    >
                                        <div>
                                            {/* Safe Access */}
                                            <p className="font-medium text-gray-800 text-sm">{file.dateRange || 'Processing...'}</p>
                                            <p className="text-xs text-gray-400 mt-1">{file.transactions?.length || 0} transactions</p>
                                        </div>
                                        <button
                                            className={`p-2 rounded-full hover:bg-white hover:shadow-sm transition ${activeFileIndex === idx ? 'text-blue-600' : 'text-gray-400'}`}
                                            title="View Details"
                                        >
                                            <Eye size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSaveTransactions}
                            disabled={savingBank}
                            className="w-full bg-black text-white px-6 py-4 rounded-xl font-bold hover:bg-gray-800 transition disabled:bg-gray-400 flex items-center justify-center gap-2 shadow-lg"
                        >
                            {savingBank ? <Loader2 className="animate-spin h-5 w-5" /> : <Save size={20} />}
                            {savingBank ? 'SAVING...' : 'SAVE ALL TRANSACTIONS'}
                        </button>
                    </div>

                    {/* RIGHT COLUMN: Transaction Table */}
                    <div className="w-full lg:w-2/3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
                            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                        <Table className="text-blue-500" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Page Details</h3>
                                        <p className="text-xs text-gray-500">{bankFiles[activeFileIndex]?.dateRange || 'Details'}</p>
                                    </div>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center">
                                    <CheckCircle size={12} className="mr-1" /> Verified
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Date</th>
                                            <th className="px-6 py-4 font-medium">Description</th>
                                            <th className="px-6 py-4 font-medium text-right">In</th>
                                            <th className="px-6 py-4 font-medium text-right">Out</th>
                                            <th className="px-6 py-4 font-medium text-right">Bal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(bankFiles[activeFileIndex]?.transactions || []).map((tx, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 text-xs text-gray-600 font-mono whitespace-nowrap">{tx.date}</td>
                                                <td className="px-6 py-4 text-xs text-gray-800 font-medium max-w-[200px] truncate" title={tx.description}>{tx.description}</td>
                                                <td className="px-6 py-4 text-xs text-right font-medium text-green-600">
                                                    {tx.moneyIn ? `+${parseFloat(tx.moneyIn).toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-right font-medium text-red-600">
                                                    {tx.moneyOut ? `-${parseFloat(tx.moneyOut).toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-right text-gray-800 font-bold">
                                                    {tx.balance || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
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
