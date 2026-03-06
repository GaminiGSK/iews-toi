import React, { useState, useRef, useEffect } from 'react';
import { Layers, Plus, FolderUp, ArrowLeft, CloudUpload, Loader2, Save, Trash2, FileText, CheckCircle, AlertCircle, ShieldCheck, Eye, X, Tag, Table } from 'lucide-react';
import axios from 'axios';

export default function BankStatementV2Workspace({ onBack }) {
    const [baskets, setBaskets] = useState([]);
    const [activeBasketId, setActiveBasketId] = useState(null);

    // Active Basket states
    const [dragActive, setDragActive] = useState(false);
    const [uploadingBank, setUploadingBank] = useState(false);
    const [savingBank, setSavingBank] = useState(false);
    const [activeFileIndex, setActiveFileIndex] = useState(0);

    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchSavedBaskets();
    }, []);

    const fetchSavedBaskets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/saved-bank-baskets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.baskets) {
                setBaskets(res.data.baskets);
            }
        } catch (err) {
            console.error('Failed to fetch saved baskets:', err);
        }
    };

    const handleCreateBasket = () => {
        if (baskets.length >= 10) {
            alert("Maximum 10 baskets allowed.");
            return;
        }
        const newBasket = {
            id: Date.now().toString(),
            name: `New Basket ${baskets.length + 1}`,
            bankName: null,
            accountNo: null,
            files: [],
            status: 'empty'
        };
        setBaskets([...baskets, newBasket]);
    };

    const navToBasket = (id) => {
        setActiveBasketId(id);
        setActiveFileIndex(0);
        setMessage('');
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleUploadFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleUploadFiles = async (fileList) => {
        if (fileList.length === 0) return;
        if (fileList.length > 5) {
            alert("Maximum 5 files allowed per upload batch.");
            return;
        }

        setMessage(`Preparing to process ${fileList.length} files...`);
        setUploadingBank(true);

        const token = localStorage.getItem('token');
        let processedCount = 0;
        let failCount = 0;

        let newFilesToAdd = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const formData = new FormData();
            formData.append('files', file);

            setMessage(`Processing File ${i + 1}/${fileList.length}: ${file.name}...`);

            try {
                const res = await axios.post('/api/company/upload-bank-statement', formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                let safeFiles = res.data.files || [];
                if (!Array.isArray(safeFiles)) safeFiles = [];
                newFilesToAdd = [...newFilesToAdd, ...safeFiles];

                processedCount++;

                if (i < fileList.length - 1) {
                    await new Promise(r => setTimeout(r, 4000));
                }
            } catch (err) {
                console.error(`Upload failed for ${file.name}:`, err);
                failCount++;
            }
        }

        setBaskets(prev => prev.map(b => {
            if (b.id === activeBasketId) {
                const combined = [...b.files, ...newFilesToAdd];
                return { ...b, files: combined, status: combined.length > 0 ? 'draft' : 'empty' };
            }
            return b;
        }));

        const statusMsg = `Upload Finished. ${processedCount} successful, ${failCount} failed.`;
        setMessage(statusMsg);
        setUploadingBank(false);
        setTimeout(() => setMessage(''), 4000);
    };

    const handleDeleteFile = (idx) => {
        if (!window.confirm("Remove this file exactly from the un-saved basket?")) return;
        setBaskets(prev => prev.map(b => {
            if (b.id === activeBasketId) {
                const newFiles = b.files.filter((_, i) => i !== idx);
                return { ...b, files: newFiles, status: newFiles.length > 0 ? 'draft' : 'empty' };
            }
            return b;
        }));
        if (activeFileIndex >= idx && activeFileIndex > 0) setActiveFileIndex(activeFileIndex - 1);
    };

    const handleSaveBasket = async () => {
        const activeBasket = baskets.find(b => b.id === activeBasketId);
        if (!activeBasket || activeBasket.files.length === 0) return;

        setSavingBank(true);
        setMessage('Generating Sync Request... Creating Drive Folder...');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/save-bank-basket', {
                basketId: activeBasket.id,
                basketName: activeBasket.name,
                files: activeBasket.files
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const newFolderName = res.data.basketName || activeBasket.name;

            // Update UI State locally
            setBaskets(prev => prev.map(b => {
                if (b.id === activeBasketId) {
                    return {
                        ...b,
                        name: newFolderName,
                        status: 'Saved',
                        files: b.files.map(f => ({ ...f, status: 'Saved' }))
                    };
                }
                return b;
            }));

            setMessage(`✅ Successfully Saved to Folder: ${newFolderName}`);
            setTimeout(() => setMessage(''), 5000);

        } catch (err) {
            console.error('Save Basket Error:', err);
            setMessage('❌ Failed to save basket/sync to drive. See console.');
            setTimeout(() => setMessage(''), 5000);
        } finally {
            setSavingBank(false);
        }
    };

    const renderDashboard = () => (
        <div className="w-full h-[calc(100vh-80px)] pt-6 pl-10 pr-[100px] animate-fade-in flex flex-col overflow-y-auto">
            <div className="mb-8 flex flex-col items-start gap-5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition shadow-lg shrink-0 border border-white/5"
                        title="Back to Main Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Bank Statements V2 (Multi-Account)</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Create isolated statement baskets for exact synchronization to Google Drive.</p>
                    </div>
                </div>

                <div className="pl-[68px]">
                    <button
                        onClick={handleCreateBasket}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2 border border-emerald-400/30"
                    >
                        <Plus size={20} />
                        CREATE BASKET
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {baskets.map(basket => (
                    <div
                        key={basket.id}
                        onClick={() => navToBasket(basket.id)}
                        className="group p-8 bg-slate-900 border border-white/10 hover:border-emerald-500/50 rounded-3xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-emerald-500/10 flex flex-col items-center text-center relative"
                    >
                        {basket.files.length > 0 && <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm">{basket.files.length} FILES</span>}
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/5 group-hover:bg-emerald-500/10 group-hover:text-emerald-400">
                            <FolderUp size={28} className="text-slate-400 group-hover:text-emerald-400" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">{basket.name}</h3>
                        <p className="text-xs text-slate-500 font-medium uppercase">{basket.status}</p>
                    </div>
                ))}

                {baskets.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-slate-900/40">
                        <Layers size={64} className="text-slate-700 mb-6" />
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">No Baskets Found</h3>
                        <p className="text-slate-400 font-medium text-sm">Click 'Create Basket' to initialize a new isolated bank statement sync zone.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderActiveBasket = () => {
        const activeBasket = baskets.find(b => b.id === activeBasketId);
        if (!activeBasket) return null;

        const currentFile = activeBasket.files[activeFileIndex];

        // --- Date Helpers (Inlined to ensure standalone execution) ---
        const parseDate = (dateStr) => {
            if (!dateStr || String(dateStr).trim() === '') return null;
            let d = new Date(dateStr);
            if (!isNaN(d.getTime()) && d.getFullYear() > 1970) return d;
            const s = String(dateStr).trim();
            const cleanS = s.replace(/^(FATAL_ERR|DEBUG_ERR|Unknown Date Range)\s*[-]*/i, '').trim();
            if (!cleanS) return null;
            if (cleanS.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
                const [day, month, year] = cleanS.split('/');
                d = new Date(`${year}-${month}-${day}`);
                if (!isNaN(d.getTime())) return d;
            }
            if (cleanS.match(/^\d{4}-\d{2}-\d{2}/)) {
                d = new Date(cleanS.substring(0, 10));
                if (!isNaN(d.getTime())) return d;
            }
            if (cleanS.match(/^[A-Za-z]{3}\s\d{1,2},?\s\d{4}/)) {
                d = new Date(cleanS.replace(',', ''));
                if (!isNaN(d.getTime())) return d;
            }
            if (cleanS.match(/^\d{1,2}-[A-Za-z]{3}-\d{4}/)) {
                d = new Date(cleanS);
                if (!isNaN(d.getTime())) return d;
            }
            return null;
        };

        const formatDateSafe = (dateStr) => {
            if (!dateStr) return '-';
            const d = parseDate(dateStr);
            if (!d) return dateStr;
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        };
        // -------------------------------------------------------------

        return (
            <div className="w-full h-[calc(100vh-80px)] pt-6 pl-10 pr-[450px] animate-fade-in flex flex-col bg-slate-900">
                <div className="mb-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveBasketId(null)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition shrink-0 shadow-md"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <span className="text-gray-400 text-sm font-medium">Back to Dashboard</span>
                    </div>
                </div>

                <div className="flex flex-1 gap-6 min-h-0 bg-slate-900 border-none">

                    {/* COLUMN 1: UPLOAD ZONE (Vertical) */}
                    <div className="w-64 shrink-0 flex flex-col">
                        <div
                            className={`flex-1 bg-white border-2 border-dashed ${dragActive ? 'border-green-500 bg-green-50/50' : 'border-green-200'} rounded-2xl p-4 text-center hover:border-green-400 hover:bg-green-50/30 transition relative group flex flex-col items-center justify-center cursor-pointer`}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragActive(false);
                                if (uploadingBank) return;
                                const fileList = Array.from(e.dataTransfer.files);
                                if (fileList.length === 0) return;
                                handleUploadFiles(fileList);
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                ref={fileInputRef}
                                multiple
                                onChange={(e) => {
                                    if (e.target.files?.length > 0) handleUploadFiles(Array.from(e.target.files));
                                }}
                                disabled={uploadingBank}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />

                            {uploadingBank && (
                                <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center backdrop-blur-md rounded-2xl">
                                    <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
                                    <p className="text-xs font-bold text-gray-700 animate-pulse">Ai is Analyzing...</p>
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
                                    <span>Uploaded Files ({activeBasket.files.length})</span>
                                    {activeBasket.files.length > 0 && activeBasket.files.every(f => f.status === 'Saved') ? (
                                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded flex items-center gap-1">
                                            <CheckCircle size={10} /> All Saved
                                        </span>
                                    ) : activeBasket.files.length > 0 ? (
                                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded flex items-center gap-1">
                                            <CheckCircle size={10} /> All Saved
                                        </span>
                                    ) : null}
                                </div>
                                {activeBasket.files.length > 0 && (
                                    <button
                                        onClick={handleSaveBasket}
                                        disabled={savingBank}
                                        className="w-full bg-black text-white px-3 py-2 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400 flex items-center justify-center gap-2 shadow-sm text-xs"
                                    >
                                        {savingBank ? <Loader2 className="animate-spin h-3 w-3" /> : <Save size={14} />}
                                        {savingBank ? 'SAVING...' : 'SAVE ALL'}
                                    </button>
                                )}
                            </div>
                            <div className="divide-y divide-gray-100 overflow-y-auto flex-1 p-2 custom-scrollbar">
                                {activeBasket.files.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 mb-2 rounded-lg flex items-center justify-between transition cursor-pointer group ${activeFileIndex === idx ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                                        onClick={() => setActiveFileIndex(idx)}
                                    >
                                        <div className="flex-1 min-w-0 mr-2">
                                            {/* Primary Title: Date Range */}
                                            <p className="font-bold text-gray-800 text-xs truncate mb-1">
                                                {(() => {
                                                    const rangeStr = file.dateRange || "";
                                                    if (rangeStr.includes(" - ") && !rangeStr.includes("FATAL_ERR")) {
                                                        const parts = rangeStr.split(' - ');
                                                        const s = formatDateSafe(parts[0].trim());
                                                        const e = formatDateSafe(parts[1].trim());
                                                        if (s !== '-' && e !== '-') return `${s} - ${e}`;
                                                    }
                                                    if (file.transactions?.length > 0) {
                                                        const dates = file.transactions.map(t => parseDate(t.date)?.getTime()).filter(Boolean);
                                                        if (dates.length > 0) {
                                                            const s = new Date(Math.min(...dates)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                                            const e = new Date(Math.max(...dates)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                                            return `${s} - ${e}`;
                                                        }
                                                    }
                                                    if (file.originalName && !file.originalName.includes('-')) return file.originalName;
                                                    return 'Bank Statement';
                                                })()}
                                            </p>

                                            {/* Metadata */}
                                            <div className="flex flex-col text-[10px] text-gray-400 mt-1 space-y-0.5">
                                                <div className="flex items-center">
                                                    <FileText size={10} className="mr-1 opacity-50" />
                                                    <span className="truncate max-w-[120px] mr-2" title={file.originalName}>{file.originalName}</span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="ml-2 font-mono">{(file.transactions || []).length} txs</span>

                                                    <div className="ml-auto flex items-center gap-1.5">
                                                        <span className="text-[8px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-black flex items-center gap-1">
                                                            <CheckCircle size={8} /> SAVED
                                                        </span>
                                                    </div>
                                                </div>
                                                {(file.bankName || file.accountNumber) && (
                                                    <div className="flex items-center text-blue-500/60 font-medium">
                                                        <Tag size={10} className="mr-1" />
                                                        <span className="truncate">{file.bankName || 'Unknown Bank'} {file.accountNumber ? `(${file.accountNumber})` : ''}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteFile(idx); }}
                                                className="p-1.5 rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 transition"
                                            >
                                                <X size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveFileIndex(idx); }}
                                                className={`p-1.5 rounded-full transition ${activeFileIndex === idx ? 'text-blue-600 bg-blue-100' : 'text-gray-300 hover:text-blue-500'}`}
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {activeBasket.files.length === 0 && (
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
                                        {currentFile?.transactions?.length > 0
                                            ? (() => {
                                                const dates = currentFile.transactions.map(t => parseDate(t.date)?.getTime()).filter(Boolean);
                                                const s = new Date(Math.min(...dates)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                                const e = new Date(Math.max(...dates)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                                return `${s} - ${e}`;
                                            })()
                                            : (currentFile?.dateRange || 'Select a file')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:text-blue-600 hover:border-blue-300 transition flex items-center gap-2 mr-2"
                                >
                                    <FileText size={12} />
                                    <span>View Original</span>
                                </a>
                                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center">
                                    <CheckCircle size={12} className="mr-1" /> Verified
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-white custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-white text-gray-800 text-[10px] font-bold uppercase sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 whitespace-nowrap w-[80px]">Date</th>
                                        <th className="px-4 py-3 w-full">Transaction Details</th>
                                        <th className="px-4 py-3 text-right w-[110px]">Money In</th>
                                        <th className="px-4 py-3 text-right w-[110px]">Money Out</th>
                                        <th className="px-4 py-3 text-right w-[110px]">Balance</th>
                                        <th className="px-4 py-3 w-[100px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(currentFile?.transactions || []).length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-10 text-gray-400 text-sm">No transactions to display</td>
                                        </tr>
                                    ) : (
                                        (currentFile?.transactions || []).map((tx, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition group">
                                                <td className="px-4 py-3 text-xs text-gray-600 font-bold whitespace-nowrap align-top">
                                                    {formatDateSafe(tx?.date)}
                                                </td>
                                                <td className="px-4 py-3 text-[11px] text-gray-700 font-medium align-top">
                                                    <div className="whitespace-pre-wrap leading-relaxed max-w-lg">
                                                        {tx?.description || ''}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-[11px] text-right font-medium text-green-600 align-top whitespace-nowrap">
                                                    {tx?.moneyIn && parseFloat(tx.moneyIn) > 0 ? parseFloat(tx.moneyIn).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                                                </td>
                                                <td className="px-4 py-3 text-[11px] text-right font-medium text-red-600 align-top whitespace-nowrap">
                                                    {tx?.moneyOut && parseFloat(tx.moneyOut) > 0 ? parseFloat(tx.moneyOut).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                                                </td>
                                                <td className="px-4 py-3 text-[11px] text-right text-gray-800 font-bold align-top whitespace-nowrap">
                                                    {tx?.balance ? parseFloat(String(tx.balance).replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-xs align-top">
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm z-[9999]">
                        {message}
                    </div>
                )}
            </div>
        );
    };

    return activeBasketId ? renderActiveBasket() : renderDashboard();
}
