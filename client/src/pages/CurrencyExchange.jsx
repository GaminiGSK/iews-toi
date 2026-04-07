import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Save, AlertCircle, ArrowLeft, Building2, TrendingUp, Landmark, Settings2, CheckCircle2, Trash2 } from 'lucide-react';

const RATE_TYPES = [
    { key: 'BE', label: 'BE — Bank Exchange',     icon: Building2,  color: 'blue',   desc: 'Official bank buying/selling rate' },
    { key: 'ME', label: 'ME — Market Exchange',   icon: TrendingUp, color: 'emerald',desc: 'Open market / parallel rate'       },
    { key: 'GE', label: 'GE — GDT Exchange',      icon: Landmark,   color: 'indigo', desc: 'GDT official rate for tax filing'  },
    { key: 'IE', label: 'IE — Internal Exchange', icon: Settings2,  color: 'amber',  desc: 'Company internal rate for reporting'},
];

const COLOR = {
    blue:    { ring: 'focus:ring-blue-500',   badge: 'bg-blue-50 text-blue-700 border border-blue-200',   icon: 'text-blue-500'   },
    emerald: { ring: 'focus:ring-emerald-500',badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: 'text-emerald-500'},
    indigo:  { ring: 'focus:ring-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200',  icon: 'text-indigo-500' },
    amber:   { ring: 'focus:ring-amber-500',  badge: 'bg-amber-50 text-amber-700 border border-amber-200',   icon: 'text-amber-500'  },
};

const fmt = (n) => n ? Number(n).toLocaleString() : '—';

const CurrencyExchange = ({ onBack }) => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [year, setYear] = useState(new Date().getFullYear());
    const [form, setForm] = useState({ BE: '', ME: '', GE: '', IE: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchRates(); }, []);

    // Pre-fill form when year changes (load existing)
    useEffect(() => {
        const existing = rates.find(r => r.year === parseInt(year));
        if (existing) {
            setForm({
                BE: existing.BE || '',
                ME: existing.ME || '',
                GE: existing.GE || '',
                IE: existing.IE || '',
            });
        } else {
            setForm({ BE: '', ME: '', GE: '', IE: '' });
        }
    }, [year, rates]);

    const fetchRates = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/rates', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRates(res.data.rates || []);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) { localStorage.removeItem('token'); window.location.reload(); }
        } finally { setLoading(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const hasValue = Object.values(form).some(v => v !== '');
        if (!hasValue) { setError('Please enter at least one rate.'); return; }

        setSaving(true); setError(null); setSuccess(false);
        try {
            const token = localStorage.getItem('token');
            const payload = { year: parseInt(year) };
            RATE_TYPES.forEach(({ key }) => { if (form[key] !== '') payload[key] = parseFloat(form[key]); });

            const res = await axios.post('/api/company/rates', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRates(prev => {
                const filtered = prev.filter(r => r.year !== parseInt(year));
                return [res.data.rate, ...filtered].sort((a, b) => b.year - a.year);
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error saving rates');
        } finally { setSaving(false); }
    };

    const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center gap-6 sticky top-0 z-20 shadow-sm">
                <button onClick={onBack} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition shadow-md">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-teal-600 flex items-center gap-2">
                        <DollarSign className="w-6 h-6" /> Currency Exchange Rates
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Define 4 rate types per year — BE · ME · GE · IE</p>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-auto">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* ── Input Form ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden">
                        <div className="bg-teal-600 px-6 py-4 flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-white" />
                            <h3 className="font-bold text-white text-base">Add / Update Rates for Year</h3>
                        </div>
                        <form onSubmit={handleSave} className="p-6">
                            {/* Year selector */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest uppercase">Tax Year</label>
                                <select
                                    value={year}
                                    onChange={e => setYear(e.target.value)}
                                    className="border border-gray-300 rounded-xl px-4 py-3 w-48 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none bg-white shadow-sm"
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            {/* 4 Rate inputs in a grid */}
                            <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                {RATE_TYPES.map(({ key, label, icon: Icon, color, desc }) => (
                                    <div key={key} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">
                                            <Icon className={`w-4 h-4 ${COLOR[color].icon}`} />
                                            {label}
                                        </label>
                                        <p className="text-xs text-gray-400 mb-2">{desc}</p>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={form[key]}
                                                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                                                placeholder="e.g. 4100"
                                                className={`border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 ${COLOR[color].ring} outline-none pr-14`}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">KHR</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-2 text-teal-700 text-sm mb-4 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Rates for {year} saved successfully!
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-xl font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition"
                            >
                                <Save className="w-4 h-4" /> {saving ? 'Saving...' : `Save Rates for ${year}`}
                            </button>

                            <p className="text-xs text-gray-400 mt-4 text-center">
                                GDT Exchange (GE) rate is used as the primary rate for Tax reporting and the Trial Balance KHR conversion.
                            </p>
                        </form>
                    </div>

                    {/* ── Year Tablets ── */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Saved Exchange Rates by Year</h3>
                        {loading ? (
                            <div className="text-center text-gray-400 py-12">Loading...</div>
                        ) : rates.length === 0 ? (
                            <div className="text-center text-gray-400 py-12 bg-white rounded-2xl border border-gray-200">
                                No rates defined yet. Add rates above.
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {rates.map(r => (
                                    <div
                                        key={r._id}
                                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => setYear(r.year)}
                                    >
                                        {/* Year badge */}
                                        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-5 py-3 flex items-center justify-between">
                                            <span className="text-white font-bold text-lg">{r.year}</span>
                                            <span className="text-teal-100 text-xs">KHR / USD</span>
                                        </div>
                                        {/* 4 rate rows */}
                                        <div className="divide-y divide-gray-100">
                                            {RATE_TYPES.map(({ key, label, icon: Icon, color }) => (
                                                <div key={key} className="px-5 py-2.5 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`w-3.5 h-3.5 ${COLOR[color].icon}`} />
                                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${COLOR[color].badge}`}>{key}</span>
                                                        <span className="text-xs text-gray-500">{label.split('—')[1]?.trim()}</span>
                                                    </div>
                                                    <span className={`font-mono font-bold text-sm ${r[key] ? COLOR[color].icon : 'text-gray-300'}`}>
                                                        {r[key] ? fmt(r[key]) : '—'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Primary rate */}
                                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Primary (GE→BE→ME→IE)</span>
                                            <span className="font-mono font-bold text-teal-600 text-sm">
                                                {fmt(r.GE || r.BE || r.ME || r.IE || r.rate)} KHR
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CurrencyExchange;
