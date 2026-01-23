import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, LogOut, Building, Mail, Lock, Edit2, Trash2 } from 'lucide-react';
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
            <div className="max-w-4xl mx-auto flex justify-between items-center mb-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm text-sm tracking-tighter">
                        GK
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">GK SMART <span className="text-gray-400 font-normal">& Ai</span></span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsChangingCode(true)}
                        className="border border-white px-4 py-3 text-lg font-medium hover:bg-gray-900 transition text-white"
                    >
                        Change Admin Code
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsCreating(true); }}
                        className="border-2 border-white px-8 py-3 text-lg font-medium hover:bg-white hover:text-black transition text-white"
                    >
                        Create TOI
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-white text-black px-8 py-3 text-lg font-medium hover:bg-gray-200 transition"
                    >
                        Log Out
                    </button>
                </div>
            </div>

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

            {/* List */}
            <div className="max-w-3xl mx-auto">
                <div className="space-y-8">
                    {users.map((user) => (
                        <div key={user._id} className="flex justify-between items-center text-xl border-b border-gray-800 pb-4">
                            <div className="flex gap-20 items-center">
                                <span className="text-red-500 font-medium tracking-wide min-w-[200px]">
                                    {user.companyName || user.companyCode}
                                </span>
                                <span className="text-red-500 font-medium tracking-wide">
                                    {user.loginCode || '******'}
                                </span>
                            </div>
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => startEdit(user)}
                                    className="text-white hover:text-blue-400 transition flex items-center gap-2 text-sm"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => deleteUser(user._id)}
                                    className="text-white hover:text-red-500 transition flex items-center gap-2 text-sm"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {users.length === 0 && (
                        <div className="text-center text-gray-500 mt-20">No companies found. Create one!</div>
                    )}
                </div>
            </div>
        </div>
    );
}
