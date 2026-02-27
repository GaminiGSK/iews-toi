import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post('/api/auth/login', { username, code });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            if (res.data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid Credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-sans">
            <div className="bg-slate-800/50 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md relative overflow-hidden group">
                {/* Decorative Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700"></div>

                <div className="text-center mb-10 relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-blue-600/20 mx-auto mb-6 tracking-tighter hover:scale-110 transition-transform duration-500 cursor-default">
                        GK
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">GK SMART <span className="text-blue-400">&</span> Ai</h1>
                    <div className="h-1 w-12 bg-blue-500/50 mx-auto mb-4 rounded-full"></div>
                    <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px]">Neural Node Secure Login</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl mb-8 text-[11px] font-bold text-center border border-red-500/20 animate-pulse uppercase tracking-wider">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                    <div className="group/input">
                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest pl-1">Target Account</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                className="w-full pl-14 pr-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all font-medium"
                                placeholder="Username (e.g. Admin)"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="group/input">
                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest pl-1">Authorization Code</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                            <input
                                type="password"
                                className="w-full pl-14 pr-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all font-mono tracking-[0.3em] text-lg"
                                placeholder="••••••"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/10 active:scale-[0.98] uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 border border-white/5 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Initialize Session'}
                    </button>

                    <div className="text-center mt-6">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Secure Entry Protocol Alpha-10</p>
                    </div>
                </form>

                {/* Bottom Footer Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
            </div>
        </div>
    );
}
