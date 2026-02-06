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
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-blue-500/10 rounded-2xl mb-4 border border-blue-500/20">
                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Systems Locked</h1>
                    <p className="text-slate-400">Enter authorization code to access the environment</p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-6">
                    <div>
                        <input
                            type="password"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="******"
                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-4 py-4 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-center text-sm animate-pulse">
                            Incorrect code. Please try again.
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Unlock System'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SiteGate;
