import { useState } from 'react';
import axios from 'axios';
import { UserPlus, LogOut, Building, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const [formData, setFormData] = useState({ companyCode: '', password: '', email: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/auth/create-user', formData);
            setMessage('User created successfully!');
            setFormData({ companyCode: '', password: '', email: '' });
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error creating user');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex-shrink-0 hidden md:block">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-blue-600">IEWS TOI</h2>
                    <p className="text-xs text-gray-500">Admin Console</p>
                </div>
                <nav className="mt-4 px-4 space-y-2">
                    <a href="#" className="flex items-center space-x-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg">
                        <UserPlus size={18} />
                        <span>User Management</span>
                    </a>
                </nav>
                <div className="absolute bottom-4 left-4 right-4">
                    <button onClick={handleLogout} className="flex items-center space-x-2 w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                    <div className="md:hidden">
                        <button onClick={handleLogout} className="text-gray-600"><LogOut /></button>
                    </div>
                </header>

                {/* Create User Form */}
                <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <UserPlus size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Create New Company User</h2>
                            <p className="text-sm text-gray-500">Register a new company code for access.</p>
                        </div>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg text-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleCreateUser} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Code (Login ID)</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. KH001"
                                    value={formData.companyCode}
                                    onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email (Optional)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm">
                                Create Company User
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
