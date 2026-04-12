import { useState } from 'react';
import axios from 'axios';
import { Lock, User } from 'lucide-react';

export default function EmbedLogin() {
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post('/api/auth/login', { username, code });
            const token = res.data.token;
            const user = res.data.user;

            // Optional: Store locally in the iframe's origin just in case
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setSuccess(true);

            // Send successful auth data parent window allowing cross-origin
            window.parent.postMessage({
                type: 'GKSMART_AUTH_SUCCESS',
                payload: { token, user }
            }, '*');

        } catch (err) {
            setError(err.response?.data?.message || 'Invalid Credentials');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full h-screen bg-[#0f172a] flex items-center justify-center font-sans text-white text-center p-8">
                <div>
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <Lock className="text-emerald-400 w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Authenticated</h2>
                    <p className="text-sm text-slate-400 font-semibold">Connection established with host window.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#0f172a] flex items-center justify-center font-sans">
            <div className="w-full h-full p-8 flex flex-col justify-center max-w-[400px]">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-600/20 mx-auto mb-5 tracking-tighter">
                        GK
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Login</h1>
                    <div className="h-1 w-8 bg-blue-500/50 mx-auto rounded-full"></div>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-6 text-[10px] font-bold text-center border border-red-500/20 uppercase tracking-wider animate-pulse">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="group/input">
                        <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest pl-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border border-white/5 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 outline-none text-sm font-medium transition-all"
                                placeholder="Enter Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="group/input">
                        <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest pl-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors" />
                            <input
                                type="password"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border border-white/5 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 outline-none font-mono tracking-[0.3em] text-lg transition-all"
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
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] uppercase tracking-[0.2em] text-[10px] disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Processing...' : 'Authorize Client'}
                    </button>
                    
                    <div className="text-center mt-6">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Secured by GK SMART AI Endpoint</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
