import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    UserPlus, User, Edit2, Trash2, X, Lock, Users, FileSpreadsheet, Brain, ChevronRight, FileText, ArrowLeft
} from 'lucide-react';
import TaxFormWorkbench from './TaxFormWorkbench';
import LiveTaxWorkspace from './LiveTaxWorkspace';

export default function AdminDashboard() {
    // --- State ---
    const [users, setUsers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ username: '', companyName: '', password: '' });
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('user');
    const [viewingFile, setViewingFile] = useState(null);
    const [profileTemplate, setProfileTemplate] = useState(null);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [knowledgeBase, setKnowledgeBase] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // --- Data Fetching ---
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/auth/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) { console.error(err); }
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

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col">

            {/* ── TOP HEADER ── */}
            <div className="flex items-center justify-between px-10 py-5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-sm text-black">GK</div>
                    <div className="flex flex-col leading-none">
                        <span className="font-bold text-lg tracking-tight">GK SMART <span className="text-gray-400 font-normal">& Ai</span></span>
                        <span className="text-[9px] text-emerald-400 font-black tracking-[0.2em] mt-0.5">v5.12.21_RECOVERY_SYNC</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">

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
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-4 px-10 py-6 text-[22px] font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-600 hover:text-gray-400'}`}
                >
                    <FileText size={28} /> BR
                </button>
            </div>

            {/* ── TAB CONTENT: SPLIT AREA ── */}
            <div className="flex-1 overflow-hidden bg-slate-950 border-t border-white/5">
                <div className="h-full w-full min-w-[1440px] overflow-x-auto">
                    {/* USER TAB */}
                    {activeTab === 'user' && (
                        <div className="h-full overflow-y-auto p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="max-w-6xl mx-auto">
                                <div className="flex justify-between items-center bg-white/[0.03] p-8 rounded-[32px] border border-white/5 mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">User Matrix</h2>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Authorized Access Control & Entitlement Engine</p>
                                    </div>
                                    <button
                                        onClick={() => { resetForm(); setIsCreating(true); }}
                                        className="bg-white text-black hover:bg-blue-600 hover:text-white px-8 py-4 rounded-2xl font-black shadow-2xl transition-all flex items-center gap-3 uppercase text-[11px] tracking-widest active:scale-95"
                                    >
                                        <UserPlus size={18} /> Deploy New Profile
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {users.map((user) => (
                                        <div key={user._id} className="bg-slate-900/40 border border-white/5 rounded-[32px] p-8 flex justify-between items-center group hover:border-blue-500/30 hover:bg-slate-900/60 transition-all duration-500 relative overflow-hidden">
                                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="relative z-10">
                                                <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight mb-4">{user.companyName || 'Restricted Entity'}</h3>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                        <div className="w-5 h-5 rounded-lg bg-blue-500/10 flex items-center justify-center"><User size={10} className="text-blue-400" /></div>
                                                        {user.username}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                                                        <div className="w-5 h-5 rounded-lg bg-slate-500/10 flex items-center justify-center"><Lock size={10} /></div>
                                                        {user.loginCode}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 relative z-10">
                                                <button onClick={() => startEdit(user)} className="w-12 h-12 flex items-center justify-center bg-white/5 text-gray-500 hover:bg-blue-600 hover:text-white rounded-2xl transition-all duration-300"><Edit2 size={18} /></button>
                                                <button onClick={() => deleteUser(user._id)} className="w-12 h-12 flex items-center justify-center bg-white/5 text-gray-500 hover:bg-red-600 hover:text-white rounded-2xl transition-all duration-300"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    ))}

                                    {users.length === 0 && (
                                        <div className="col-span-full py-40 text-center opacity-20 flex flex-col items-center">
                                            <User size={64} className="mb-4" />
                                            <h3 className="text-xl font-black uppercase tracking-[0.4em]">Matrix Empty</h3>
                                            <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">Awaiting first entity deployment...</p>
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

                    {activeTab === 'profile' && (
                        <div className="h-full overflow-y-auto p-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex justify-between items-center bg-white/[0.03] p-8 rounded-[32px] border border-white/5 mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Business Registration Archive (BR)</h2>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Corporate Entity & Static Data Management</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setSavingTemplate(true);
                                            try {
                                                const token = localStorage.getItem('token');
                                                await axios.post('/api/company/template', profileTemplate, {
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                alert('Architecture Deployed Successfully');
                                            } catch (err) {
                                                alert('Failed to deploy architecture');
                                            } finally {
                                                setSavingTemplate(false);
                                            }
                                        }}
                                        disabled={savingTemplate}
                                        className="bg-indigo-600 text-white hover:bg-indigo-500 px-8 py-4 rounded-2xl font-black shadow-2xl transition-all flex items-center gap-3 uppercase text-[11px] tracking-widest active:scale-95 disabled:opacity-50"
                                    >
                                        {savingTemplate ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                                        Deploy Template
                                    </button>
                                </div>

                                {profileTemplate && (
                                    <div className="space-y-6">
                                        {profileTemplate.sections.map((section, sIdx) => (
                                            <div key={section.id} className="bg-slate-900/40 border border-white/5 rounded-[32px] p-8">
                                                <div className="flex justify-between items-center mb-6">
                                                    <input
                                                        className="bg-transparent text-xl font-bold text-white border-b border-transparent focus:border-indigo-500 outline-none w-1/2"
                                                        value={section.title}
                                                        onChange={(e) => {
                                                            const newSections = [...profileTemplate.sections];
                                                            newSections[sIdx].title = e.target.value;
                                                            setProfileTemplate({ ...profileTemplate, sections: newSections });
                                                        }}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const newSections = [...profileTemplate.sections];
                                                                newSections[sIdx].fields.push({ key: `field_${Date.now()}`, label: 'New Field', type: 'text' });
                                                                setProfileTemplate({ ...profileTemplate, sections: newSections });
                                                            }}
                                                            className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition"
                                                        >
                                                            + Add Field
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const newSections = profileTemplate.sections.filter((_, i) => i !== sIdx);
                                                                setProfileTemplate({ ...profileTemplate, sections: newSections });
                                                            }}
                                                            className="text-[10px] font-black text-red-400/50 uppercase tracking-widest hover:text-red-400 transition ml-4"
                                                        >
                                                            Remove Section
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {section.fields.map((field, fIdx) => (
                                                        <div key={fIdx} className="flex flex-col gap-2 p-4 bg-black/20 border border-white/5 rounded-2xl relative group">
                                                            <div className="flex justify-between items-center">
                                                                <input
                                                                    className="bg-transparent text-xs font-bold text-slate-300 outline-none w-full"
                                                                    value={field.label}
                                                                    onChange={(e) => {
                                                                        const newSections = [...profileTemplate.sections];
                                                                        newSections[sIdx].fields[fIdx].label = e.target.value;
                                                                        setProfileTemplate({ ...profileTemplate, sections: newSections });
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const newSections = [...profileTemplate.sections];
                                                                        newSections[sIdx].fields = newSections[sIdx].fields.filter((_, i) => i !== fIdx);
                                                                        setProfileTemplate({ ...profileTemplate, sections: newSections });
                                                                    }}
                                                                    className="text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                            <div className="flex gap-2 mt-2">
                                                                <span className="text-[9px] text-slate-500 uppercase font-black">Key:</span>
                                                                <input
                                                                    className="bg-transparent text-[9px] text-indigo-400 font-mono outline-none"
                                                                    value={field.key}
                                                                    onChange={(e) => {
                                                                        const newSections = [...profileTemplate.sections];
                                                                        newSections[sIdx].fields[fIdx].key = e.target.value;
                                                                        setProfileTemplate({ ...profileTemplate, sections: newSections });
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => {
                                                const newSections = [...profileTemplate.sections];
                                                const id = `sec_${Date.now()}`;
                                                newSections.push({ id, title: 'New Section', fields: [] });
                                                setProfileTemplate({ ...profileTemplate, sections: newSections });
                                            }}
                                            className="w-full py-6 border-2 border-dashed border-white/5 rounded-[32px] text-slate-600 hover:border-indigo-500/50 hover:text-indigo-400 transition-all font-black uppercase tracking-[0.3em] text-[11px]"
                                        >
                                            + Initialize New Topic
                                        </button>
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
        </div>
    );
};
