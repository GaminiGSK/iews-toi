import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Building } from 'lucide-react';

export default function Login() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Auto-login removed to allow access to main account
    /*
    useEffect(() => {
        if (window.location.hostname === 'localhost') {
            axios.post('/api/auth/dev-login')
                .then(res => {
                    localStorage.setItem('token', res.data.token);
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                    navigate('/admin'); 
                })
                .catch(err => console.error("Dev auto-login failed:", err));
        }
    }, [navigate]);
    */

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/auth/login', { code });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            if (res.data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid Access Code');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mx-auto mb-4 tracking-tighter">
                        GK
                    </div>
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">GK SMART & Ai</h1>
                    <p className="text-gray-500">Welcome Back</p>
                    <p className="text-gray-400 text-sm mt-1">Sign in with your Access Code</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Access Code</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                placeholder="Enter your 6-digit code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        Sign In
                    </button>

                    <div className="text-center mt-4">
                        <a href="/admin" className="text-sm text-gray-400 hover:text-gray-600">Admin Access</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
