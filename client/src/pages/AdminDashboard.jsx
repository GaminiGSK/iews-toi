import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, LogOut, Building, Mail, Lock, Edit2, Trash2, FileText, CloudUpload, X, CheckCircle, Save, Loader2 } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'tax_forms'
    
    // Tax Forms State
    const [templates, setTemplates] = useState([]);
    const [activeTemplateId, setActiveTemplateId] = useState(null);
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

    useEffect(() => {
        fetchUsers();
    }, []);

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
                <div className="flex flex-1 gap-6 min-h-[calc(100vh-200px)] p-8">

                    {/* COLUMN 1: UPLOAD ZONE */}
                    <div className="w-64 shrink-0 flex flex-col">
                        <div
                            className="flex-1 bg-gray-900/50 border-2 border-dashed border-blue-900/50 rounded-2xl p-4 text-center hover:border-blue-500 hover:bg-blue-900/10 transition relative group flex flex-col items-center justify-center cursor-pointer"
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                                e.preventDefault(); e.stopPropagation();
                                const files = Array.from(e.dataTransfer.files);
                                if (files.length > 0) {
                                    // Handle Upload (Mock for now)
                                    const newTemplates = files.map(file => ({
                                        id: Date.now() + Math.random(),
                                        name: file.name,
                                        file: file,
                                        previewUrl: URL.createObjectURL(file),
                                        status: 'New'
                                    }));
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
                                        const newTemplates = files.map(file => ({
                                            id: Date.now() + Math.random(),
                                            name: file.name,
                                            file: file,
                                            previewUrl: URL.createObjectURL(file),
                                            status: 'New'
                                        }));
                                        setTemplates(prev => [...prev, ...newTemplates]);
                                        if (!activeTemplateId && newTemplates.length > 0) setActiveTemplateId(newTemplates[0].id);
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-4 border border-blue-500/20">
                                <CloudUpload size={24} />
                            </div>
                            <h3 className="font-bold text-white text-sm mb-2 leading-tight">
                                Upload Tax Form Templates
                            </h3>
                            <p className="text-xs text-gray-400">
                                Drag & drop JPG/PNG pages
                            </p>
                        </div>
                    </div>

                    {/* COLUMN 2: TEMPLATE LIBRARY */}
                    <div className="w-80 shrink-0 flex flex-col space-y-4">
                        <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col h-full overflow-hidden">
                            <div className="p-4 bg-gray-900/50 border-b border-gray-800 font-bold text-white flex flex-col gap-3 shrink-0">
                                <div className="flex justify-between items-center">
                                    <span>Form Library ({templates.length})</span>
                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                        Total Pages
                                    </span>
                                </div>
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
                                                <img src={template.previewUrl} alt="" className="w-full h-full object-cover opacity-80" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-white text-xs truncate mb-0.5" title={template.name}>
                                                    {template.name}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {template.status} • 0 Mappings
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTemplates(prev => prev.filter(t => t.id !== template.id));
                                                if (activeTemplateId === template.id) setActiveTemplateId(null);
                                            }}
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
                                <button className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-bold transition">
                                    Save Configuration
                                </button>
                            </div>
                        </div>

                        {/* Canvas Area */}
                        <div className="flex-1 bg-black/50 overflow-auto p-8 flex items-center justify-center relative">
                            {activeTemplateId ? (
                                <div className="relative shadow-2xl border border-gray-700 max-w-full">
                                    <img
                                        src={templates.find(t => t.id === activeTemplateId)?.previewUrl}
                                        alt="Form Template"
                                        className="max-h-[70vh] w-auto block select-none"
                                    />
                                    {/* Overlay Layer (Simulation) */}
                                    <div className="absolute inset-0 group">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition">
                                            Click and Drag to map fields (Coming Soon)
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-600">
                                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Select a template to configure mappings</p>
                                </div>
                            )}
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
