import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    UserPlus, LogOut, Building, Mail, Lock, Unlock, Edit2, Trash2,
    FileText, CloudUpload, X, CheckCircle, Save, Loader2, Sparkles,
    FileSpreadsheet, Table, Combine
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    // --- State Management ---
    const [users, setUsers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ companyName: '', password: '' });
    const [isChangingCode, setIsChangingCode] = useState(false);
    const [newAdminCode, setNewAdminCode] = useState('');
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('users');

    // Document AI State
    const [templates, setTemplates] = useState([]);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisStep, setAnalysisStep] = useState('');
    const [analysisLogs, setAnalysisLogs] = useState([]);
    const [activeFeatureTab, setActiveFeatureTab] = useState('OCR');
    const [extractedData, setExtractedData] = useState({
        ocr: [],
        kv: [],
        tables: []
    });
    const navigate = useNavigate();
    // Excel Engine State
    const [excelFiles, setExcelFiles] = useState([]);
    const [activeExcelId, setActiveExcelId] = useState(null);
    const [excelData, setExcelData] = useState(null);
    const [isMappingMode, setIsMappingMode] = useState(false);
    const [cellMappings, setCellMappings] = useState({});
    const [resizingCol, setResizingCol] = useState(null);
    const [selectedRange, setSelectedRange] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);


    // --- Fetching Logic ---
    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/auth/users');
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchExcelFiles = async () => {
        try {
            const res = await axios.get('/api/excel');
            setExcelFiles(res.data.map(d => ({
                id: d._id,
                name: d.name,
                size: d.size || '0 KB',
                uploadedAt: new Date(d.uploadedAt).toLocaleString(),
                isStored: true
            })));
        } catch (err) { console.error("Failed to load excel files", err); }
    };

    const fetchTemplates = async () => {
        try {
            const res = await axios.get('/api/tax/templates');
            setTemplates(res.data);
        } catch (err) { console.error("Failed to load templates", err); }
    };

    useEffect(() => {
        fetchUsers();
        fetchExcelFiles();
        fetchTemplates();
    }, []);

    // --- User Management Handlers ---
    const resetForm = () => {
        setFormData({ companyName: '', password: '' });
        setIsCreating(false);
        setIsEditing(false);
        setEditingId(null);
        setMessage('');
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/create-user', formData);
            resetForm();
            fetchUsers();
        } catch (err) { setMessage(err.response?.data?.message || 'Error creating user'); }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/auth/users/${editingId}`, formData);
            resetForm();
            fetchUsers();
        } catch (err) { setMessage(err.response?.data?.message || 'Error updating user'); }
    };

    const startEdit = (user) => {
        setFormData({ companyName: user.companyName, password: user.loginCode });
        setEditingId(user._id);
        setIsEditing(true);
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this company?')) return;
        try {
            await axios.delete(`/api/auth/users/${id}`);
            fetchUsers();
        } catch (err) { alert('Error deleting user'); }
    };

    const handleUpdateCode = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/update-gate-code', { type: 'admin', newCode: newAdminCode });
            alert('Admin Login Code Updated Successfully!');
            setIsChangingCode(false);
            setNewAdminCode('');
        } catch (err) { alert('Error updating code'); }
    };

    // --- Document AI Handlers ---
    const handleAnalyze = async () => {
        if (!activeTemplate) return alert("Select a template first.");

        console.log("[Document AI] Starting Neural Logic Scan for:", activeTemplate.name);
        setIsAnalyzing(true);
        setAnalysisProgress(0);
        setAnalysisLogs(["[SYSTEM] Initializing Neural Link...", "[CORE] Detecting Document Schema..."]);

        const steps = [
            { label: 'Initializing Neural Core...', p: 10, log: "[CORE] Neural Core v4.0 Active" },
            { label: 'Connecting to Vision Matrix...', p: 30, log: "[SYSTEM] Establishing SSL Handshake..." },
            { label: 'Scanning Spatial Layers...', p: 60, log: "[INGEST] Deep Scanning OCR Layers..." },
            { label: 'Optimizing Neural Weights...', p: 85, log: "[LANG] Resolution: High-Fidelity Khmer Detection" }
        ];

        try {
            // Start visual progress
            let currentP = 0;
            const progressRef = setInterval(() => {
                if (currentP < 95) {
                    currentP += 1;
                    setAnalysisProgress(currentP);
                    const step = steps.find(s => s.p === currentP);
                    if (step) {
                        setAnalysisStep(step.label);
                        setAnalysisLogs(prev => [...prev, step.log]);
                    }
                }
            }, 100);

            // Real API Call
            const res = await axios.post('/api/vision/extract', { templateId: activeTemplate._id });
            clearInterval(progressRef);

            setAnalysisProgress(100);
            setAnalysisStep("Extraction Complete");
            setAnalysisLogs(prev => [...prev, "[SYSTEM] Neural Scan 100% Complete.", `[DATA] Captured ${res.data.ocr?.length || 0} Text Elements.`]);

            setExtractedData(res.data);
            console.log("[Document AI] Real Neural Data Loaded.");
        } catch (err) {
            console.error("[Document AI] Neural Scan Error:", err);
            setAnalysisLogs(prev => [...prev, "!! ERROR: Neural Link Interrupted !!", `!! MESSAGE: ${err.response?.data?.error || "Connection Timeout"}`]);
            alert(err.response?.data?.error || "Extraction Failed. Is your API key configured?");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDropTemplate = async (e) => {
        e.preventDefault(); e.stopPropagation();
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
        if (files.length === 0) return alert("Only Images or PDFs allowed.");

        setIsUploadingTemplate(true);
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));

        try {
            await axios.post('/api/tax/templates', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchTemplates();
        } catch (err) {
            console.error(err);
            alert("Upload Failed");
        } finally {
            setIsUploadingTemplate(false);
        }
    };

    const handleDeleteTemplate = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Delete this template?")) return;
        try {
            await axios.delete(`/api/tax/templates/${id}`);
            fetchTemplates();
        } catch (err) { alert("Delete Failed"); }
    };

    // --- Excel Engine Handlers ---
    useEffect(() => {
        if (resizingCol) {
            const handleMove = (e) => {
                const diff = (e.clientX - resizingCol.startX);
                setExcelData(prev => {
                    const nextWidths = [...(prev.colWidths || [])];
                    while (nextWidths.length <= resizingCol.index) nextWidths.push(80);
                    nextWidths[resizingCol.index] = Math.max(30, resizingCol.startWidth + diff);
                    return { ...prev, colWidths: nextWidths };
                });
            };
            const handleUp = () => setResizingCol(null);
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
            return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
        }
    }, [resizingCol]);

    useEffect(() => {
        const handleUp = () => setIsSelecting(false);
        window.addEventListener('mouseup', handleUp);
        return () => window.removeEventListener('mouseup', handleUp);
    }, []);

    const handleColResizeStart = (e, index) => {
        e.preventDefault(); e.stopPropagation();
        const currentWidth = (excelData?.colWidths && excelData.colWidths[index]) ? excelData.colWidths[index] : 80;
        setResizingCol({ index, startX: e.clientX, startWidth: currentWidth });
    };

    const handleCellMouseDown = (r, c, e) => {
        if (e.button === 2) {
            if (!selectedRange) setSelectedRange({ r1: r, c1: c, r2: r, c2: c });
            return;
        }
        setIsSelecting(true);
        setSelectedRange({ r1: r, c1: c, r2: r, c2: c });
    };

    const handleCellMouseEnter = (r, c) => {
        if (isSelecting) setSelectedRange(prev => ({ ...prev, r2: r, c2: c }));
    };

    const performDeleteColumn = (colIndex, silent = false) => {
        if (!silent && !window.confirm("Delete Column " + String.fromCharCode(65 + colIndex) + "?")) return;
        setExcelData(prev => {
            const newRows = prev.rows.map(r => r.filter((_, i) => i !== colIndex));
            const newWidths = (prev.colWidths || []).filter((_, i) => i !== colIndex);
            const newMerges = (prev.merges || []).map(m => {
                if (m.e.c < colIndex) return m;
                let sC = m.s.c, eC = m.e.c;
                if (sC > colIndex) sC--;
                if (eC >= colIndex) eC--;
                if (eC < sC) return null;
                return { ...m, s: { ...m.s, c: sC }, e: { ...m.e, c: eC } };
            }).filter(Boolean);
            return { ...prev, rows: newRows, colWidths: newWidths, merges: newMerges, headers: (prev.headers || []).filter((_, i) => i !== colIndex) };
        });
        setCellMappings(prev => {
            const next = {};
            Object.entries(prev).forEach(([key, val]) => {
                const [r, c] = key.split('_').map(Number);
                if (c === colIndex) return;
                if (c > colIndex) next[`${r}_${c - 1}`] = val;
                else next[key] = val;
            });
            return next;
        });
    };

    const handleAiClean = async () => {
        if (!excelData?.rows) return;
        setIsAiAnalyzing(true);
        try {
            const res = await axios.post('/api/excel/ai-clean', { rows: excelData.rows });
            const { delete_col_a, merge_suggestion } = res.data;
            if (delete_col_a) {
                if (window.confirm(`AI Analysis: Column A appears to be just Index Numbers.\n\nSuggestion: Delete Column A?`)) {
                    performDeleteColumn(0, true);
                }
            } else {
                alert("AI Analysis: No critical structure fixes found.\n" + (merge_suggestion || ""));
            }
        } catch (err) { alert("AI Analysis Failed"); }
        finally { setIsAiAnalyzing(false); }
    };

    const removeEmptyA = () => { if (excelData?.rows?.length) performDeleteColumn(0, true); };

    const handleDropExcel = async (e) => {
        e.preventDefault(); e.stopPropagation();
        const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
        if (files.length === 0) return alert("Only Excel files allowed.");
        const file = files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            const merges = ws['!merges'] || [];
            const colWidths = (ws['!cols'] || []).map(c => c.wpx ? c.wpx : (c.width ? c.width * 7 : 64));
            const rowHeights = (ws['!rows'] || []).map(r => r.hpx ? r.hpx : 20);
            const maxCols = rawData.reduce((acc, row) => Math.max(acc, row.length), 0);
            const normalizedRows = rawData.map(row => {
                const newRow = [...row];
                while (newRow.length < maxCols) newRow.push('');
                return newRow;
            });
            try {
                await axios.post('/api/excel', {
                    name: file.name,
                    size: (file.size / 1024).toFixed(2) + ' KB',
                    headers: normalizedRows[0] || [],
                    rows: normalizedRows,
                    merges, colWidths, rowHeights, cellMappings: {}
                });
                fetchExcelFiles();
            } catch (e) { alert("Upload Failed"); }
        };
        reader.readAsBinaryString(file);
    };

    const handleSelectExcel = async (fileObj) => {
        setActiveExcelId(fileObj.id);
        try {
            const res = await axios.get(`/api/excel/${fileObj.id}`);
            setExcelData({
                headers: res.data.headers,
                rows: res.data.rows,
                merges: res.data.merges || [],
                colWidths: res.data.colWidths || [],
                rowHeights: res.data.rowHeights || []
            });
            setCellMappings(res.data.cellMappings || {});
        } catch (e) { alert("Failed to load content"); }
    };

    const handleDeleteExcel = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Delete this file?")) return;
        try {
            await axios.delete(`/api/excel/${id}`);
            if (activeExcelId === id) { setActiveExcelId(null); setExcelData(null); }
            fetchExcelFiles();
        } catch (err) { alert("Delete failed"); }
    };

    const handleCellClick = (r, c) => {
        if (!isMappingMode) return;
        const key = `${r}_${c}`;
        const currentVal = cellMappings[key] || '';
        const newVal = window.prompt(`Assign Variable to Cell [${r},${c}]:`, currentVal);
        if (newVal !== null) {
            setCellMappings(prev => {
                const next = { ...prev };
                if (newVal === '') delete next[key];
                else next[key] = newVal;
                return next;
            });
        }
    };

    const handleSaveExcelMappings = async () => {
        if (!activeExcelId) return;
        try {
            await axios.put(`/api/excel/${activeExcelId}`, {
                cellMappings,
                colWidths: excelData.colWidths,
                rowHeights: excelData.rowHeights,
                merges: excelData.merges
            });
            alert("Saved Successfully!");
        } catch (e) { alert("Error saving mappings."); }
    };

    const getCellMergeProps = (rowIndex, colIndex, merges) => {
        if (!merges) return {};
        for (let m of merges) {
            if (m.s.r === rowIndex && m.s.c === colIndex) return { rowspan: m.e.r - m.s.r + 1, colspan: m.e.c - m.s.c + 1 };
            if (rowIndex >= m.s.r && rowIndex <= m.e.r && colIndex >= m.s.c && colIndex <= m.e.c) return { hidden: true };
        }
        return {};
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    // --- Template ---
    return (
        <div className="min-h-screen bg-black text-white p-10 font-sans">
            <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">GK</div>
                    <span className="font-bold text-lg tracking-tight">GK SMART <span className="text-gray-400 font-normal">& Ai</span></span>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setIsChangingCode(true)} className="text-gray-400 hover:text-white transition text-sm font-medium px-4 py-2">Change Admin Code</button>
                    <button onClick={handleLogout} className="bg-white/10 text-white border border-white/20 px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition">Log Out</button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mb-10 border-b border-gray-800 flex gap-8">
                <button onClick={() => setActiveTab('users')} className={`pb-4 text-sm uppercase tracking-widest font-black flex items-center gap-2 border-b-2 transition-all ${activeTab === 'users' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500'}`}>
                    <UserPlus size={16} /> User Matrix
                </button>
                <button onClick={() => setActiveTab('tax_forms')} className={`pb-4 text-sm uppercase tracking-widest font-black flex items-center gap-2 border-b-2 transition-all ${activeTab === 'tax_forms' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-500'}`}>
                    <Sparkles size={16} /> Document AI
                </button>
                <button onClick={() => setActiveTab('excel_merge')} className={`pb-4 text-sm uppercase tracking-widest font-black flex items-center gap-2 border-b-2 transition-all ${activeTab === 'excel_merge' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-500'}`}>
                    <FileSpreadsheet size={16} /> Excel Merging
                </button>
            </div>

            {activeTab === 'users' && (
                <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Registered Companies</h2>
                            <p className="text-gray-400 text-sm">Manage client access and company profiles.</p>
                        </div>
                        <button onClick={() => { resetForm(); setIsCreating(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition flex items-center gap-2">
                            <UserPlus size={18} /> Create New User
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.map((user) => (
                            <div key={user._id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex justify-between items-center group hover:border-blue-500/50 transition">
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors uppercase">{user.companyName}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-mono mt-1"><Lock size={12} /> {user.loginCode}</div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => startEdit(user)} className="p-2 text-gray-400 hover:text-blue-400 rounded-lg transition"><Edit2 size={18} /></button>
                                    <button onClick={() => deleteUser(user._id)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg transition"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'tax_forms' && (
                <div className="flex flex-1 gap-4 px-4 w-full h-[calc(100vh-220px)] animate-in fade-in duration-700">
                    {/* LEFT PANEL: SLIM INGESTION & LIBRARY */}
                    <div className="w-72 shrink-0 flex flex-col gap-3">
                        <div
                            onDrop={handleDropTemplate}
                            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                            className="h-32 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 flex flex-col items-center text-center shadow-xl group hover:border-emerald-500/30 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute -top-10 -left-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-[30px]"></div>
                            {isUploadingTemplate ? (
                                <Loader2 size={24} className="text-emerald-400 animate-spin my-auto" />
                            ) : (
                                <div className="my-auto flex flex-col items-center">
                                    <CloudUpload size={20} className="text-emerald-400 mb-2 group-hover:scale-110 transition" />
                                    <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Ingest Template</h2>
                                    <p className="text-gray-500 text-[8px] uppercase tracking-tighter mt-1">Images / PDFs</p>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 bg-black/40 rounded-3xl p-4 overflow-y-auto border border-white/5 no-scrollbar">
                            <h4 className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-4 flex items-center gap-2">
                                <FileText size={10} /> Library ({templates.length})
                            </h4>
                            <div className="space-y-2">
                                {templates.map(tmp => (
                                    <div
                                        key={tmp._id}
                                        onClick={() => setActiveTemplate(tmp)}
                                        className={`p-2 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between group hover:bg-white/10 transition cursor-pointer ${activeTemplate?._id === tmp._id ? 'border-emerald-400 bg-emerald-400/5' : ''}`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                <FileText size={12} className="text-emerald-400" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="text-[9px] font-bold text-white truncate">{tmp.name}</div>
                                                <div className="text-[7px] text-gray-500 uppercase">Neural Ready</div>
                                            </div>
                                        </div>
                                        <button onClick={(e) => handleDeleteTemplate(e, tmp._id)} className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CENTRAL PANEL: DOCUMENT WORKSPACE */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                        {!activeTemplate ? (
                            <div className="flex-1 bg-white/5 rounded-[40px] border border-white/5 flex flex-col items-center justify-center opacity-20">
                                <FileText size={60} className="text-gray-500 mb-4" />
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.4em]">Document Stage</h3>
                                <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-2">Select a template to begin analysis</p>
                            </div>
                        ) : (
                            <div className="flex-1 bg-black rounded-[40px] border border-white/10 relative overflow-hidden flex items-center justify-center group/stage">
                                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-blue-500/5"></div>

                                {activeTemplate.filename ? (
                                    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-auto no-scrollbar">
                                        <div className="relative animate-in zoom-in duration-500">
                                            <img
                                                src={`/api/tax/file/${activeTemplate.filename}`}
                                                alt="Review"
                                                className={`max-w-none w-auto h-[700px] object-contain shadow-2xl rounded-sm transition-all duration-1000 ${isAnalyzing ? 'blur-md opacity-30 grayscale' : 'opacity-100'}`}
                                            />
                                            {/* Simulated Bounding Boxes */}
                                            {!isAnalyzing && extractedData.ocr.length > 0 && extractedData.ocr.map((box, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute border border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400 hover:bg-emerald-500/10 cursor-alias transition-all"
                                                    style={{
                                                        left: `${box.x}%`,
                                                        top: `${box.y}%`,
                                                        width: `${box.w}%`,
                                                        height: `${box.h}%`,
                                                        zIndex: 30
                                                    }}
                                                    title={`${box.eng}\n${box.khr}`}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <FileText size={64} className="text-gray-800" />
                                )}

                                {isAnalyzing && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 backdrop-blur-sm bg-black/20">
                                        <div className="w-16 h-16 relative mb-6">
                                            <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full"></div>
                                            <div className="absolute inset-0 border-2 border-t-emerald-500 rounded-full animate-spin"></div>
                                            <Sparkles size={24} className="absolute inset-0 m-auto text-emerald-400 animate-pulse" />
                                        </div>
                                        <div className="text-center space-y-3">
                                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em]">{analysisStep}</p>
                                            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
                                                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${analysisProgress}%` }}></div>
                                            </div>
                                            <p className="text-[32px] font-black text-white font-mono">{analysisProgress}%</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* BOTTOM TOOLBAR */}
                        <div className="h-16 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between px-6 shrink-0">
                            <div className="flex gap-4">
                                <button onClick={handleAnalyze} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition active:scale-95">
                                    <Sparkles size={14} /> Run Neural Extract
                                </button>
                                <button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2 rounded-xl text-[9px] font-medium uppercase tracking-widest transition">
                                    Khmer Logic Detect
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-[10px] text-gray-500 font-mono">STATUS: <span className={isAnalyzing ? 'text-amber-500' : 'text-emerald-500'}>{isAnalyzing ? 'SCANNING' : 'SYSTEM READY'}</span></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: FUNCTION TABS (GOOGLE CLOUD STYLE) */}
                    <div className="w-96 shrink-0 flex flex-col gap-4">
                        <div className="flex-1 bg-white/5 rounded-[40px] border border-white/10 flex flex-col overflow-hidden shadow-2xl">
                            {/* Tabs Header */}
                            <div className="flex bg-white/5 border-b border-white/10 shrink-0">
                                {['FIELDS', 'KV PAIRS', 'TABLES', 'OCR'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveFeatureTab(tab)}
                                        className={`flex-1 py-4 text-[9px] font-black tracking-widest transition-all relative ${activeFeatureTab === tab ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        {tab}
                                        {activeFeatureTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>}
                                    </button>
                                ))}
                            </div>

                            {/* Feature Body */}
                            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                                {activeFeatureTab === 'FIELDS' && (
                                    <div className="space-y-4 animate-in slide-in-from-right-4">
                                        <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Detected Global Entities</h5>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                                <span className="text-[10px] font-bold text-gray-400">Process Method</span>
                                                <span className="text-[10px] font-black text-emerald-400">NEURAL V3</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="text-[8px] text-gray-500 uppercase tracking-widest">Confidence Scores</div>
                                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 w-[98%]"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeFeatureTab === 'OCR' && (
                                    <div className="space-y-3 animate-in fade-in">
                                        <div className="flex justify-between items-center mb-4">
                                            <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Script Recognition</h5>
                                            <div className="flex gap-2">
                                                <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] rounded border border-blue-500/30">ENG</div>
                                                <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] rounded border border-emerald-500/30">KHR</div>
                                            </div>
                                        </div>
                                        {extractedData.ocr.length > 0 ? extractedData.ocr.map(line => (
                                            <div key={line.id} className="p-4 bg-white/[0.03] rounded-xl border border-white/5 group hover:border-emerald-500/30 transition">
                                                <div className="text-[11px] text-emerald-400 font-medium mb-1 line-clamp-2">{line.khr}</div>
                                                <div className="text-[10px] text-gray-400 font-medium italic">{line.eng}</div>
                                            </div>
                                        )) : (
                                            <div className="py-20 text-center opacity-20 flex flex-col items-center">
                                                <Loader2 size={32} className="mb-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Waiting for Scan...</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeFeatureTab === 'KV PAIRS' && (
                                    <div className="space-y-2 animate-in fade-in">
                                        <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Semantic Mappings</h5>
                                        {extractedData.kv.map((pair, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-emerald-500/5 transition">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">{pair.key}</span>
                                                <span className="text-[10px] font-black text-white">{pair.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeFeatureTab === 'TABLES' && (
                                    <div className="space-y-4 animate-in fade-in overflow-hidden">
                                        <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Table Extraction</h5>
                                        <div className="rounded-xl border border-white/10 overflow-hidden">
                                            <table className="w-full text-[9px] text-left">
                                                <thead className="bg-white/5 font-black text-gray-500">
                                                    <tr>
                                                        <th className="p-2 border-b border-white/10">ITEM</th>
                                                        <th className="p-2 border-b border-white/10 text-right">TAXABLE</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-gray-300">
                                                    {extractedData.tables.map((row, i) => (
                                                        <tr key={i} className="hover:bg-white/5 transition">
                                                            <td className="p-2 border-b border-white/5 font-medium">{row.item}</td>
                                                            <td className="p-2 border-b border-white/5 text-right font-mono text-emerald-400">{row.taxable}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Neural System Logs (Minimized) */}
                            <div className="h-32 bg-black/80 border-t border-white/10 p-4 font-mono overflow-y-auto no-scrollbar shrink-0">
                                <h6 className="text-[8px] font-black text-emerald-500/50 uppercase mb-2">Neural Link Status</h6>
                                {analysisLogs.map((log, i) => (
                                    <div key={i} className="text-[8px] text-gray-500 leading-tight mb-1 animate-in slide-in-from-left-1">
                                        <span className="opacity-30">[{new Date().toLocaleTimeString([], { hour12: false })}]</span> {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'excel_merge' && (
                <div className="flex flex-1 gap-6 px-6 w-full h-[calc(100vh-250px)] animate-in fade-in duration-700">
                    <div className="w-72 shrink-0 flex flex-col gap-4">
                        <div onDrop={handleDropExcel} onDragOver={e => { e.preventDefault(); e.stopPropagation(); }} className="h-40 bg-white/5 border-2 border-dashed border-amber-500/20 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-amber-500/50 hover:bg-amber-500/5 transition cursor-pointer group">
                            <CloudUpload size={32} className="mb-3 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Drop Excel Here</span>
                        </div>
                        <div className="flex-1 bg-black/20 rounded-2xl p-4 overflow-y-auto border border-white/5 no-scrollbar">
                            <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4 flex items-center gap-2"><Table size={12} /> Files</h4>
                            <div className="space-y-2">
                                {excelFiles.map(f => (
                                    <div key={f.id} onClick={() => handleSelectExcel(f)} className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between group ${activeExcelId === f.id ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/5 text-gray-300'}`}>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileSpreadsheet size={16} className={activeExcelId === f.id ? 'text-amber-400' : 'text-gray-500'} />
                                            <div className="text-[11px] font-bold truncate">{f.name}</div>
                                        </div>
                                        <button onClick={e => handleDeleteExcel(e, f.id)} className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-400 transition"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col relative text-black">
                        {!excelData ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
                                <Table size={64} className="mb-4" />
                                <h3 className="text-xl font-black uppercase tracking-widest">Spreadsheet Engine</h3>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto p-0.5">
                                <table className="border-collapse text-[10px] w-max">
                                    <thead>
                                        <tr>
                                            <th className="bg-gray-100 border border-gray-300 w-8"></th>
                                            {excelData.rows[0]?.map((_, i) => (
                                                <th key={i} className="bg-gray-100 border border-gray-300 px-1 py-1 text-center font-bold text-gray-500 relative" style={{ width: excelData.colWidths[i] ? `${excelData.colWidths[i]}px` : '80px' }}>
                                                    {(i >= 26 ? String.fromCharCode(65 + Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26))}
                                                    <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400" onMouseDown={e => handleColResizeStart(e, i)} />
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {excelData.rows.map((row, rI) => (
                                            <tr key={rI} style={{ height: excelData.rowHeights[rI] ? `${excelData.rowHeights[rI]}px` : '20px' }}>
                                                <td className="bg-gray-100 border border-gray-300 text-center font-bold text-gray-500">{rI + 1}</td>
                                                {row.map((cellVal, cI) => {
                                                    const { rowspan, colspan, hidden } = getCellMergeProps(rI, cI, excelData.merges);
                                                    if (hidden) return null;
                                                    const isSelected = selectedRange && rI >= Math.min(selectedRange.r1, selectedRange.r2) && rI <= Math.max(selectedRange.r1, selectedRange.r2) && cI >= Math.min(selectedRange.c1, selectedRange.c2) && cI <= Math.max(selectedRange.c1, selectedRange.c2);
                                                    const mappedVar = cellMappings[`${rI}_${cI}`];
                                                    return (
                                                        <td key={cI} colSpan={colspan} rowSpan={rowspan} onMouseDown={e => handleCellMouseDown(rI, cI, e)} onMouseEnter={() => handleCellMouseEnter(rI, cI)} onClick={() => handleCellClick(rI, cI)} className={`border border-gray-300 px-1 py-0.5 align-top truncate max-w-[200px] ${isSelected ? 'bg-blue-100 ring-1 ring-blue-500' : ''} ${mappedVar ? 'bg-amber-100 ring-1 ring-amber-400' : ''}`}>
                                                            {mappedVar ? <span className="text-[9px] font-bold text-amber-700 font-mono">${mappedVar}</span> : String(cellVal || '')}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {excelData && (
                            <div className="h-12 bg-gray-100 border-t border-gray-200 px-4 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                                <div className="flex items-center gap-4">
                                    <button onClick={handleAiClean} disabled={isAiAnalyzing} className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-500 shadow-sm flex items-center gap-2">{isAiAnalyzing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI Auto-Fix</button>
                                    <button onClick={removeEmptyA} className="bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200 flex items-center gap-1">Delete A</button>
                                    <button onClick={() => setIsMappingMode(!isMappingMode)} className={`px-3 py-1.5 rounded-md font-bold uppercase ${isMappingMode ? 'bg-amber-500 text-white shadow-lg' : 'bg-white border text-gray-600'}`}> {isMappingMode ? 'Mapping Active' : 'Enable Mapping'} </button>
                                    {isMappingMode && <button onClick={handleSaveExcelMappings} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-bold shadow-lg">Save</button>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isChangingCode && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white text-black p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button onClick={() => setIsChangingCode(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black font-black">X</button>
                        <h2 className="text-xl font-bold mb-6">Change Admin Code</h2>
                        <form onSubmit={handleUpdateCode} className="space-y-4">
                            <input className="w-full border p-2 rounded" value={newAdminCode} onChange={e => setNewAdminCode(e.target.value)} placeholder="New 6-Digit Code" type="text" maxLength="6" required />
                            <button className="w-full bg-black text-white py-2 rounded mt-4">Update Code</button>
                        </form>
                    </div>
                </div>
            )}

            {(isCreating || isEditing) && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white text-black p-8 rounded-xl shadow-lg w-full max-w-md relative">
                        <button onClick={resetForm} className="absolute top-4 right-4 text-gray-500 hover:text-black font-black">X</button>
                        <h2 className="text-2xl font-bold text-center mb-8 text-blue-600">{isEditing ? 'Edit Company' : 'Create Company'}</h2>
                        <form onSubmit={isEditing ? handleUpdateUser : handleCreateUser} className="space-y-6">
                            <input className="w-full p-2 border rounded" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value.toUpperCase() })} placeholder="COMPANY NAME" required />
                            <input className="w-full p-2 border rounded" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="PASSWORD" required />
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg">SAVE</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
