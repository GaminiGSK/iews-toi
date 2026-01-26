import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, FileText, Table, ChevronRight } from 'lucide-react';
import axios from 'axios';

// Simplified Version to Debug White Screen
const ToiAcar = ({ onBack }) => {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('TOI');

    // Minimal Fetch
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true);
            try {
                // Defensive check
                const res = await axios.get('/api/tax/templates');
                if (Array.isArray(res.data)) {
                    setTemplates(res.data);
                } else {
                    console.error("API returned non-array", res.data);
                }
            } catch (err) {
                console.error("Failed to load tax templates", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    return (
        <div className="w-full h-screen p-8 text-white flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <button onClick={onBack} className="bg-blue-600 p-2 rounded text-white font-bold">Back</button>
                <h1 className="text-2xl font-bold">TOI & ACAR (Debug Mode)</h1>
            </div>

            <div className="flex bg-slate-800 p-4 rounded mb-4 gap-4">
                <button className="text-white font-bold">TOI Form</button>
            </div>

            <div className="bg-slate-900 p-8 border rounded flex-1">
                {isLoading ? (
                    <div>Loading...</div>
                ) : (
                    <div>
                        <h2>Templates Found: {templates.length}</h2>
                        <ul>
                            {templates.map(t => (
                                <li key={t._id || t.id} className="text-gray-300">{t.name}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToiAcar;
