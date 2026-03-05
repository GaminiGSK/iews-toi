import React, { useState, useRef } from 'react';
import { Layers, Plus, FolderUp, ArrowLeft, CloudUpload, Loader2, Save, Trash2 } from 'lucide-react';
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
        // Placeholder for the next architectural step: "Save All" sub-folder sync
        alert("Connected! Next step will trigger the backend folder generation.");
    };

    const renderDashboard = () => (
        <div className="w-full h-[calc(100vh-80px)] pt-6 pl-10 pr-[100px] animate-fade-in flex flex-col overflow-y-auto">
            <div className="mb-8 flex items-center justify-between">
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

                <button
                    onClick={handleCreateBasket}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2 border border-emerald-400/30"
                >
                    <Plus size={20} />
                    CREATE BASKET
                </button>
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

        return (
            <div className="w-full h-[calc(100vh-80px)] pt-6 pl-10 pr-[100px] animate-fade-in flex flex-col relative">
                <div className="mb-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveBasketId(null)}
                            className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition shadow-lg shrink-0 border border-white/5"
                            title="Back to Baskets"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[400px]">{activeBasket.name}</h1>
                            <p className="text-emerald-400 font-bold text-xs mt-1 uppercase tracking-widest bg-emerald-500/10 inline-block px-2 py-0.5 rounded">ISOLATED ZONE ACTIVE</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 h-full pb-6 overflow-hidden">
                    {/* Left: Drop + Preview */}
                    <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
                        {/* Dropzone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 shrink-0 ${dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-slate-900 hover:border-emerald-500/30'}`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    if (e.target.files) handleUploadFiles(Array.from(e.target.files));
                                }}
                                className="hidden"
                                multiple
                                accept=".pdf,image/*"
                            />
                            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CloudUpload size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Drop Statements Here</h3>
                            <p className="text-slate-500 text-xs">Supports PDF, PNG, JPG (Multi-page allowed)</p>
                        </div>

                        {/* Table Preview */}
                        <div className="flex-1 bg-slate-900 border border-white/5 rounded-3xl flex flex-col overflow-hidden relative shadow-lg">
                            <div className="p-6 shrink-0 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                                <h3 className="text-white font-bold">Extracted Transactions</h3>
                                <span className="text-xs text-slate-500 font-medium bg-white/5 px-2 py-1 rounded">
                                    {currentFile ? (currentFile.transactions?.length || 0) + ' items' : 'No file selected'}
                                </span>
                            </div>

                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900 border-b border-white/5 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Date</th>
                                            <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Description</th>
                                            <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-emerald-500 text-right">In (+)</th>
                                            <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-rose-500 text-right">Out (-)</th>
                                            <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 relative bg-slate-950/30 text-xs font-mono">
                                        {currentFile?.transactions?.length > 0 ? (
                                            currentFile.transactions.map((tx, idx) => (
                                                <tr key={idx} className="hover:bg-slate-900/50 transition duration-150">
                                                    <td className="px-6 py-4 text-emerald-400 font-medium whitespace-nowrap">{tx.date}</td>
                                                    <td className="px-6 py-4 text-slate-300 leading-relaxed max-w-sm" style={{ fontFamily: 'inherit' }}>{tx.description}</td>
                                                    <td className="px-6 py-4 text-right text-emerald-400 font-bold tabular-nums">{tx.moneyIn && parseFloat(tx.moneyIn) > 0 ? tx.moneyIn : ''}</td>
                                                    <td className="px-6 py-4 text-right text-rose-400 font-bold tabular-nums">{tx.moneyOut && parseFloat(tx.moneyOut) > 0 ? tx.moneyOut : ''}</td>
                                                    <td className="px-6 py-4 text-right text-slate-300 font-bold tabular-nums whitespace-nowrap">{tx.balance}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-20 text-slate-500 text-sm italic border-none bg-slate-900/10">Basket empty or no transactions parsed</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: File List Sidebar */}
                    <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6 h-full overflow-hidden">
                        <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl flex flex-col shadow-lg shrink-0">
                            <h3 className="text-white font-bold mb-2">Basket Overview</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <span className={`w-2 h-2 rounded-full ${activeBasket.files.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-500'}`}></span>
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                                    {activeBasket.files.length > 0 ? 'Draft Pending Save' : 'Empty'}
                                </span>
                            </div>
                            <button
                                onClick={handleSaveBasket}
                                disabled={activeBasket.files.length === 0 || savingBank}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 disabled:shadow-none text-white font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.2)] border border-emerald-500/50 active:scale-95 duration-200"
                            >
                                {savingBank ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                SAVE BASEKT & SYNC
                            </button>
                        </div>

                        <div className="flex-1 bg-slate-900 border border-white/5 p-4 rounded-3xl flex flex-col overflow-hidden shadow-lg">
                            <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 px-2 tracking-[0.2em]">Live Documents ({activeBasket.files.length})</h4>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {activeBasket.files.map((file, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveFileIndex(idx)}
                                        className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 flex items-center group relative border ${activeFileIndex === idx ? 'bg-emerald-500/10 border-emerald-500/30 shadow-inner' : 'bg-slate-950/50 border-white/5 hover:border-emerald-500/20'}`}
                                    >
                                        <div className="flex-1 min-w-0 pr-8">
                                            <p className="text-xs font-bold text-white truncate mb-1">
                                                {file.dateRange && file.dateRange !== "Unknown Date Range" ? file.dateRange : (file.originalName || 'Bank Statement')}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-mono tracking-tight">{file.transactions?.length || 0} extracted txs</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteFile(idx); }}
                                            className="absolute right-4 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-500/10 rounded-lg"
                                            title="Remove File from Draft"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {activeBasket.files.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-4">
                                        <FileText size={48} className="mb-4 text-slate-400" />
                                        <p className="text-slate-500 text-xs font-medium">Your parsed files will queue up here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {uploadingBank && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-[40px] m-4 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500 blur-[50px] opacity-20 rounded-full animate-pulse"></div>
                            <Loader2 size={64} className="text-emerald-500 animate-spin mb-8 relative z-10" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] mb-3">Scanning Database</h2>
                        <p className="text-emerald-400 font-mono text-sm tracking-tight">{message}</p>
                    </div>
                )}
            </div>
        );
    };

    return activeBasketId ? renderActiveBasket() : renderDashboard();
}
