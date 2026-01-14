import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Building } from 'lucide-react';

export default function Login() {
    const [companyCode, setCompanyCode] = useState('GGMT');
    const [password, setPassword] = useState('ggmt1235#');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { companyCode, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user)); // Store user info

            if (res.data.user.isFirstLogin) {
                navigate('/change-password');
            } else if (res.data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-blue-600 mb-2">IEWS TOI</h2>
                    <h1 className="text-xl font-bold text-gray-800">Welcome Back</h1>
                    <p className="text-gray-500">Sign in with your Company Code</p>
                </div>

                {error && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Code</label>
                        <div className="relative">
                            <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={companyCode}
                                onChange={(e) => setCompanyCode(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                placeholder="e.g. ADMIN01 or COMP001"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition duration-200"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}
