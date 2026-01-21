import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Tag, AlertCircle } from 'lucide-react';

const AccountingCodes = ({ onBack }) => {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [newCode, setNewCode] = useState('');
    const [newDesc, setNewDesc] = useState('');
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

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCode || !newDesc) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/codes', {
                code: newCode,
                description: newDesc
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setCodes(prev => [...prev, res.data.code].sort((a, b) => a.code.localeCompare(b.code)));
            setNewCode('');
            setNewDesc('');
            setIsAdding(false);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Error adding code');
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
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                        <Tag className="w-6 h-6" /> Accounting Codes
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Manage Chart of Accounts.</p>
                </div>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                    ← Back to Dashboard
                </button>
            </div>

            <div className="flex-1 p-8 overflow-auto">
                <div className="max-w-4xl mx-auto">

                    {/* Add Button */}
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="mb-6 flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition"
                        >
                            <Plus className="w-4 h-4" /> Add Code
                        </button>
                    )}

                    {/* Add Form */}
                    {isAdding && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 mb-6 animate-fade-in">
                            <h3 className="font-bold text-gray-800 mb-4">Add New Account Code</h3>
                            {error && <div className="text-red-500 text-sm mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

                            <form onSubmit={handleAdd} className="flex gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">CODE</label>
                                    <input
                                        type="text"
                                        value={newCode}
                                        onChange={e => setNewCode(e.target.value.toUpperCase())}
                                        placeholder="e.g. A16"
                                        className="border border-gray-300 rounded-lg px-3 py-2 w-32 font-mono text-sm uppercase focus:ring-2 focus:ring-orange-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">DESCRIPTION (Max 50)</label>
                                    <input
                                        type="text"
                                        value={newDesc}
                                        onChange={e => setNewDesc(e.target.value)}
                                        placeholder="e.g. Cash in Bank"
                                        maxLength={50}
                                        className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); setError(null); }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold"
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    )}

                    {/* List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 w-[150px]">Code</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 w-[100px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                                ) : codes.length === 0 ? (
                                    <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400">No codes defined yet.</td></tr>
                                ) : (
                                    codes.map(c => (
                                        <tr key={c._id} className="hover:bg-gray-50 transition group">
                                            <td className="px-6 py-4 font-mono font-bold text-orange-600">
                                                {c.code}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 font-medium">
                                                {c.description}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(c._id)}
                                                    className="text-gray-300 hover:text-red-500 transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
