import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    UserPlus, User, Edit2, Trash2, X, Lock, Users, FileSpreadsheet, Brain, ChevronRight,
    FileText, ArrowLeft, AlertCircle
} from 'lucide-react';
import TaxFormWorkbench from './TaxFormWorkbench';
import LiveTaxWorkspace from './LiveTaxWorkspace';

export default function AdminDashboard() {
    // Admin identity from localStorage
    const adminUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch(e) { return {}; } })();

    // --- State ---
    const [users, setUsers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ username: '', companyName: '', password: '' });
    const [message, setMessage] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [activeTab, setActiveTab] = useState('user');
    const [viewingFile, setViewingFile] = useState(null);
    const [profileTemplate, setProfileTemplate] = useState(null);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [knowledgeBase, setKnowledgeBase] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const version = "v5.12.24_CLEAN";


    // --- Data Fetching ---
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/auth/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) { 
            console.error(err); 
            setUsers([{ _id: 'ERR', username: 'FETCH ERROR: ' + (err.response?.status || err.message) }]);
        }
    };

    const fetchKnowledge = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/knowledge', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setKnowledgeBase(res.data);
        } catch (err) { console.error('Knowledge Fetch Error:', err); }
    };

    const fetchProfileTemplate = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/template', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProfileTemplate(res.data);
        } catch (err) { console.error('Profile Template Fetch Error:', err); }
    };

    useEffect(() => {
        fetchUsers();
        fetchKnowledge();
        fetchProfileTemplate();
    }, []);


    const fetchFileContent = async (category, fileName) => {

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/knowledge/${category}/${fileName}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setViewingFile({ name: fileName, content: res.data.content });
        } catch (err) { alert('Error reading file'); }
    };

    // --- Handlers ---
    const resetForm = () => {
        setFormData({ username: '', companyName: '', password: '' });
        setIsCreating(false);
        setIsEditing(false);
        setEditingId(null);
        setMessage('');
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/auth/create-user',
                { ...formData, companyCode: formData.username.toUpperCase() },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            resetForm();
            fetchUsers();
        } catch (err) { setMessage(err.response?.data?.message || 'Error creating user'); }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/auth/users/${editingId}`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            resetForm();
            fetchUsers();
        } catch (err) { setMessage(err.response?.data?.message || 'Error updating user'); }
    };

    const startEdit = (user) => {
        setFormData({ username: user.username, companyName: user.companyName, password: user.loginCode });
        setEditingId(user._id);
        setIsEditing(true);
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Delete this company?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/auth/users/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) { alert('Error deleting user'); }
    };



    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        window.location.href = '/login';
    };

    const handleBRUpload = async (fileList) => {
        if (!fileList || fileList.length === 0) return;
        setUploadingBR(true);
        const token = localStorage.getItem('token');

        const successfulUploads = [];
        for (let i = 0; i < fileList.length; i++) {
            const formDataUpload = new FormData();
            formDataUpload.append('file', fileList[i]);
            formDataUpload.append('username', selectedUserBR);

            try {
                const res = await axios.post('/api/company/br-extract', formDataUpload, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                successfulUploads.push({
                    id: res.data.docId || Date.now() + i, // Use docId from backend if available
                    name: res.data.fileName,
                    text: res.data.text,
                    organizedText: res.data.organizedText,
                    timestamp: new Date().toLocaleString()
                });
            } catch (err) {
                console.error("BR Upload Error:", err);
                alert("Extraction failed for " + fileList[i].name);
            }
        }

        if (successfulUploads.length > 0) {
            setBrDocs(prev => [...successfulUploads.reverse(), ...prev]); // Add new docs to the top
            if (activeBRIndex === null) setActiveBRIndex(0);
            setBrView('organized'); // Auto-switch to organized view
        }
        setUploadingBR(false);
    };

    const [syncStatus, setSyncStatus] = useState('');

    const fetchUserBRDocs = async (username) => {
        if (!username) {
            setBrDocs([]);
            setSyncStatus('');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setSyncStatus('Error: No Auth Token');
            return;
        }

        setSyncStatus(`Syncing ${username}...`);
        try {
            console.log("[Intelligence] Fetching dossier for:", username);
            const res = await axios.get(`/api/company/admin/profile/${username}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data && res.data.documents && Array.isArray(res.data.documents)) {
                // Map CompanyProfile documents to brDocs UI state
                const mappedDocs = res.data.documents.map((doc, idx) => ({
                    id: doc.id || doc._id || `doc-${Date.now()}-${idx}`,
                    name: doc.originalName || doc.docType || 'Intelligence Fragment',
                    text: doc.rawText || 'Text extraction active...',
                    organizedText: doc.organizedText || res.data.organizedProfile || '',
                    timestamp: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'Synced'
                }));

                // Sort newest first & Update State
                const finalDocs = [...mappedDocs].reverse();
                setBrDocs(finalDocs);
                setSyncStatus(`Live: ${finalDocs.length} records found`);

                if (finalDocs.length > 0) {
                    setActiveBRIndex(0);
                    setBrView(res.data.organizedProfile ? 'organized' : 'raw');
                } else {
                    setActiveBRIndex(null);
                    setSyncStatus('Success: No Documents Yet');
                }
            } else {
                setBrDocs([]);
                setActiveBRIndex(null);
                setSyncStatus('Status: Empty Profile');
            }
        } catch (err) {
            console.error("Fetch BR Docs Error:", err);
            setSyncStatus(`Sync Failed: ${err.response?.data?.message || err.message}`);
            setBrDocs([]);
            setActiveBRIndex(null);
        }
    };

    const handleRecallScan = async () => {
        if (!selectedUserBR) return;
        setIsScanning(true);
        setMessage('Initiating Deep Recall Scan...');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`/api/company/admin/rescan/${selectedUserBR}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage(res.data.message || 'Recall scan complete. Refreshing data...');
            fetchUserBRDocs(selectedUserBR);
        } catch (err) {
            setMessage('Recall failed: No real image data found in Drive folders.');
            console.error(err);
        } finally {
            setIsScanning(false);
        }
    };

    const handleSaveOrganizedProfile = async () => {
        if (activeBRIndex === null || !brDocs[activeBRIndex].organizedText) return;

        const doc = brDocs[activeBRIndex];
        setOrganizingProfile(true);
        const token = localStorage.getItem('token');

        try {
            await axios.post('/api/company/br-organize', {
                rawText: doc.text,
                fileName: doc.name,
                username: selectedUserBR
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert(`Business Profile synchronized successfully for ${selectedUserBR}!`);
        } catch (err) {
            console.error("Sync Error:", err);
            alert("Failed to sync profile: " + (err.response?.data?.message || err.message));
        } finally {
            setOrganizingProfile(false);
        }
    };

    const handleTriggerBridge = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/bridge/unread', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    // Providing a stub secret in case the backend requires one, although token auth should handle it depending on setup
                    'x-bridge-secret': process.env.REACT_APP_BRIDGE_SECRET || '' 
                }
            });
            
            if (res.data && res.data.length > 0) {
                alert(`Bridge Brain Activated: Found ${res.data.length} unread instruction(s) in the queue.`);
            } else {
                alert('Bridge Brain Activated: No pending instructions found.');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to connect to the Bridge Brain.');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col">

            {/* ── TOP HEADER ── */}
            <div className="flex items-center justify-between px-10 py-5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-sm text-black">GK</div>
                    <div className="flex flex-col leading-none ml-4">
                        <span className="font-black text-4xl tracking-tighter text-white">GK SMART <span className="text-emerald-500">Ai</span></span>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-emerald-500/30">
                                {version}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleTriggerBridge} 
                        className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                        title="Ping Google Cloud Run Bridge Brain"
                    >
                        <Brain size={14} /> Trigger Bridge Brain
                    </button>
                    <button onClick={handleLogout} className="bg-white/5 text-gray-400 border border-white/10 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/30 transition-all">Sign Out</button>
                </div>
            </div>

            {/* ── TAB BAR ── */}
            <div className="flex gap-0 border-b border-white/5 px-10 shrink-0 bg-slate-900/50">
                <button
                    onClick={() => setActiveTab('user')}
                    className={`flex items-center gap-4 px-10 py-6 text-[22px] font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeTab === 'user' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-600 hover:text-gray-400'}`}
                >
                    <Users size={28} /> USER
                </button>
                <button
                    onClick={() => setActiveTab('toi')}
                    className={`flex items-center gap-4 px-10 py-6 text-[22px] font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeTab === 'toi' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-600 hover:text-gray-400'}`}
                >
                    <FileSpreadsheet size={28} /> TOI
                </button>
                <button
                    onClick={() => setActiveTab('baknowledge')}
                    className={`flex items-center gap-4 px-10 py-6 text-[22px] font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeTab === 'baknowledge' ? 'border-rose-500 text-rose-400' : 'border-transparent text-gray-600 hover:text-gray-400'}`}
                >
                    <Brain size={28} /> BA Knowledge
                </button>
                <button
                    onClick={() => {
                        window.location.href = '/dashboard?packageId=SCAR';
                    }}
                    className={`flex items-center gap-4 px-10 py-6 text-[22px] font-black uppercase tracking-[0.2em] border-b-4 transition-all border-transparent text-gray-600 hover:text-red-400 hover:border-red-500/50`}
                >
                    <AlertCircle size={28} className="text-red-500" /> SCAR
                </button>
            </div>

            {/* ── TAB CONTENT: SPLIT AREA ── */}
            <div className="flex-1 overflow-hidden bg-slate-950 border-t border-white/5">
                <div className="h-full w-full min-w-[1440px] overflow-x-auto">
                    {/* USER TAB */}
                    {activeTab === 'user' && (
                        <div className="h-full overflow-y-auto p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="max-w-6xl mx-auto">
                                <div className="flex justify-between items-center bg-white/[0.03] p-6 lg:p-8 rounded-[32px] border border-white/5 mb-8 flex-wrap gap-4">
                                    <div>
                                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">USER AGENT MAITRIX</h2>
                                        <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-[0.3em]">
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>
                                            Agent of Blue
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                                        <input
                                            type="text"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            placeholder="Search units..."
                                            className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors w-full md:w-[250px]"
                                        />
                                        <button
                                            onClick={() => { resetForm(); setIsCreating(true); }}
                                            className="bg-white text-black hover:bg-blue-600 hover:text-white px-6 py-3 rounded-2xl font-black shadow-2xl transition-all flex items-center gap-3 uppercase text-[11px] tracking-widest active:scale-95 whitespace-nowrap h-[46px]"
                                        >
                                            <UserPlus size={18} /> Deploy New Profile
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-4">
                                    {users.filter(u => `${u.username} ${u.companyName}`.toLowerCase().includes(userSearch.toLowerCase())).map((user) => (
                                        <div key={user._id} className="bg-slate-900/40 border border-white/5 rounded-[24px] p-5 flex py-6 flex-col justify-between items-center text-center group hover:border-blue-500/30 hover:bg-slate-900/60 transition-all duration-500 relative overflow-hidden h-[190px]">
                                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-600/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="relative z-10 w-full mb-auto flex flex-col items-center">
                                                <h3 className="text-[13px] font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight mb-2 truncate w-full" title={user.companyName}>{user.companyName || 'Restricted Entity'}</h3>
                                                <div className="space-y-1.5 w-full flex flex-col items-center">
                                                    <div className="flex items-center gap-2 text-[9px] text-slate-400 font-black uppercase tracking-widest bg-white/5 py-1 px-2 rounded w-full justify-center">
                                                        <User size={10} className="text-blue-400" />
                                                        <span className="truncate">{user.username}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono bg-white/5 py-1 px-2 rounded w-full justify-center">
                                                        <Lock size={10} className="text-rose-400" />
                                                        <span className="truncate">{user.loginCode}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 mt-4 relative z-10 justify-center w-full">
                                                <button
                                                    onClick={() => {
                                                        localStorage.setItem('lastSelectedBR', user.username);
                                                        window.open(`/tax-live?packageId=${user.username}_2026`, '_blank', 'noopener,noreferrer');
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg transition-all duration-300 shadow"
                                                    title="Open Tax Workspace"
                                                >
                                                    <FileSpreadsheet size={14} />
                                                </button>

                                                <button onClick={() => startEdit(user)} className="w-8 h-8 flex items-center justify-center bg-white/5 text-gray-500 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-300 shadow" title="Edit"><Edit2 size={14} /></button>
                                                <button onClick={() => deleteUser(user._id)} className="w-8 h-8 flex items-center justify-center bg-rose-500/10 text-rose-400 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-300 shadow" title="Delete"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}

                                    {users.length === 0 && (
                                        <div className="col-span-full py-40 text-center opacity-30 flex flex-col items-center">
                                            <User size={64} className="mb-4" />
                                            <h3 className="text-xl font-black uppercase tracking-[0.4em]">No Units Deployed</h3>
                                            <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">Click "Deploy New Profile" to create your first unit</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TOI TAB — Live Workspace Embedded */}
                    {activeTab === 'toi' && (
                        <div className="w-full h-full overflow-y-auto animate-in fade-in duration-500">
                            <LiveTaxWorkspace embedded={true} />
                        </div>
                    )}

                    {/* BA KNOWLEDGE TAB */}
                    {activeTab === 'baknowledge' && (
                        <div className="h-full overflow-y-auto p-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex justify-between items-center bg-white/[0.03] p-8 rounded-[32px] border border-white/5 mb-8">
                                    <div className="flex items-center gap-6">
                                        {(selectedCategory || viewingFile) && (
                                            <button
                                                onClick={() => viewingFile ? setViewingFile(null) : setSelectedCategory(null)}
                                                className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-rose-500 hover:border-rose-400 group transition-all"
                                            >
                                                <ArrowLeft size={20} className="text-slate-400 group-hover:text-white" />
                                            </button>
                                        )}
                                        <div>
                                            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
                                                {viewingFile ? viewingFile.name : (selectedCategory ? selectedCategory.name : 'Agent Knowledge Matrix')}
                                            </h2>
                                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                                                {viewingFile ? 'Full AI Transcription' : (selectedCategory ? `Exploration of ${selectedCategory.fileCount} Intel Fragments` : 'Extracted Intelligence from Google Drive Repositories')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Knowledge Sync Active</span>
                                        </div>
                                    </div>
                                </div>

                                {/* CATEGORY GRID */}
                                {!selectedCategory && !viewingFile && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {knowledgeBase.map((cat, i) => (
                                            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-[40px] p-10 group hover:border-rose-500/30 transition-all duration-700">
                                                <div className={`w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-8`}>
                                                    <Brain className="text-rose-400" size={32} />
                                                </div>
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{cat.name}</h3>
                                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10">{cat.fileCount} Managed Data Fragments</p>
                                                <button
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-400 transition-all active:scale-95"
                                                >
                                                    Open Repository
                                                </button>
                                            </div>
                                        ))}
                                        {knowledgeBase.length === 0 && (
                                            <div className="col-span-full py-40 text-center opacity-20 flex flex-col items-center">
                                                <Brain size={64} className="mb-4" />
                                                <h3 className="text-xl font-black uppercase tracking-[0.4em]">Repository Empty</h3>
                                                <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">No intelligence fragments extracted yet...</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* FILE LIST */}
                                {selectedCategory && !viewingFile && (
                                    <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom-8 duration-500">
                                        {selectedCategory.files.map((file, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => fetchFileContent(selectedCategory.id, file.fileName)}
                                                className="flex items-center justify-between p-6 bg-slate-900/40 border border-white/5 rounded-[24px] hover:border-blue-500/40 group transition-all"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                                        <FileText className="text-blue-400 group-hover:scale-110 transition-transform" size={20} />
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-white font-bold tracking-tight uppercase">{file.name}</span>
                                                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Extracted {new Date(file.updatedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-slate-700 group-hover:text-blue-400 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* CONTENT VIEWER */}
                                {viewingFile && (
                                    <div className="bg-slate-900/60 border border-white/10 rounded-[40px] p-12 animate-in zoom-in-95 duration-500 shadow-2xl">
                                        <div className="prose prose-invert max-w-none">
                                            <pre className="whitespace-pre-wrap text-slate-300 font-mono text-sm leading-relaxed bg-black/40 p-10 rounded-3xl border border-white/5 overflow-x-auto shadow-inner">
                                                {viewingFile.content}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* BR removed — units manage their own extraction */}
                    {activeTab === 'profile' && false && (
                        <div className="h-full overflow-hidden flex animate-in fade-in duration-500">
                            {/* LEFT: Unit Selector + 5 Slots */}
                            <div style={{ width: 420, borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.6)' }} className="flex flex-col overflow-y-auto p-8 gap-5 shrink-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <Terminal size={18} className="text-orange-400" />
                                    <h3 className="text-xs font-black text-white tracking-[0.2em] uppercase">SCAR Extraction</h3>
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-black uppercase">New</span>
                                </div>

                                {/* Unit Selector */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Unit</label>
                                    <select
                                        className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white font-bold uppercase outline-none focus:ring-2 focus:ring-orange-500/30 appearance-none cursor-pointer text-sm"
                                        value={selectedUserBR}
                                        onChange={(e) => { setSelectedUserBR(e.target.value); setScarData({}); setShowScarPanel(null); setScarPromoteResult(null); }}
                                    >
                                        <option value="">Select a unit...</option>
                                        {users.map(u => (
                                            <option key={u._id} value={u.username}>{u.companyName || u.username} ({u.username})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Master Profile Button */}
                                {selectedUserBR && Object.values(scarData).some(Boolean) && (
                                    <div
                                        onClick={() => setShowScarPanel('master')}
                                        style={{ background: showScarPanel === 'master' ? 'rgba(234,179,8,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${showScarPanel === 'master' ? 'rgba(234,179,8,0.5)' : 'rgba(234,179,8,0.15)'}`, borderRadius: 16, padding: '14px 16px', cursor: 'pointer' }}
                                        className="flex items-center justify-between transition-all hover:border-yellow-400/40"
                                    >
                                        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-yellow-400">
                                            <Star size={14} /> Master Profile
                                        </span>
                                        <FileText size={13} className="text-yellow-500" />
                                    </div>
                                )}

                                {/* Promote Panel */}
                                {selectedUserBR && Object.values(scarData).some(Boolean) && (
                                    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 16 }} className="flex flex-col gap-3">
                                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest flex items-center gap-2"><Upload size={12} /> Promote to Profile</p>
                                        <select
                                            value={scarPromoteTarget}
                                            onChange={e => { setScarPromoteTarget(e.target.value); setScarPromoteResult(null); }}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none"
                                        >
                                            <option value="">— Same unit (self) —</option>
                                            {users.map(u => (
                                                <option key={u._id} value={u.companyCode || u.username.toUpperCase()}>
                                                    {u.companyName} ({u.username})
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleScarfPromote}
                                            disabled={scarPromoting}
                                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
                                        >
                                            {scarPromoting ? <><Loader2 size={12} className="animate-spin" /> Promoting...</> : <><Upload size={12} /> Push to Profile</>}
                                        </button>
                                        {scarPromoteResult && (
                                            <p className={`text-[10px] font-semibold rounded-lg p-2 ${scarPromoteResult.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                                                {scarPromoteResult.message}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* 5 Doc Slots */}
                                {scarDocSlots.map(slot => {
                                    const col = scarColors[slot.color];
                                    const hasData = !!scarData[slot.id];
                                    const isUploading = uploadingScarf === slot.id;
                                    const isActive = showScarPanel === slot.id;
                                    return (
                                        <div key={slot.id}
                                            onClick={() => hasData && setShowScarPanel(slot.id)}
                                            style={{
                                                background: isActive ? col.bg : 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${isActive ? col.base : hasData ? col.border : 'rgba(255,255,255,0.07)'}`,
                                                borderRadius: 16, padding: 16,
                                                cursor: hasData ? 'pointer' : 'default',
                                                boxShadow: isActive ? `0 0 24px -4px ${col.glow}` : 'none',
                                                transition: 'all 0.25s'
                                            }}
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <span style={{ color: isActive ? col.base : hasData ? col.base : '#64748b' }} className="text-[11px] font-black uppercase tracking-widest">{slot.label}</span>
                                                {hasData && (
                                                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => setShowScarPanel(slot.id)} style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={12} /></button>
                                                        {confirmDelScarf === slot.id ? (
                                                            <button onClick={() => handleScarfDelete(slot.id)} style={{ background: '#dc2626', color: 'white', borderRadius: 8, padding: '0 8px', height: 28, fontSize: 9, fontWeight: 900 }}>CONFIRM?</button>
                                                        ) : (
                                                            <button onClick={() => setConfirmDelScarf(slot.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} /></button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="relative" onDrop={e => { e.preventDefault(); handleScarfUpload(slot.id, e.dataTransfer.files[0]); }} onDragOver={e => e.preventDefault()}>
                                                <input type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={!selectedUserBR || isUploading}
                                                    onChange={e => handleScarfUpload(slot.id, e.target.files[0], e.target)}
                                                    onClick={e => { e.stopPropagation(); e.target.value = null; }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
                                                <div style={{
                                                    border: `2px dashed ${!selectedUserBR ? 'rgba(255,255,255,0.05)' : isUploading ? col.base : hasData ? col.border : 'rgba(255,255,255,0.1)'}`,
                                                    borderRadius: 12, padding: '20px 0',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                    background: isUploading ? col.bg : 'transparent',
                                                    animation: isUploading ? 'pulse 1.5s infinite' : 'none'
                                                }}>
                                                    {isUploading ? (
                                                        <><Loader2 size={14} style={{ color: col.base, animation: 'spin 1s linear infinite' }} /><span style={{ color: col.base, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>Extracting AI Data...</span></>
                                                    ) : hasData ? (
                                                        <><CheckCircle size={14} style={{ color: col.base }} /><span style={{ color: col.base, fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>Re-Drop to Update</span></>
                                                    ) : (
                                                        <><CloudUpload size={14} className="text-slate-600" /><span className="text-slate-600 text-[10px] font-bold uppercase">{selectedUserBR ? 'Drop PDF / Image' : 'Select a unit first'}</span></>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* RIGHT: Data Viewer */}
                            <div className="flex-1 bg-black/40 p-10 overflow-hidden flex flex-col">
                                {showScarPanel ? (() => {
                                    const isMaster = showScarPanel === 'master';
                                    const slot = scarDocSlots.find(s => s.id === showScarPanel);
                                    const col = isMaster ? { base: '#eab308', bg: 'rgba(234,179,8,0.05)', border: 'rgba(234,179,8,0.4)', glow: 'rgba(234,179,8,0.15)' } : scarColors[slot?.color] || {};
                                    let text = '';
                                    if (isMaster) text = JSON.stringify(buildMasterProfile(), null, 2);
                                    else text = typeof scarData[showScarPanel] === 'string' ? scarData[showScarPanel] : JSON.stringify(scarData[showScarPanel], null, 2);

                                    return (
                                        <div style={{ background: '#0f172a', border: `2px solid ${col.border}`, borderRadius: 24, padding: 36, boxShadow: `0 0 50px -10px ${col.glow}`, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            <div className="flex justify-between items-center mb-6 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                                <h3 style={{ color: col.base }} className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                                                    {isMaster ? <Star size={20} /> : <Terminal size={20} />}
                                                    {isMaster ? 'MASTER PROFILE — AI Merged' : `${slot?.label} — AI Raw Output`}
                                                </h3>
                                                <button onClick={() => setShowScarPanel(null)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-xl"><X size={18} /></button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto">
                                                <pre style={{ color: col.base, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', fontWeight: 500, lineHeight: 1.7 }}>
                                                    {text || 'No data yet.'}
                                                </pre>
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-15">
                                        <Terminal size={64} className="text-white mb-6" />
                                        <p className="text-xl font-black text-white uppercase tracking-[0.25em] text-center">
                                            {selectedUserBR ? 'Drop a file to begin extraction' : 'Select a unit to start'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODAL: Create / Edit User ── */}
            {(isCreating || isEditing) && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[100] animate-in zoom-in duration-300">
                    <div className="bg-slate-900 border border-white/10 p-12 rounded-[48px] shadow-2xl w-full max-w-md relative">
                        <button onClick={resetForm} className="absolute top-10 right-10 text-slate-500 hover:text-white transition"><X size={28} /></button>
                        <div className="mb-12 text-center">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight">{isEditing ? 'Modify Entity' : 'Deploy Entity'}</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3">Configuring authorized departmental endpoint</p>
                        </div>
                        <form onSubmit={isEditing ? handleUpdateUser : handleCreateUser} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Entity Name</label>
                                <input className="w-full bg-black/50 border border-white/10 p-5 rounded-[24px] text-white font-bold uppercase placeholder:text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value.toUpperCase() })} placeholder="e.g. PHNOM PENH HUB" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Secure Identifier</label>
                                <input className="w-full bg-black/50 border border-white/10 p-5 rounded-[24px] text-white font-bold placeholder:text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="e.g. GK_UNIT_01" disabled={isEditing} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Access Key Override</label>
                                <input className="w-full bg-black/50 border border-white/10 p-5 rounded-[24px] text-white font-mono tracking-[0.5em] text-xl placeholder:text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-center" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••" maxLength="6" required />
                            </div>
                            {message && <div className="text-red-400 text-[10px] font-black uppercase text-center bg-red-400/10 py-4 rounded-2xl border border-red-400/20 animate-pulse">{message}</div>}
                            <button className="w-full bg-white text-black hover:bg-blue-600 hover:text-white font-black py-6 rounded-[24px] transition-all shadow-2xl active:scale-95 uppercase tracking-[0.2em] text-[11px] mt-6">
                                {isEditing ? 'COMMIT MATRIX UPDATES' : 'FINALIZE DEPLOYMENT'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* ── First-Login Password Change Modal Removed ── */}
        </div>
    );
};
