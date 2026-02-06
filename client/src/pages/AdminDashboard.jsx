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
    const [users, setUsers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ companyName: '', password: '' });
    const [isChangingCode, setIsChangingCode] = useState(false);
    const [newAdminCode, setNewAdminCode] = useState('');
    const [message, setMessage] = useState('');
    const [templates, setTemplates] = useState([]);
    const [activeTemplateId, setActiveTemplateId] = useState(null);
    const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
    const navigate = useNavigate();

    // Fetch users on mount
    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/auth/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
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

    // User Handlers
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
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error creating user');
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/auth/users/${editingId}`, formData);
            resetForm();
            fetchUsers();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error updating user');
        }
    };

    const startEdit = (user) => {
        setFormData({
            companyName: user.companyName,
            password: user.loginCode
        });
        setEditingId(user._id);
        setIsEditing(true);
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this company?')) return;
        try {
            await axios.delete(`/api/auth/users/${id}`);
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert('Error deleting user');
        }
    };

    const handleUpdateCode = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/update-gate-code', {
                type: 'admin',
                newCode: newAdminCode
            });
            alert('Admin Login Code Updated Successfully!');
            setIsChangingCode(false);
            setNewAdminCode('');
        } catch (err) {
            console.error(err);
            alert('Error updating code');
        }
    };

    const [isScanning, setIsScanning] = useState(false);

    const handleAnalyze = async () => {
        alert("Initializing Document AI v3.0 Engine...");
    };

    const handleDropTemplate = async (e) => {
        e.preventDefault(); e.stopPropagation();
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
        if (files.length === 0) return alert("Only Images or PDFs allowed.");

        setIsUploadingTemplate(true);
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        try {
            await axios.post('/api/tax/templates', formData, {
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

    // --- Excel Handling Logic ---
    const [excelFiles, setExcelFiles] = useState([]);
    const [activeExcelId, setActiveExcelId] = useState(null);
    const [excelData, setExcelData] = useState(null);
    const [isMappingMode, setIsMappingMode] = useState(false);
    const [cellMappings, setCellMappings] = useState({});
    const [resizingCol, setResizingCol] = useState(null);
    const [selectedRange, setSelectedRange] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);

    // Resize Effects
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

    // Selection Effects
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

    const closeContextMenu = () => setContextMenu(null);
    const handleContextMenu = (e, type, data) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, type, data });
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
        setContextMenu(null);
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
        } catch (err) {
            console.error(err);
            alert("AI Analysis Failed");
        } finally {
            setIsAiAnalyzing(false);
        }
    };

    const removeEmptyA = () => {
        if (!excelData?.rows?.length) return;
        performDeleteColumn(0, true);
    };

    const shrinkColA = () => {
        setExcelData(prev => {
            const w = [...(prev.colWidths || [])];
            w[0] = 40;
            return { ...prev, colWidths: w };
        });
    };

    const performMerge = () => {
        const sel = contextMenu?.data || selectedRange;
        if (!sel) return;
        const { r1, c1, r2, c2 } = sel;
        const newMerge = { s: { r: Math.min(r1, r2), c: Math.min(c1, c2) }, e: { r: Math.max(r1, r2), c: Math.max(c1, c2) } };
        setExcelData(prev => ({ ...prev, merges: [...(prev.merges || []), newMerge] }));
        setContextMenu(null);
        setSelectedRange(null);
    };

    const handleDropExcel = async (e) => {
        e.preventDefault(); e.stopPropagation();
        const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
        if (files.length === 0) return alert("Only Excel files allowed.");
        const file = files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
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
            const headers = normalizedRows[0] || [];
            try {
                await axios.post('/api/excel', {
                    name: file.name,
                    size: (file.size / 1024).toFixed(2) + ' KB',
                    headers,
                    rows: normalizedRows,
                    merges,
                    colWidths,
                    rowHeights,
                    cellMappings: {}
                });
                fetchExcelFiles();
            } catch (e) {
                console.error(e);
                alert("Upload Failed");
            }
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
        } catch (e) {
            alert("Failed to load content");
        }
    };

    const handleDeleteExcel = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Delete this file?")) return;
        try {
            await axios.delete(`/api/excel/${id}`);
            if (activeExcelId === id) {
                setActiveExcelId(null);
                setExcelData(null);
            }
            fetchExcelFiles();
        } catch (err) {
            alert("Delete failed");
        }
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
        } catch (e) {
            alert("Error saving mappings.");
        }
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
                <div className="flex flex-1 gap-6 px-6 w-full h-[calc(100vh-250px)] animate-in fade-in duration-700">
                    {/* LEFT PANEL: INGESTION & CONTROL */}
                    <div className="w-80 shrink-0 flex flex-col gap-4">
                        <div
                            onDrop={handleDropTemplate}
                            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                            className="h-48 bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all cursor-pointer"
                        >
                            <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-[50px] group-hover:bg-emerald-500/10 transition-all duration-700"></div>

                            <div className="relative z-10 flex flex-col items-center h-full justify-center">
                                {isUploadingTemplate ? (
                                    <Loader2 size={32} className="text-emerald-400 animate-spin mb-4" />
                                ) : (
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-inner group-hover:scale-110 transition duration-500">
                                        <CloudUpload size={24} className="text-emerald-400" />
                                    </div>
                                )}

                                <h2 className="text-sm font-black text-white uppercase tracking-widest mb-1">Ingest</h2>
                                <p className="text-gray-400 text-[8px] font-medium leading-relaxed uppercase tracking-widest">Drop Templates Here</p>
                            </div>
                        </div>

                        {/* TEMPLATE LIST */}
                        <div className="flex-1 bg-black/40 rounded-[32px] p-5 overflow-y-auto border border-white/5 no-scrollbar">
                            <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4 flex items-center gap-2">
                                <FileText size={12} /> Template Library ({templates.length})
                            </h4>
                            <div className="space-y-2">
                                {templates.map(tmp => (
                                    <div
                                        key={tmp._id}
                                        className={`p-3 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between group hover:bg-white/10 transition cursor-pointer ${activeTemplateId === tmp._id ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <FileText size={14} className="text-emerald-400" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="text-[10px] font-bold text-white truncate">{tmp.name}</div>
                                                <div className="text-[8px] text-gray-500 uppercase tracking-tighter">Page {tmp.pageNumber}</div>
                                            </div>
                                        </div>
                                        <button onClick={(e) => handleDeleteTemplate(e, tmp._id)} className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                {templates.length === 0 && (
                                    <div className="text-center py-10 opacity-20 flex flex-col items-center">
                                        <Sparkles size={24} className="mb-2" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Library Empty</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Control Box */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <button onClick={handleAnalyze} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition active:scale-95">Initialize Analysis</button>
                        </div>
                    </div>

                    {/* MAIN STAGE (SPACE FOR OTHER WORK) */}
                    <div className="flex-1 bg-white/5 rounded-[48px] border border-white/5 relative overflow-hidden flex flex-col items-center justify-center group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_100%)]"></div>
                        <div className="relative z-10 opacity-20 group-hover:opacity-30 transition-opacity">
                            <FileText size={80} className="text-gray-500 mb-4" />
                            <h3 className="text-xl font-black text-white uppercase tracking-[0.4em]">Main Stage</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-2">Awaiting Template Ingestion</p>
                        </div>
                    </div>
                </div>
            )
            }

            {
                activeTab === 'excel_merge' && (
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
                )
            }

            {
                isChangingCode && (
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
                )
            }

            {
                (isCreating || isEditing) && (
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
                )
            }
        </div >
    );
}
