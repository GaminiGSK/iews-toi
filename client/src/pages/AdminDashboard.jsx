import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, LogOut, Building, Mail, Lock, Edit2, Trash2, FileText, CloudUpload, X, CheckCircle, Save, Loader2, Sparkles, Hash, Type } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DynamicForm from '../components/DynamicForm';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ companyName: '', password: '' });
    const [isChangingCode, setIsChangingCode] = useState(false);
    const [newAdminCode, setNewAdminCode] = useState('');
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'tax_forms'

    // Tax Forms State
    const [templates, setTemplates] = useState([]);
    const [activeTemplateId, setActiveTemplateId] = useState(null);
    const [savingLibrary, setSavingLibrary] = useState(false);
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

    const fetchTemplates = async () => {
        try {
            const res = await axios.get('/api/tax/templates');
            // Merge backend templates
            const apiTemplates = res.data.map(t => ({
                ...t,
                id: t._id,
                status: 'Saved', // Force Saved status for anything from DB
                // Construct preview URL for saved files
                previewUrl: `/api/tax/file/${t.filename}`
            }));
            setTemplates(apiTemplates);
        } catch (err) {
            console.error("Error fetching templates", err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchTemplates();
    }, []);

    // Safety: Reset active selection if template disappears (e.g. deleted)
    useEffect(() => {
        if (activeTemplateId && !templates.find(t => t.id === activeTemplateId)) {
            setActiveTemplateId(null);
        }
    }, [templates, activeTemplateId]);

    // Tax Form Handlers
    const handleSaveLibrary = async () => {
        // Find New templates (remove file check here, verify later)
        const newTemplates = templates.filter(t => t.status === 'New');
        if (newTemplates.length === 0) return alert('No new templates to save.');

        setSavingLibrary(true);
        const formData = new FormData();
        let appendedCount = 0;

        newTemplates.forEach(t => {
            if (t.file) {
                formData.append('files', t.file);
                appendedCount++;
            }
        });

        if (appendedCount === 0) {
            setSavingLibrary(false);
            return alert('Critical Error: The file data is missing from memory. Please delete these items and re-upload.');
        }

        try {
            const res = await axios.post('/api/tax/templates', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`Successfully saved ${res.data.templates.length} templates!`);
            fetchTemplates();
        } catch (err) {
            console.error(err);
            alert('Failed to save templates.');
        } finally {
            setSavingLibrary(false);
        }
    };

    const handleSaveMappings = async () => {
        if (!activeTemplateId) return;
        const template = templates.find(t => t.id === activeTemplateId);
        if (!template) return;

        try {
            // If template is New, it must be saved to library first
            if (template.status === 'New') {
                return alert('Please Save the Template to the Library (Center Panel) first.');
            }

            await axios.put(`/api/tax/templates/${activeTemplateId}`, {
                mappings: template.mappings
            });
            alert('Mappings saved successfully!');
            fetchTemplates();
        } catch (err) {
            console.error(err);
            alert('Error saving mappings.');
        }
    };

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
        if (!activeTemplateId) {
            return alert("Please click on a template in the list (left) to select it first.");
        }
        const template = templates.find(t => t.id === activeTemplateId);
        // Only allow analysis if Saved
        if (template.status === 'New') {
            return alert('Please Save the Template to the Library first before analyzing.');
        }

        if (!window.confirm('Blue Agent will scan this image to auto-detect fields. Existing mappings will be overwritten. Continue?')) return;

        try {
            setIsScanning(true);
            const res = await axios.post(`/api/tax/templates/${activeTemplateId}/analyze`);
            console.log("[AI Scan Result]", res.data); // DEBUG LOG
            // Update local state
            setTemplates(prev => prev.map(t => {
                if (t.id === activeTemplateId) return { ...t, mappings: res.data.mappings, harvestedText: res.data.rawText };
                return t;
            }));

            setTimeout(() => {
                alert(`Analysis Complete! Found ${res.data.mappings.length} fields. Check the purple panel at bottom-right for the text summary.`);
            }, 500);
        } catch (err) {
            console.error(err);
            alert('AI Analysis Failed. Check server logs.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleDeleteTemplate = async (e, template) => {
        e.stopPropagation();
        if (!window.confirm(`Delete ${template.name}?`)) return;

        if (template.status === 'New') {
            setTemplates(prev => prev.filter(t => t.id !== template.id));
            if (activeTemplateId === template.id) setActiveTemplateId(null);
        } else {
            // Saved Template
            try {
                await axios.delete(`/api/tax/templates/${template.id}`);
                setTemplates(prev => prev.filter(t => t.id !== template.id));
                if (activeTemplateId === template.id) setActiveTemplateId(null);
            } catch (err) {
                console.error(err);
                alert('Failed to delete template');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-black text-white p-10 font-sans">
            {/* Header / Top Bar */}
            <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm text-sm tracking-tighter">
                        GK
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">GK SMART <span className="text-gray-400 font-normal">& Ai</span></span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsChangingCode(true)}
                        className="text-gray-400 hover:text-white transition text-sm font-medium px-4 py-2"
                    >
                        Change Admin Code
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-white/10 text-white border border-white/20 px-6 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition whitespace-nowrap"
                    >
                        Log Out
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto mb-10 border-b border-gray-800 flex gap-8">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-4 text-lg font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                >
                    <UserPlus size={20} />
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('tax_forms')}
                    className={`pb-4 text-lg font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'tax_forms' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                >
                    <FileText size={20} />
                    Tax Forms Configuration
                </button>
                <button
                    onClick={() => setActiveTab('form_setup')}
                    className={`pb-4 text-lg font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'form_setup' ? 'border-purple-500 text-purple-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                >
                    <Sparkles size={20} />
                    Form Setup
                </button>
            </div>

            {/* TAB 1: USER MANAGEMENT */}
            {activeTab === 'users' && (
                <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Registered Companies</h2>
                            <p className="text-gray-400">Manage client access and company profiles.</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setIsCreating(true); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition flex items-center gap-2"
                        >
                            <UserPlus size={18} />
                            Create New User
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.map((user) => (
                            <div key={user._id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex justify-between items-center group hover:border-blue-500/50 transition duration-300">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                        {user.companyName || user.companyCode}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
                                        <Lock size={12} />
                                        {user.loginCode || '******'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => startEdit(user)}
                                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                                        title="Edit User"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteUser(user._id)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                        title="Delete User"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {users.length === 0 && (
                            <div className="col-span-full py-20 text-center text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
                                No companies found. Create one to get started.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: TAX FORMS CONFIGURATION */}
            {activeTab === 'tax_forms' && (
                <div className="flex flex-1 gap-6 min-h-[calc(100vh-200px)] p-8 max-w-[1400px]">

                    {/* COLUMN 1: UPLOAD ZONE - 50% Smaller */}
                    <div className="w-32 shrink-0 flex flex-col">
                        <div
                            className="flex-1 bg-gray-900/50 border-2 border-dashed border-blue-900/50 rounded-2xl p-4 text-center hover:border-blue-500 hover:bg-blue-900/10 transition relative group flex flex-col items-center justify-center cursor-pointer"
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                                e.preventDefault(); e.stopPropagation();
                                const files = Array.from(e.dataTransfer.files);
                                if (files.length > 0) {
                                    const newTemplates = [];

                                    files.forEach(file => {
                                        // Check for duplicates (by name)
                                        const exists = templates.some(t => t.name === file.name || t.originalName === file.name);
                                        if (exists) return; // Skip duplicate

                                        newTemplates.push({
                                            id: Date.now() + Math.random(),
                                            name: file.name,
                                            file: file,
                                            type: file.type,
                                            size: (file.size / 1024).toFixed(2) + ' KB',
                                            previewUrl: URL.createObjectURL(file), // Helper for local preview
                                            status: 'New'
                                        });
                                    });

                                    setTemplates(prev => [...prev, ...newTemplates]);
                                    if (!activeTemplateId && newTemplates.length > 0) setActiveTemplateId(newTemplates[0].id);
                                }
                            }}
                        >
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files?.length > 0) {
                                        const files = Array.from(e.target.files);
                                        if (files.length > 0) {
                                            const newTemplates = files.map(file => ({
                                                id: Date.now() + Math.random(),
                                                name: file.name,
                                                file: file,
                                                type: file.type,
                                                size: (file.size / 1024).toFixed(2) + ' KB',
                                                previewUrl: URL.createObjectURL(file),
                                                status: 'New'
                                            }));
                                            setTemplates(prev => [...prev, ...newTemplates]);
                                            if (!activeTemplateId && newTemplates.length > 0) setActiveTemplateId(newTemplates[0].id);
                                        }
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-4 border border-blue-500/20">
                                <CloudUpload size={24} />
                            </div>
                            <h3 className="font-bold text-white text-[10px] mb-2 leading-tight">
                                Upload Templates
                            </h3>
                            <p className="text-xs text-gray-400">
                                Drag & drop JPG/PNG pages
                            </p>
                        </div>
                    </div>

                    {/* COLUMN 2: TEMPLATE LIBRARY */}
                    <div className="w-80 shrink-0 flex flex-col space-y-4">
                        <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col h-full overflow-hidden">
                            <div className="p-4 bg-gray-900/50 border-b border-gray-800 font-bold text-white flex flex-col shrink-0 gap-3">
                                <div className="flex justify-between items-center">
                                    <span>Form Library ({templates.length})</span>
                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                        Total Pages
                                    </span>
                                </div>
                                <button
                                    onClick={handleSaveLibrary}
                                    disabled={savingLibrary || templates.filter(t => t.status === 'New').length === 0}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-bold py-2 rounded transition flex items-center justify-center gap-2"
                                >
                                    {savingLibrary ? <Loader2 className="animate-spin h-3 w-3" /> : <Save size={14} />}
                                    {savingLibrary ? 'SAVING...' : `SAVE ALL (${templates.filter(t => t.status === 'New').length})`}
                                </button>
                            </div>
                            <div className="divide-y divide-gray-800 overflow-y-auto flex-1 p-2">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`p-3 mb-2 rounded-lg flex items-center justify-between transition cursor-pointer group ${activeTemplateId === template.id ? 'bg-blue-900/20 border border-blue-500/50' : 'hover:bg-gray-800 border border-transparent'}`}
                                        onClick={() => setActiveTemplateId(template.id)}
                                    >
                                        <div className="flex-1 min-w-0 mr-2 flex items-center gap-3">
                                            {/* Thumbnail */}
                                            <div className="w-8 h-10 bg-gray-800 rounded flex-shrink-0 overflow-hidden border border-gray-700">
                                                {/* Use previewUrl if available (New/Loaded). Using path directly won't work without a route. */}
                                                <img
                                                    src={template.previewUrl || '/placeholder.png'}
                                                    alt=""
                                                    className="w-full h-full object-cover opacity-80"
                                                    onError={(e) => {
                                                        // Fallback for broken images (e.g. saved ones we can't load yet)
                                                        e.target.style.display = 'none';
                                                        e.target.parentNode.innerHTML = '📄';
                                                    }}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-white text-xs truncate mb-0.5" title={template.name}>
                                                    {template.name}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {template.status === 'New' ? (template.size || 'Pending') : 'Saved'} • {template.status}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteTemplate(e, template)}
                                            className="p-1.5 rounded-full hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {templates.length === 0 && (
                                    <div className="text-center text-gray-600 text-xs py-10 italic">
                                        No templates uploaded.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 3: EDITOR WORKBENCH */}
                    <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden relative">
                        {/* Toolbar */}
                        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-white text-sm">Template Editor</h3>
                                {activeTemplateId && (
                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                                        {templates.find(t => t.id === activeTemplateId)?.name}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    id="analyze-btn"
                                    onClick={handleAnalyze}
                                    disabled={isScanning}
                                    className={`text-xs ${isScanning ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'} text-white px-3 py-1.5 rounded font-bold transition mr-2 flex items-center gap-1`}
                                    title="Use AI to detect fields"
                                >
                                    {isScanning ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin" />
                                            Scanning...
                                        </>
                                    ) : (
                                        <>
                                            <CloudUpload size={12} className="animate-bounce" />
                                            Auto-Scan
                                        </>
                                    )}
                                </button>
                                <div className="text-xs text-gray-500 flex items-center gap-2 mr-4">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                    Draw Mode Active
                                </div>
                                <button
                                    onClick={handleSaveMappings}
                                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-bold transition"
                                >
                                    Save Mappings
                                </button>
                            </div>
                        </div>

                        {/* Canvas Area with Drawing Logic */}
                        <div className="flex-1 bg-black/50 overflow-auto p-8 flex items-center justify-center relative select-none">
                            {activeTemplateId ? (
                                <div
                                    className="relative shadow-2xl border border-gray-700 max-w-full cursor-crosshair group"
                                    onMouseDown={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                        const y = ((e.clientY - rect.top) / rect.height) * 100;

                                        setTemplates(prev => prev.map(t => {
                                            if (t.id === activeTemplateId) {
                                                return {
                                                    ...t,
                                                    drawing: true,
                                                    currentBox: { startX: x, startY: y, x, y, w: 0, h: 0 }
                                                };
                                            }
                                            return t;
                                        }));
                                    }}
                                    onMouseMove={(e) => {
                                        const active = templates.find(t => t.id === activeTemplateId);
                                        if (active?.drawing) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const currentX = ((e.clientX - rect.left) / rect.width) * 100;
                                            const currentY = ((e.clientY - rect.top) / rect.height) * 100;

                                            const startX = active.currentBox.startX;
                                            const startY = active.currentBox.startY;

                                            const x = Math.min(startX, currentX);
                                            const y = Math.min(startY, currentY);
                                            const w = Math.abs(currentX - startX);
                                            const h = Math.abs(currentY - startY);

                                            setTemplates(prev => prev.map(t => {
                                                if (t.id === activeTemplateId) {
                                                    return { ...t, currentBox: { ...t.currentBox, x, y, w, h } };
                                                }
                                                return t;
                                            }));
                                        }
                                    }}
                                    onMouseUp={() => {
                                        setTemplates(prev => prev.map(t => {
                                            if (t.id === activeTemplateId && t.drawing) {
                                                const newMapping = {
                                                    id: Date.now(),
                                                    x: t.currentBox.x,
                                                    y: t.currentBox.y,
                                                    w: t.currentBox.w,
                                                    h: t.currentBox.h,
                                                    label: `Field ${(t.mappings || []).length + 1}`
                                                };
                                                const mappings = (newMapping.w > 1 && newMapping.h > 1)
                                                    ? [...(t.mappings || []), newMapping]
                                                    : (t.mappings || []);

                                                return { ...t, drawing: false, currentBox: null, mappings };
                                            }
                                            return t;
                                        }));
                                    }}
                                >
                                    <img
                                        src={templates.find(t => t.id === activeTemplateId)?.previewUrl || '/placeholder.png'}
                                        alt="Form Template"
                                        className="h-[80vh] w-auto object-contain block pointer-events-none"
                                        draggable="false"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<div class="text-white">Image Not Loaded (Save & Refresh)</div>'; }}
                                    />

                                    {/* Render Mappings */}
                                    {templates.find(t => t.id === activeTemplateId)?.mappings?.map(m => (
                                        <div
                                            key={m.id}
                                            className="absolute border-2 border-blue-500 bg-blue-500/20 hover:bg-blue-500/30 transition flex items-center justify-center cursor-pointer"
                                            style={{
                                                left: `${m.x}%`,
                                                top: `${m.y}%`,
                                                width: `${m.w}%`,
                                                height: `${m.h}%`
                                            }}
                                            title={m.label}
                                        >
                                            <span className="text-[10px] font-bold text-white bg-blue-600 px-1 rounded shadow-sm">
                                                {m.label}
                                            </span>
                                            <button
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/box:opacity-100 hover:scale-110 transition"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTemplates(prev => prev.map(t => {
                                                        if (t.id === activeTemplateId) {
                                                            return { ...t, mappings: t.mappings.filter(map => map.id !== m.id) };
                                                        }
                                                        return t;
                                                    }));
                                                }}
                                            >
                                                <X size={8} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Render Box Being Drawn */}
                                    {templates.find(t => t.id === activeTemplateId)?.drawing && templates.find(t => t.id === activeTemplateId)?.currentBox && (
                                        <div
                                            className="absolute border-2 border-green-400 bg-green-400/20"
                                            style={{
                                                left: `${templates.find(t => t.id === activeTemplateId)?.currentBox?.x}%`,
                                                top: `${templates.find(t => t.id === activeTemplateId)?.currentBox?.y}%`,
                                                width: `${templates.find(t => t.id === activeTemplateId)?.currentBox?.w}%`,
                                                height: `${templates.find(t => t.id === activeTemplateId)?.currentBox?.h}%`
                                            }}
                                        />
                                    )}

                                </div>
                            ) : (
                                <div className="text-center text-gray-600">
                                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Select a template to configure mappings</p>
                                </div>
                            )}

                            {/* Harvested Text Overlay (Troubleshooting) */}
                            {activeTemplateId && templates.find(t => t.id === activeTemplateId)?.harvestedText && (
                                <div className="fixed bottom-6 right-6 max-w-md bg-gray-900/98 border border-purple-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.2)] backdrop-blur-md z-[100] animate-in slide-in-from-bottom-5 duration-300">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest">AI Vision: Harvested Text</h4>
                                        </div>
                                        <button
                                            onClick={() => setTemplates(prev => prev.map(t => t.id === activeTemplateId ? { ...t, harvestedText: null } : t))}
                                            className="text-gray-500 hover:text-white p-1"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-300 leading-relaxed max-h-64 overflow-y-auto font-mono bg-black/40 p-4 rounded-xl border border-white/5">
                                        {templates.find(t => t.id === activeTemplateId)?.harvestedText}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-4 italic">
                                        This is what the AI "sees" in the document.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* TAB 3: FORM SETUP (Text Work Area) */}
            {activeTab === 'form_setup' && (
                <div className="flex-1 p-8 max-w-[1400px] animate-in fade-in slide-in-from-left-5 duration-500">
                    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-10 min-h-[80vh] flex flex-col items-center justify-start space-y-12">

                        {/* Header */}
                        <div className="w-full flex justify-between items-end border-b border-gray-800 pb-8">
                            <div>
                                <h2 className="text-4xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
                                    <Sparkles className="text-purple-400" size={36} />
                                    Form Setup Studio
                                </h2>
                                <p className="text-gray-400 text-lg">Positioning bilingual blocks and data inputs.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700">
                                    <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Active Template</span>
                                    <span className="text-white font-bold">{templates.find(t => t.id === activeTemplateId)?.name || "No Selection"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full flex gap-10">
                            {/* LEFT: THE LIVE FORM CANVAS */}
                            <div className="flex-1 bg-white rounded-2xl shadow-2xl overflow-hidden min-h-[1000px] border-8 border-gray-800/20">
                                <div className="p-8">
                                    <DynamicForm
                                        schema={{ title: "លិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ", titleKh: "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED" }}
                                        data={{
                                            taxYear: "2023",
                                            taxMonths: "12",
                                            fromDate: "01012023",
                                            untilDate: "31122023",
                                            enterpriseName: "SAMPLE ENTERPRISE CO., LTD",
                                            branchCount: "1",
                                            regDate: "15062022",
                                            ownerName: "MR. JOHN DOE",
                                            businessActivity: "Information Technology Services",
                                            accountantName: "GK SMART ASSISTANT",
                                            registeredAddress: "No. 123, St. 456, Phnom Penh, Cambodia",
                                            agentLicenseNumber: "TAX-2026-XY-999"
                                        }}
                                        onChange={() => { }}
                                    />
                                </div>
                            </div>

                            {/* RIGHT: TEXT HARVEST PANEL */}
                            <div className="w-96 shrink-0 space-y-6">
                                <div className="bg-gray-800/40 rounded-2xl border border-gray-700 p-6 backdrop-blur-md">
                                    <div className="flex items-center gap-2 mb-6 text-purple-400">
                                        <Type size={20} />
                                        <h3 className="font-bold uppercase tracking-widest text-sm text-white">Harvested Text</h3>
                                    </div>

                                    <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                                        {templates.find(t => t.id === activeTemplateId)?.harvestedText ? (
                                            templates.find(t => t.id === activeTemplateId).harvestedText.split('\n').map((line, i) => (
                                                <div key={i} className="group cursor-pointer">
                                                    <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg group-hover:border-purple-500/50 group-hover:bg-purple-900/10 transition duration-200">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-[10px] font-bold text-gray-500 font-mono">L{i + 1}</span>
                                                            <Hash size={10} className="text-gray-700 group-hover:text-purple-400" />
                                                        </div>
                                                        <p className="text-xs text-gray-300 font-medium leading-relaxed">{line}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-20 text-center text-gray-600 italic">
                                                <CloudUpload className="mx-auto mb-4 opacity-20" size={48} />
                                                No text harvested yet.<br />Please run "Auto-Scan" in the Library tab.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Change Admin Code */}
            {isChangingCode && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white text-black p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button
                            onClick={() => setIsChangingCode(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-black"
                        >
                            ✕
                        </button>
                        <h2 className="text-xl font-bold mb-6">Change Admin Code</h2>

                        <form onSubmit={handleUpdateCode} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">New 6-Digit Code</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={newAdminCode}
                                    onChange={e => setNewAdminCode(e.target.value)}
                                    placeholder="e.g. 998877"
                                    type="text"
                                    maxLength="6"
                                    required
                                />
                            </div>
                            <button className="w-full bg-black text-white py-2 rounded mt-4">Update Code</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for Create/Edit */}
            {(isCreating || isEditing) && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white text-black p-8 rounded-xl shadow-lg w-full max-w-md relative">
                        <button
                            onClick={resetForm}
                            className="absolute top-4 right-4 text-gray-500 hover:text-black"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-blue-600 mb-2">
                                {isEditing ? 'Edit Company' : 'Create Company'}
                            </h2>
                        </div>

                        {message && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded text-sm">{message}</div>}

                        <form onSubmit={isEditing ? handleUpdateUser : handleCreateUser} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <input
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        value={formData.companyName}
                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                        placeholder="e.g. ABC PTE LTD"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">System Code</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <input
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="e.g. 654565"
                                        required
                                    />
                                </div>
                            </div>
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition duration-200">
                                {isEditing ? 'Save Changes' : 'Add'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
