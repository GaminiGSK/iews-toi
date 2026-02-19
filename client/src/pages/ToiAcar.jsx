import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, FileText, Table, ChevronRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useLocation } from 'react-router-dom';

const ToiAcar = ({ onBack }) => {
    const socket = useSocket();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('TOI');
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activePageIndex, setActivePageIndex] = useState(0);
    const [formValues, setFormValues] = useState({});

    // Fetch Templates on Mount
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get('/api/tax/templates');
                const list = Array.isArray(res.data) ? res.data : [];
                // Ensure Sorted by Name
                const sorted = list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

                // Enhance
                setTemplates(sorted.map(t => ({
                    ...t,
                    status: 'Saved',
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

    useEffect(() => {
        if (!socket) return;

        // Listen for Agent-Driven Form Updates
        const onFormData = (data) => {
            console.log("[Blue Agent] Receiving Autonomous form data:", data);
            setFormValues(prev => ({ ...prev, ...data }));
        };

        socket.on('form:data', onFormData);

        // Join the workspace room (using packageId/year from URL)
        const searchParams = new URLSearchParams(window.location.search);
        const packageId = searchParams.get('packageId') || "2024"; // Default for now
        socket.emit('workspace:join', { packageId });

        return () => {
            socket.off('form:data', onFormData);
        };
    }, [socket]);

    const activeTemplate = templates[activePageIndex];

    // Blue Agent Logic to Auto-Fill Data
    const handleAutoFill = () => {
        if (!activeTemplate || !activeTemplate.mappings) return;

        const newValues = { ...formValues };
        const mappings = activeTemplate.mappings;

        // 1. Detect Year Boxes (Heuristic: 4 small boxes near each other)
        const smallBoxes = mappings.filter(m => m.w < 5 && m.y < 20); // Top of page, small width
        smallBoxes.sort((a, b) => a.x - b.x);

        if (smallBoxes.length >= 4) {
            const taxYear = "2024";
            // Ensure IDs are consistent
            newValues[smallBoxes[0].id || `auto_box_0`] = taxYear[0];
            newValues[smallBoxes[1].id || `auto_box_1`] = taxYear[1];
            newValues[smallBoxes[2].id || `auto_box_2`] = taxYear[2];
            newValues[smallBoxes[3].id || `auto_box_3`] = taxYear[3];
        } else {
            // Use Semantic Labels
            mappings.forEach(m => {
                const label = (m.semanticLabel || m.label || '').toLowerCase();
                // Heuristics for Year/Date
                if (label.includes('year') || label.includes('date')) {
                    newValues[m.id || `field_${m.x}_${m.y}`] = "2024";
                }
            });
        }

        setFormValues(newValues);
        // Optional: Show Toast? avoiding alert for better UX, but sticking to simple alert for now
        // alert("Blue Agent has populated the Tax Year.");
    };

    const handleInputChange = (id, val) => {
        setFormValues(prev => ({ ...prev, [id]: val }));
    };

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

                {/* Blue Agent Action */}
                <button
                    onClick={handleAutoFill}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-blue-500/30 transition flex items-center gap-2"
                >
                    <ShieldCheck size={18} />
                    Ask Blue Agent to Fill
                </button>
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
                        <Loader2 className="animate-spin" /> Loading Forms...
                    </div>
                ) : activeTab === 'TOI' ? (
                    <div className="flex h-full">
                        {/* Page Tabs Sidebar */}
                        <div className="w-64 bg-slate-900 border-r border-white/10 overflow-y-auto p-4 shrink-0">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Form Sections</h3>
                            <div className="flex flex-col gap-2">
                                {templates.map((t, idx) => (
                                    <button
                                        key={t._id || t.id}
                                        onClick={() => setActivePageIndex(idx)}
                                        className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${idx === activePageIndex ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-gray-400 hover:bg-white/5'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="truncate">{t.name.replace('.jpg', '').replace('.png', '') || `Page ${idx + 1}`}</span>
                                            {idx === activePageIndex && <ChevronRight size={14} />}
                                        </div>
                                    </button>
                                ))}
                                {templates.length === 0 && <p className="text-gray-600 text-xs italic">No templates configured.</p>}
                            </div>
                        </div>

                        {/* Interactive Form Area - LEFT ALIGNED based on Step 10509 request */}
                        <div className="flex-1 bg-gray-950 relative overflow-hidden flex flex-col">
                            {activeTemplate ? (
                                <div className="flex-1 overflow-auto p-4 flex justify-start bg-gray-900">
                                    <div className="relative shadow-2xl bg-white min-w-[800px] min-h-[1100px] ml-4" style={{ width: '800px' }}>
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
                                                    className="w-full h-full bg-transparent hover:bg-blue-50/10 focus:bg-white/80 border border-transparent focus:border-blue-500 text-[10px] px-1 transition text-emerald-900 font-bold text-center"
                                                    title={field.label || field.semanticLabel}
                                                    value={formValues[field.id] || ''}
                                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
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
