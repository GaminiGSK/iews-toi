import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, FileText, Table, ChevronRight, Loader } from 'lucide-react';
import axios from 'axios';

const ToiAcar = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState('TOI'); // 'TOI' or 'ACAR'
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activePageIndex, setActivePageIndex] = useState(0);

    // Fetch Templates on Mount
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get('/api/tax/templates');
                // Ensure Sorted by Filename or Name to keep page order
                const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

                // Enhance with Mappings for safety (though backend provides them)
                setTemplates(sorted.map(t => ({
                    ...t,
                    status: 'Saved', // Force 'Saved' as these are from DB
                    previewUrl: `/api/tax/file/${t.filename}`
                })));
            } catch (err) {
                console.error("Failed to load tax templates", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const activeTemplate = templates[activePageIndex];

    return (
        <div className="w-full h-[calc(100vh-80px)] pt-6 px-4 animate-fade-in flex flex-col">
            {/* Header / Back */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition shrink-0 shadow-md"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <ShieldCheck className="text-rose-400" />
                            TOI & ACAR Compliance
                        </h1>
                        <p className="text-gray-400 text-sm">Manage Tax on Income (TOI) and ACAR Reporting.</p>
                    </div>
                </div>
            </div>

            {/* Main Tabs (TOI vs ACAR) */}
            <div className="flex bg-slate-800/50 p-1 rounded-xl w-fit mb-4 border border-white/5 backdrop-blur-sm">
                <button
                    onClick={() => setActiveTab('TOI')}
                    className={`px-8 py-3 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'TOI' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <FileText size={16} />
                    TOI Form
                </button>
                <button
                    onClick={() => setActiveTab('ACAR')}
                    className={`px-8 py-3 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'ACAR' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Table size={16} />
                    ACAR
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl animate-fade-in relative flex flex-col">

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 gap-2">
                        <Loader className="animate-spin" /> Loading Forms...
                    </div>
                ) : activeTab === 'TOI' ? (
                    <div className="flex h-full">
                        {/* Page Tabs Sidebar */}
                        <div className="w-64 bg-slate-900 border-r border-white/10 overflow-y-auto p-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Form Sections</h3>
                            <div className="flex flex-col gap-2">
                                {templates.map((t, idx) => (
                                    <button
                                        key={t._id}
                                        onClick={() => setActivePageIndex(idx)}
                                        className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${idx === activePageIndex ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-gray-400 hover:bg-white/5'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span>{t.name.replace('.jpg', '').replace('.png', '') || `Page ${idx + 1}`}</span>
                                            {idx === activePageIndex && <ChevronRight size={14} />}
                                        </div>
                                    </button>
                                ))}
                                {templates.length === 0 && <p className="text-gray-600 text-xs italic">No templates configured.</p>}
                            </div>
                        </div>

                        {/* Interactive Form Area */}
                        <div className="flex-1 bg-gray-950 relative overflow-hidden flex flex-col">
                            {activeTemplate ? (
                                <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-900">
                                    <div className="relative shadow-2xl bg-white min-w-[800px] min-h-[1100px]" style={{ width: '800px' }}>
                                        {/* Background Image */}
                                        <img
                                            src={activeTemplate.previewUrl}
                                            alt="Form Page"
                                            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90"
                                        />

                                        {/* Input Overlays */}
                                        {activeTemplate.mappings?.map(field => (
                                            <div
                                                key={field.id}
                                                className="absolute"
                                                style={{
                                                    left: `${field.x}%`,
                                                    top: `${field.y}%`,
                                                    width: `${field.w}%`,
                                                    height: `${field.h}%`,
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    className="w-full h-full bg-blue-50/10 hover:bg-blue-50/30 focus:bg-white/80 border border-transparent focus:border-blue-500 text-[10px] px-1 transition text-emerald-900 font-bold"
                                                    placeholder={field.semanticLabel || ''}
                                                    title={field.label}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500">Select a page to start.</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-gray-400">ACAR Module Coming Soon...</div>
                )}
            </div>
        </div>
    );
};

export default ToiAcar;
