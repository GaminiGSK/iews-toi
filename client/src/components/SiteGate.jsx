import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SiteGate = ({ children }) => {
    const [accessGranted, setAccessGranted] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedAccess = localStorage.getItem('site_access');
        if (storedAccess === 'granted') {
            setAccessGranted(true);
        }
    }, []);

    const handleUnlock = async (e) => {
        e.preventDefault();

        try {
            // Prod use relative path or env var
            const res = await axios.post('/api/auth/gate-verify', { code });

            if (res.data.access === 'granted' || res.data.access === 'admin') {
                localStorage.setItem('site_access', 'granted');
                setAccessGranted(true);
                if (res.data.access === 'admin') {
                    navigate('/admin');
                }
            }
        } catch (err) {
            console.error(err);
            setError(true);
            setCode('');
        }
    };

    if (accessGranted) {
        return children;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Your Code
                    </h1>
                    <p className="text-gray-400 mt-2">Enter the 6-digit access code to continue.</p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-6">
                    <div>
                        <input
                            type="password"
                            maxLength="6"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.replace(/\D/g, ''));
                                setError(false);
                            }}
                            className="w-full text-center text-3xl tracking-[1em] py-4 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-700 font-mono"
                            placeholder="******"
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
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    >
                        Unlock System
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SiteGate;
