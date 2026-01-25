import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Tag, AlertCircle, Edit2, Sparkles, Save, X, ArrowLeft } from 'lucide-react';

const AccountingCodes = ({ onBack }) => {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false); // Mode: Adding or Editing
    const [editId, setEditId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        toiCode: '',
        description: '',
        matchDescription: ''
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCodes();
    }, []);

    const fetchCodes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/codes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCodes(res.data.codes || []);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                alert('Session Expired.');
                localStorage.removeItem('token');
                window.location.reload();
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ code: '', toiCode: '', description: '', matchDescription: '' });
        setIsEditing(false);
        setEditId(null);
        setError(null);
    };

    const handleEditStart = (code) => {
        setFormData({
            code: code.code,
            toiCode: code.toiCode,
            description: code.description,
            matchDescription: code.matchDescription || ''
        });
        setEditId(code._id);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.code || !formData.description) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            let res;

            if (editId) {
                // UPDATE
                res = await axios.put(`/api/company/codes/${editId}`, formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                setCodes(prev => prev.map(c => c._id === editId ? res.data.code : c).sort((a, b) => a.code.localeCompare(b.code)));
            } else {
                // CREATE
                res = await axios.post('/api/company/codes', formData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setCodes(prev => [...prev, res.data.code].sort((a, b) => a.code.localeCompare(b.code)));
            }

            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Error saving code');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this code?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/company/codes/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCodes(prev => prev.filter(c => c._id !== id));
        } catch (err) {
            alert('Error deleting code.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Header - Left Aligned */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-6 sticky top-0 z-20 shadow-sm overflow-x-auto">
                <button
                    onClick={onBack}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition shrink-0"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="shrink-0">
                    <h1 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                        <Tag className="w-6 h-6" /> Accounting Codes <span className="text-sm font-normal text-gray-400">(Ai Enhanced)</span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Manage Chart of Accounts & AI Rules.</p>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-auto">
                <div className="max-w-6xl mx-auto"> {/* Widened container */}

                    {/* Toolbar */}
                    {!isEditing && (
                        <div className="mb-6 flex items-center justify-between">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition"
                            >
                                <Plus className="w-4 h-4" /> Add Code
                            </button>

                            <button
                                onClick={async () => {
                                    if (window.confirm("Use AI to research and generate rules for all missing codes? This may take a moment.")) {
                                        try {
                                            setLoading(true); // Re-use loading state to show progress
                                            const token = localStorage.getItem('token');
                                            const res = await axios.post('/api/company/codes/generate-missing', {}, {
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            alert(res.data.message);
                                            fetchCodes(); // Refresh list
                                        } catch (err) {
                                            alert("Error generating rules: " + (err.response?.data?.message || err.message));
                                            setLoading(false);
                                        }
                                    }
                                }}
                                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-medium border border-indigo-200 transition"
                            >
                                <Sparkles className="w-4 h-4" /> Auto-Research Missing Rules
                            </button>
                        </div>
                    )}

                    {/* Form (Add or Edit) */}
                    {isEditing && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 mb-6 animate-fade-in ring-2 ring-orange-50">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                {editId ? <Edit2 size={16} /> : <Plus size={16} />}
                                {editId ? 'Edit Account Code' : 'Add New Account Code'}
                            </h3>
                            {error && <div className="text-red-500 text-sm mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="flex gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">CODE</label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            placeholder="e.g. A16"
                                            className="border border-gray-300 rounded-lg px-3 py-2 w-32 font-mono text-sm uppercase focus:ring-2 focus:ring-orange-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">TOI CODE</label>
                                        <input
                                            type="text"
                                            value={formData.toiCode}
                                            onChange={e => setFormData({ ...formData, toiCode: e.target.value.toUpperCase() })}
                                            placeholder="e.g. 1000"
                                            className="border border-gray-300 rounded-lg px-3 py-2 w-32 font-mono text-sm uppercase focus:ring-2 focus:ring-orange-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">DESCRIPTION (Max 50)</label>
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="e.g. Cash in Bank"
                                            maxLength={50}
                                            className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* New 4th Field */}
                                <div className="w-full">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 flex justify-between">
                                        <span>MATCHING RULES / AI CONTEXT</span>
                                        <span className="text-[10px] text-blue-500 flex items-center gap-1"><Sparkles size={10} /> Auto-generated by AI if left blank</span>
                                    </label>
                                    <textarea
                                        value={formData.matchDescription}
                                        onChange={e => setFormData({ ...formData, matchDescription: e.target.value })}
                                        placeholder="Describe the transaction types that belong here so AI can auto-tag them correctly (e.g. 'Deposits by customers, Wire transfers, Refunds')..."
                                        rows={2}
                                        className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                                    />
                                </div>

                                <div className="flex gap-2 justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                                    >
                                        <X size={16} /> Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving ? <Sparkles className="animate-spin" size={16} /> : <Save size={16} />}
                                        {saving ? 'Saving...' : 'Save Code'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 w-24">Code</th>
                                    <th className="px-6 py-4 w-24">TOI Code</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 w-1/3">Possible Transactions (AI Rules)</th>
                                    <th className="px-6 py-4 w-32 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                                ) : codes.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No codes defined yet.</td></tr>
                                ) : (
                                    codes.map(c => (
                                        <tr key={c._id} className="hover:bg-gray-50 transition group">
                                            <td className="px-6 py-4 font-mono font-bold text-orange-600 align-top">
                                                {c.code}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-medium text-gray-600 align-top">
                                                {c.toiCode || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 font-medium align-top">
                                                {c.description}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm align-top leading-relaxed">
                                                {c.matchDescription ? (
                                                    <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-xs border border-blue-100 italic">
                                                        "{c.matchDescription}"
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 italic text-xs">No explicit rules defined</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2 align-top">
                                                <button
                                                    onClick={() => handleEditStart(c)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c._id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AccountingCodes;
