import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SiteGate = ({ children }) => {
    const [accessGranted, setAccessGranted] = useState(false);
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if access was already granted in this session
        const status = localStorage.getItem('site_access');
        if (status === 'granted' || status === 'admin') {
            setAccessGranted(true);
        }
    }, []);

    const handleUnlock = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(false);

        try {
            const res = await axios.post('/api/auth/gate-verify', { code });

            if (res.data.access === 'granted' || res.data.access === 'admin') {
                localStorage.setItem('site_access', res.data.access);

                // --- SESSION BRIDGE: If the gate also returned a session, store it ---
                if (res.data.token && res.data.user) {
                    localStorage.setItem('token', res.data.token);
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                }

                setAccessGranted(true);
            }
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (accessGranted) {
        return children;
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                {/* Decorative Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700"></div>

                <div className="text-center mb-10 relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-blue-600/20 mx-auto mb-6 tracking-tighter hover:scale-110 transition-transform duration-500 cursor-default">
                        GK
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">GK SMART <span className="text-blue-400">&</span> Ai</h1>
                    <div className="h-1 w-12 bg-blue-500/50 mx-auto mb-4 rounded-full"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Neural Node Authorization Required</p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-6 relative z-10">
                    <div className="group/input">
                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest pl-1 text-center">Authorization Code</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="••••••"
                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-4 py-4 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono placeholder:text-slate-700"
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-[11px] font-bold text-center border border-red-500/20 animate-pulse uppercase tracking-wider">
                            Access Denied: Invalid Override Code
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/10 active:scale-[0.98] uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 border border-white/5 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Authenticating...
                            </span>
                        ) : 'Unlock Environment'}
                    </button>

                    <div className="text-center mt-6">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Secure Entry Protocol Alpha-9</p>
                    </div>
                </form>

                {/* Bottom Footer Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
            </div>
        </div>
    );
};

export default SiteGate;
