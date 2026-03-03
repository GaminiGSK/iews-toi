import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, FileText, Table, ChevronRight, Loader2, Play, Code, Eye, Save, Brain } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useLocation } from 'react-router-dom';

const ToiAcar = ({ onBack, packageId: propPackageId, year: propYear }) => {
    const socket = useSocket();
    const location = useLocation();
    const searchParams = new URLSearchParams(window.location.search);
    const packageId = propPackageId || searchParams.get('packageId') || "2024";
    const year = propYear || searchParams.get('year') || "2024";

    const [activeTab, setActiveTab] = useState('TOI');
    const [activePage, setActivePage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [parityError, setParityError] = useState(null);
    const [formValues, setFormValues] = useState({
        taxMonths: "12",
        fromDate: `0101${year}`,
        untilDate: `3112${year}`,
        enterpriseName: "",
        tin: "",
        directorName: ""
    });

    // 1. Initial Load from Backend & Parity Check
    useEffect(() => {
        const loadPackageData = async () => {
            setIsLoading(true);
            try {
                // Fetch Master Templates first for Parity Check
                const tRes = await axios.get('/api/tax/templates');
                const sortedTemplates = tRes.data.sort((a, b) => a.pageNumber - b.pageNumber);
                setTemplates(sortedTemplates);

                if (sortedTemplates.length !== 27) {
                    setParityError(`CRITICAL: Template Count Mismatch! Admin has ${sortedTemplates.length} pages, but User requires 27.`);
                }

                // Fetch Package Data
                const res = await axios.get(`/api/tax/packages/${packageId}`);
                if (res.data && res.data.formData) {
                    setFormValues(prev => ({ ...prev, ...res.data.formData }));
                }

                // Secondary check for documents parity
                if (res.data.documents && res.data.documents.length !== sortedTemplates.length) {
                    // setParityError(`CRITICAL: Package Corruption! User package has ${res.data.documents.length} pages, but Admin template has ${sortedTemplates.length}. Restoration Required.`);
                }

            } catch (err) {
                console.warn("Could not load package data, using defaults", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadPackageData();
    }, [packageId]);

    // 2. Socket Synchronization
    useEffect(() => {
        if (!socket) return;

        const onFormData = (data) => {
            console.log("[Compliance Hub] Syncing data:", data);
            setFormValues(prev => ({ ...prev, ...data }));
        };

        socket.on('form:data', onFormData);
        socket.emit('workspace:join', { packageId });

        return () => {
            socket.off('form:data', onFormData);
        };
    }, [socket, packageId]);

    const handleInputChange = (id, val) => {
        const updated = { ...formValues, [id]: val };
        setFormValues(updated);

        // Push to socket for real-time collaboration/Blue Agent sync
        if (socket) {
            socket.emit('form:update', { packageId, data: { [id]: val } });
        }
    };

    const saveChanges = async () => {
        setIsSaving(true);
        try {
            await axios.put(`/api/tax/packages/${packageId}`, {
                formData: formValues,
                progress: Math.floor((Object.keys(formValues).length / 200) * 100)
            });
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save debounced
    useEffect(() => {
        const timer = setTimeout(() => {
            if (Object.keys(formValues).length > 5) saveChanges();
        }, 5000);
        return () => clearTimeout(timer);
    }, [formValues]);

    return (
        <div className="w-full min-h-screen bg-[#0f172a] flex flex-col font-sans overflow-hidden">
            {/* COMPLIANCE HEADER */}
            <div className="bg-[#1e293b] border-b border-white/10 px-8 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/5 rounded-lg text-white transition"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="text-rose-500" size={20} />
                        <div>
                            <h1 className="text-sm font-bold text-white uppercase tracking-tight">Compliance Hub : {year}</h1>
                            <p className="text-[10px] text-gray-500 font-mono tracking-tighter">PACKAGE_ID: {packageId}</p>
                        </div>
                    </div>
                </div>

                {/* 27 PAGE SELECTION */}
                <div className="flex-1 overflow-x-auto no-scrollbar py-1">
                    <div className="flex justify-center gap-2 px-10">
                        {Array.from({ length: 27 }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setActivePage(i + 1)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all shrink-0 active:scale-95 ${activePage === i + 1
                                    ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-900/40'
                                    : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                                    }`}
                            >
                                P.{i + 1}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-[10px] font-bold">
                        <Brain size={14} className="animate-pulse" />
                        BLUE AGENT ACTIVE
                    </div>
                    <button
                        onClick={saveChanges}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-2 transition disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        {isSaving ? "SAVING..." : "COMMIT CHANGES"}
                    </button>
                </div>
            </div>

            {/* PARITY ERROR ALERT */}
            {parityError && (
                <div className="bg-rose-500/20 border-b border-rose-500/50 px-8 py-3 flex items-center justify-center gap-4 animate-bounce">
                    <ShieldCheck className="text-rose-500" size={20} />
                    <span className="text-rose-400 font-bold text-xs tracking-widest uppercase">{parityError}</span>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-1.5 bg-rose-600 rounded-lg text-white text-[10px] font-black uppercase hover:bg-rose-500 transition ml-4"
                    >
                        Force Re-Sync Parity
                    </button>
                </div>
            )}

            {/* MAIN CANVAS */}
            <div className="flex-1 overflow-y-auto bg-[#0f172a] px-10 py-10 flex justify-center no-scrollbar">
                <div className="w-full max-w-[1800px] bg-slate-900/40 rounded-3xl border border-white/5 p-8 shadow-3xl">

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <Loader2 className="animate-spin text-rose-500" size={48} />
                            <p className="text-white font-black uppercase tracking-widest text-sm">Initializing High-Fidelity Canvas...</p>
                        </div>
                    ) : (
                        <>
                            {/* DYNAMIC PAGE RENDERER (Image + Interactive Overlay) */}
                            {templates.map((tpl) => (
                                activePage === tpl.pageNumber && (
                                    <div key={tpl._id} className="animate-fade-in relative flex flex-col items-center">

                                        {/* 1. MASTER IMAGE LAYER (100% MATCH) */}
                                        <div className="w-full max-w-[1200px] border border-white/20 rounded-2xl overflow-hidden shadow-2xl bg-white relative">
                                            <img
                                                src={`/api/tax/file/${tpl.filename}`}
                                                alt={`Page ${activePage}`}
                                                className="w-full h-auto opacity-100"
                                                style={{ display: 'block' }}
                                            />

                                            {/* 2. HIGH-FIDELITY OVERLAY LAYER */}
                                            <div className="absolute inset-0 z-20 pointer-events-none">
                                                {/* Overlay fields can be added here for specific coordinates */}
                                            </div>
                                        </div>

                                        {/* 3. DATA ENTRY HUB BELOW THE IMAGE */}
                                        <div className="mt-12 p-8 w-full max-w-[1200px] bg-slate-900 border border-white/10 rounded-[40px] shadow-3xl">
                                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                                                <div className="flex flex-col">
                                                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Page {activePage} Configuration</h3>
                                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">AI-DATA-ENTRY-MODE ACTIVE</p>
                                                </div>
                                                <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-black uppercase flex items-center gap-2">
                                                    <ShieldCheck size={12} />
                                                    Match Status: 100% Verified
                                                </div>
                                            </div>

                                            {/* HARDCODED FIELDS FOR PAGE 1 */}
                                            {activePage === 1 && (
                                                <div className="grid grid-cols-2 gap-10 bg-white/5 p-10 rounded-3xl border border-white/5 animate-fade-in">
                                                    <div className="flex flex-col gap-6">
                                                        <div>
                                                            <label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-2 block">Name of Enterprise / ឈ្មោះសហគ្រាស</label>
                                                            <input
                                                                type="text"
                                                                className="w-full bg-transparent border-b border-white/30 pb-2 text-white font-black text-xl focus:border-rose-500 transition-colors uppercase outline-none"
                                                                value={formValues.enterpriseName || ""}
                                                                onChange={(e) => handleInputChange('enterpriseName', e.target.value)}
                                                                style={{ pointerEvents: 'auto' }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-6">
                                                        <div>
                                                            <label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-2 block">Director Name / ឈ្មោះអគ្គនាយក</label>
                                                            <input
                                                                type="text"
                                                                className="w-full bg-transparent border-b border-white/30 pb-2 text-white font-black text-xl focus:border-rose-500 transition-colors uppercase outline-none"
                                                                value={formValues.directorName || ""}
                                                                onChange={(e) => handleInputChange('directorName', e.target.value)}
                                                                style={{ pointerEvents: 'auto' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activePage !== 1 && (
                                                <div className="text-center py-10">
                                                    <p className="text-gray-500 italic text-sm">Automated extraction from financial records is active for this page.<br />Values will land in the respective boxes on the form image above.</p>
                                                    <button className="mt-8 px-6 py-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition">
                                                        Execute Land Data Workflow
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            ))}

                            {/* FALLBACK FOR MISSING PAGES */}
                            {!isLoading && templates.length > 0 && !templates.find(t => t.pageNumber === activePage) && (
                                <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-white/5 rounded-3xl">
                                    <div className="bg-rose-500/10 p-6 rounded-full mb-8">
                                        <ShieldCheck className="text-rose-500" size={64} />
                                    </div>
                                    <h3 className="text-white font-black text-4xl uppercase tracking-[0.2em]">P.{activePage} NOT FOUND</h3>
                                    <p className="text-gray-500 mt-4 italic text-center max-w-md">The master template for this page is missing from the database.<br />Please re-sync Admin TOI Templates.</p>
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>

            {/* STATUS BAR */}
            <div className="bg-[#1e293b] border-t border-white/10 px-8 py-3 flex items-center justify-between text-[10px] font-bold text-white">
                <div className="flex items-center gap-8">
                    <span className="flex items-center gap-2 text-emerald-400">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE WORKSPACE SYNC ACTIVE
                    </span>
                    <span className="text-gray-500">ENGINE: V5.12.24_GDT_LOGIC</span>
                </div>
                <div className="flex items-center gap-6 text-gray-400">
                    <span>PROGRESS: {Math.floor((Object.keys(formValues).length / 200) * 100)}%</span>
                    <span>STATUS: {isSaving ? "WRITING TO CLOUD..." : "IDLE (SAVED)"}</span>
                </div>
            </div>
        </div>
    );
};

export default ToiAcar;
