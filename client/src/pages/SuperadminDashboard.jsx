import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Crown, Shield, Plus, Trash2, Edit3, ChevronRight,
    BookOpen, FileText, RefreshCw, LogOut, Users,
    Building2, Check, AlertCircle, Loader2, X, Eye, EyeOff
} from 'lucide-react';

export default function SuperadminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('admins');
    const [admins, setAdmins] = useState([]);
    const [knowledgeFiles, setKnowledgeFiles] = useState([]);
    const [knowledgeStatus, setKnowledgeStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [units, setUnits] = useState([]);
    const [unassignedUnits, setUnassignedUnits] = useState([]);
    const [assigningTo, setAssigningTo] = useState('');
    const [assigningUnowned, setAssigningUnowned] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ username: '', companyName: '', loginCode: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');
    const [showCode, setShowCode] = useState({});
    const [toast, setToast] = useState(null);

    const token = () => localStorage.getItem('token');
    const headers = () => ({ Authorization: `Bearer ${token()}` });

    const showToast = (msg, type = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Load Admins ──────────────────────────────────────────────────────────
    const loadAdmins = async () => {
        try {
            const [adminsRes, unassignedRes] = await Promise.all([
                axios.get('/api/auth/admins', { headers: headers() }),
                axios.get('/api/auth/unassigned-units', { headers: headers() }).catch(() => ({ data: [] }))
            ]);
            setAdmins(adminsRes.data);
            setUnassignedUnits(unassignedRes.data || []);
        } catch (e) {
            if (e.response?.status === 401 || e.response?.status === 403) {
                navigate('/login');
            }
        } finally { setLoading(false); }
    };

    // ── Load Knowledge Files ─────────────────────────────────────────────────
    const loadKnowledge = async () => {
        try {
            const [filesRes, statusRes] = await Promise.all([
                axios.get('/api/knowledge/files', { headers: headers() }),
                axios.get('/api/knowledge/status', { headers: headers() })
            ]);
            setKnowledgeFiles(filesRes.data || []);
            setKnowledgeStatus(statusRes.data || {});
        } catch (e) { console.warn('Knowledge load:', e.message); }
    };

    // ── Sync Knowledge ───────────────────────────────────────────────────────
    const syncKnowledge = async () => {
        setSyncing(true);
        try {
            const res = await axios.post('/api/knowledge/sync', {}, { headers: headers() });
            showToast(`✅ Synced ${res.data.synced || 0} file(s) successfully`);
            await loadKnowledge();
        } catch (e) { showToast('❌ Sync failed: ' + (e.response?.data?.message || e.message), 'err'); }
        finally { setSyncing(false); }
    };

    // ── Drill into Admin's Units ─────────────────────────────────────────────
    const drillAdmin = async (admin) => {
        setSelectedAdmin(admin);
        try {
            const res = await axios.get(`/api/auth/admins/${admin._id}/units`, { headers: headers() });
            setUnits(res.data);
        } catch (e) { setUnits([]); }
    };

    // ── Reassign all units of a given admin → another admin ──────────────────
    const [showReassign, setShowReassign] = useState(false);
    const [reassignTargetId, setReassignTargetId] = useState('');
    const [reassigning, setReassigning] = useState(false);

    const reassignUnits = async () => {
        if (!reassignTargetId || units.length === 0) return;
        setReassigning(true);
        try {
            const unitUsernames = units.map(u => u.username);
            const res = await axios.post('/api/auth/reassign-units',
                { unitUsernames, toAdminId: reassignTargetId },
                { headers: headers() }
            );
            showToast(`✅ ${res.data.updated} unit(s) moved to ${res.data.toAdmin}`);
            setShowReassign(false);
            await drillAdmin(selectedAdmin); // refresh
        } catch (e) { showToast('❌ ' + (e.response?.data?.message || 'Reassign failed'), 'err'); }
        finally { setReassigning(false); }
    };

    // ── Create Admin ─────────────────────────────────────────────────────────
    const createAdmin = async () => {
        setCreateError('');
        if (!createForm.username || !createForm.loginCode) {
            setCreateError('Username and Access Code are required');
            return;
        }
        if (createForm.loginCode.length !== 6) {
            setCreateError('Access Code must be exactly 6 digits');
            return;
        }
        setCreateLoading(true);
        try {
            await axios.post('/api/auth/create-admin', createForm, { headers: headers() });
            setShowCreateModal(false);
            setCreateForm({ username: '', companyName: '', loginCode: '' });
            showToast('✅ Admin created successfully');
            await loadAdmins();
        } catch (e) {
            setCreateError(e.response?.data?.message || 'Failed to create admin');
        } finally { setCreateLoading(false); }
    };

    // ── Delete Admin ─────────────────────────────────────────────────────────
    const deleteAdmin = async (id, name) => {
        if (!window.confirm(`Delete Admin "${name}"? Their units will remain.`)) return;
        try {
            await axios.delete(`/api/auth/admins/${id}`, { headers: headers() });
            showToast(`✅ Admin deleted`);
            await loadAdmins();
        } catch (e) { showToast('❌ ' + (e.response?.data?.message || 'Delete failed'), 'err'); }
    };

    useEffect(() => {
        loadAdmins();
        loadKnowledge();
    }, []);

    const categoryColors = {
        tax_laws: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        gdt_circulars: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        toi_guidelines: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        audit_standards: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        other: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };

    return (
        <div className="min-h-screen bg-[#080c14] text-white font-sans">
            {/* ── Top Bar ─────────────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-[#0d1628] to-[#0a1020] border-b border-white/5 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white tracking-tight">Superadmin Console</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">GK Smart AI Platform</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">👑 Superadmin</span>
                    </div>
                    <button
                        onClick={() => { localStorage.clear(); navigate('/login'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl transition-all text-slate-400 hover:text-white text-xs font-semibold"
                    >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                </div>
            </div>

            {/* ── Tabs ────────────────────────────────────────────────────── */}
            <div className="px-8 pt-6">
                <div className="flex gap-1 bg-slate-900/50 rounded-2xl p-1 w-fit border border-white/5">
                    <button
                        onClick={() => { setActiveTab('admins'); setSelectedAdmin(null); }}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'admins' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Shield className="w-3.5 h-3.5" /> Admin Management
                    </button>
                    <button
                        onClick={() => setActiveTab('knowledge')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'knowledge' ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-600/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <BookOpen className="w-3.5 h-3.5" /> BA Knowledge Vault
                    </button>
                </div>
            </div>

            <div className="px-8 py-6">
                {/* ── ADMIN MANAGEMENT TAB ────────────────────────────────── */}
                {activeTab === 'admins' && (
                    <div>
                        {selectedAdmin ? (
                            /* ── Admin Drill-in: Unit List ── */
                            <div>
                                <button
                                    onClick={() => setSelectedAdmin(null)}
                                    className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold mb-6 transition-colors"
                                >
                                    ← Back to Admins
                                </button>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                                            <Shield className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black">{selectedAdmin.username}</h2>
                                            <p className="text-xs text-slate-500">{units.length} unit{units.length !== 1 ? 's' : ''} managed by this Admin</p>
                                        </div>
                                    </div>
                                    {units.length > 0 && (
                                        <button
                                            onClick={() => setShowReassign(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                        >
                                            <Users className="w-3.5 h-3.5" /> Reassign Units
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {units.length === 0 && (
                                        <div className="col-span-3 text-center text-slate-500 text-sm py-12">No units created yet</div>
                                    )}
                                    {units.map(u => (
                                        <div key={u._id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-9 h-9 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                                                    <Building2 className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider ${u.brFolderId ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                    BR {u.brFolderId ? '✓' : '⚠'}
                                                </span>
                                            </div>
                                            <p className="font-black text-white text-sm">{u.companyName || u.username}</p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">@{u.username}</p>
                                            <p className="text-[10px] text-slate-600 mt-2">
                                                Created {new Date(u.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* ── Admin List ── */
                            <div>
                                {/* Unassigned Units Banner */}
                                {unassignedUnits.length > 0 && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                                                <div>
                                                    <p className="font-black text-amber-300 text-sm">⚠️ {unassignedUnits.length} Unassigned Unit{unassignedUnits.length > 1 ? 's' : ''}</p>
                                                    <p className="text-[10px] text-amber-500 mt-0.5">
                                                        {unassignedUnits.map(u => u.username).join(', ')} — not yet assigned to any Admin
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <select
                                                    value={assigningTo}
                                                    onChange={e => setAssigningTo(e.target.value)}
                                                    className="px-3 py-2 bg-slate-800 border border-amber-500/30 rounded-xl text-white text-xs outline-none"
                                                >
                                                    <option value="">Select Admin...</option>
                                                    {admins.map(a => (
                                                        <option key={a._id} value={a._id}>{a.username}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={async () => {
                                                        if (!assigningTo) return;
                                                        setAssigningUnowned(true);
                                                        try {
                                                            const res = await axios.post('/api/auth/reassign-units',
                                                                { toAdminId: assigningTo, assignUnowned: true },
                                                                { headers: headers() }
                                                            );
                                                            showToast(`✅ ${res.data.updated} unit(s) assigned to ${res.data.toAdmin}`);
                                                            await loadAdmins();
                                                            setAssigningTo('');
                                                        } catch (e) { showToast('❌ ' + (e.response?.data?.message || 'Failed'), 'err'); }
                                                        finally { setAssigningUnowned(false); }
                                                    }}
                                                    disabled={!assigningTo || assigningUnowned}
                                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                    {assigningUnowned ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5" />}
                                                    Assign All
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-black">Admin Accounts</h2>
                                        <p className="text-xs text-slate-500 mt-1">{admins.length} admin{admins.length !== 1 ? 's' : ''} registered</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all"
                                    >
                                        <Plus className="w-4 h-4" /> Create Admin
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="flex items-center gap-3 text-slate-400 py-12">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Loading admins...
                                    </div>
                                ) : admins.length === 0 ? (
                                    <div className="text-center py-16 text-slate-500">
                                        <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p className="font-semibold">No admins yet</p>
                                        <p className="text-xs mt-1">Create the first admin account to get started</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {admins.map(a => (
                                            <div key={a._id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition-all group">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                                                        <Shield className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => drillAdmin(a)}
                                                            className="p-1.5 bg-slate-700/50 hover:bg-blue-600/30 rounded-lg transition-all"
                                                            title="View units"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteAdmin(a._id, a.username)}
                                                            className="p-1.5 bg-slate-700/50 hover:bg-red-600/30 rounded-lg transition-all"
                                                            title="Delete admin"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="font-black text-white">{a.companyName || a.username}</p>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">@{a.username}</p>
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="w-3 h-3 text-slate-500" />
                                                        <span className="text-xs text-slate-400 font-semibold">{a.unitCount} unit{a.unitCount !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => drillAdmin(a)}
                                                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-black uppercase tracking-wider transition-colors"
                                                    >
                                                        View Units <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── KNOWLEDGE VAULT TAB ──────────────────────────────────── */}
                {activeTab === 'knowledge' && (
                    <div>
                        {/* Status Bar */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black">BA Knowledge Vault</h2>
                                <p className="text-xs text-slate-500 mt-1">PDF tax laws & guidelines for BA TOI and BA Audit to learn from</p>
                            </div>
                            <button
                                onClick={syncKnowledge}
                                disabled={syncing}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Syncing...' : 'Sync Now'}
                            </button>
                        </div>

                        {/* Status Cards */}
                        {knowledgeStatus && (
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                {[
                                    { label: 'Total Files', value: knowledgeFiles.length, icon: FileText, color: 'text-blue-400' },
                                    { label: 'Active Files', value: knowledgeFiles.filter(f => f.isActive).length, icon: Check, color: 'text-emerald-400' },
                                    { label: 'Pending Read', value: knowledgeFiles.filter(f => !f.readAt).length, icon: AlertCircle, color: 'text-amber-400' },
                                    { label: 'Last Sync', value: knowledgeStatus.lastSync ? new Date(knowledgeStatus.lastSync).toLocaleDateString() : 'Never', icon: RefreshCw, color: 'text-slate-400' },
                                ].map(({ label, value, icon: Icon, color }) => (
                                    <div key={label} className="bg-slate-900/50 border border-white/5 rounded-2xl p-4">
                                        <Icon className={`w-4 h-4 ${color} mb-2`} />
                                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Category breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            {['tax_laws', 'gdt_circulars', 'toi_guidelines', 'audit_standards'].map(cat => {
                                const count = knowledgeFiles.filter(f => f.category === cat).length;
                                const label = cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                                return (
                                    <div key={cat} className={`rounded-xl border px-4 py-3 ${categoryColors[cat] || categoryColors.other}`}>
                                        <p className="font-black text-lg">{count}</p>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* File List */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Knowledge Files</p>
                                <p className="text-[10px] text-slate-600">Drop PDFs into Google Drive → Sync Now</p>
                            </div>
                            {knowledgeFiles.length === 0 ? (
                                <div className="text-center py-16 text-slate-500">
                                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-semibold">No knowledge files yet</p>
                                    <p className="text-xs mt-1">Drop PDF files into the Super Knowledge Google Drive folder, then click Sync Now</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {knowledgeFiles.map(f => (
                                        <div key={f._id} className="px-5 py-4 flex items-center justify-between hover:bg-white/2 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{f.filename}</p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                                        {f.readAt ? `✅ Read ${new Date(f.readAt).toLocaleDateString()}` : '⏳ Pending read'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${categoryColors[f.category] || categoryColors.other}`}>
                                                {(f.category || 'other').replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Reassign Units Modal ──────────────────────────────────────── */}
            {showReassign && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-black text-white">Reassign {units.length} Units</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Move all units from <span className="text-amber-400">{selectedAdmin.username}</span> to another Admin</p>
                            </div>
                            <button onClick={() => setShowReassign(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="mb-6">
                            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Target Admin</label>
                            <select
                                value={reassignTargetId}
                                onChange={e => setReassignTargetId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-white/5 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                            >
                                <option value="">Select target admin...</option>
                                {admins.filter(a => a._id !== selectedAdmin._id).map(a => (
                                    <option key={a._id} value={a._id}>{a.username} ({a.unitCount} units)</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowReassign(false)}
                                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all">
                                Cancel
                            </button>
                            <button onClick={reassignUnits} disabled={reassigning || !reassignTargetId}
                                className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {reassigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                                {reassigning ? 'Moving...' : 'Move Units'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create Admin Modal ───────────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white">Create Admin</h3>
                                    <p className="text-[10px] text-slate-500">New account with Admin privileges</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowCreateModal(false); setCreateError(''); }} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {createError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 mb-4 font-semibold">
                                ⚠️ {createError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Username *</label>
                                <input
                                    type="text" placeholder="e.g. admin_south"
                                    value={createForm.username}
                                    onChange={e => setCreateForm(p => ({ ...p, username: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-800 border border-white/5 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Display Name</label>
                                <input
                                    type="text" placeholder="e.g. South Region Admin"
                                    value={createForm.companyName}
                                    onChange={e => setCreateForm(p => ({ ...p, companyName: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-800 border border-white/5 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">6-Digit Access Code *</label>
                                <div className="relative">
                                    <input
                                        type={showCode.create ? 'text' : 'password'}
                                        placeholder="••••••" maxLength={6}
                                        value={createForm.loginCode}
                                        onChange={e => setCreateForm(p => ({ ...p, loginCode: e.target.value.replace(/\D/g, '') }))}
                                        className="w-full px-4 py-3 bg-slate-800 border border-white/5 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none font-mono tracking-[0.3em] text-lg pr-12"
                                    />
                                    <button onClick={() => setShowCode(p => ({ ...p, create: !p.create }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                        {showCode.create ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all">
                                Cancel
                            </button>
                            <button onClick={createAdmin} disabled={createLoading}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {createLoading ? 'Creating...' : 'Create Admin'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast ─────────────────────────────────────────────────────── */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl z-50 transition-all ${toast.type === 'err' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
