import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Save, AlertCircle } from 'lucide-react';

const CurrencyExchange = ({ onBack }) => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form State
    const [year, setYear] = useState(new Date().getFullYear());
    const [rate, setRate] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/rates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setRates(res.data.rates || []);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.reload();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!year || !rate) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/rates', {
                year: parseInt(year),
                rate: parseFloat(rate)
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update local list (replace or add)
            setRates(prev => {
                const filtered = prev.filter(r => r.year !== parseInt(year));
                return [res.data.rate, ...filtered].sort((a, b) => b.year - a.year);
            });

            setRate('');
            setError(null);
            alert(`Rate for ${year} updated to ${rate} KHR`);
        } catch (err) {
            setError(err.response?.data?.message || 'Error saving rate');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-teal-600 flex items-center gap-2">
                        <DollarSign className="w-6 h-6" /> Currency Exchange
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Manage Annual Exchange Rates (USD to KHR).</p>
                </div>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                    ← Back to Dashboard
                </button>
            </div>

            <div className="flex-1 p-8 overflow-auto">
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">

                    {/* Add Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-teal-100 h-fit">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-teal-500" /> Update Rate
                        </h3>
                        {error && <div className="text-red-500 text-sm mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">YEAR</label>
                                <select
                                    value={year}
                                    onChange={e => setYear(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                >
                                    {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">RATE (KHR per 1 USD)</label>
                                <input
                                    type="number"
                                    value={rate}
                                    onChange={e => setRate(e.target.value)}
                                    placeholder="e.g. 4100"
                                    className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Rate'}
                            </button>
                        </form>

                        <div className="mt-6 p-4 bg-teal-50 rounded-lg text-xs text-teal-800 leading-relaxed">
                            <strong>Note:</strong> This rate will be used to convert all General Ledger transactions for the selected year into Khmer Riel (KHR) for the Trial Balance report.
                        </div>
                    </div>

                    {/* List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="font-bold text-gray-700 text-sm uppercase">Active Rates</h3>
                        </div>
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                                ) : rates.length === 0 ? (
                                    <tr><td className="px-6 py-8 text-center text-gray-400">No rates defined.</td></tr>
                                ) : (
                                    rates.map(r => (
                                        <tr key={r._id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 font-mono font-bold text-gray-800">
                                                {r.year}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-teal-600">{r.rate.toLocaleString()}</span>
                                                <span className="text-gray-400 text-xs ml-1">KHR</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CurrencyExchange;
