import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Save, Upload, CheckCircle, AlertCircle, Loader2, FileText, Calculator } from 'lucide-react';

const GDT_RATES = { Building: 5, Furniture: 10, Computer: 25, Vehicle: 20, Other: 20 };
const GDT_POOLS = { Building: 'Pool 1 (5%)', Furniture: 'Pool 2 (10%)', Computer: 'Pool 3 (25%)', Vehicle: 'Pool 4 (20%)', Other: 'Pool 5 (20%)' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const EMPTY_ASSET = { description:'', category:'Furniture', purchaseDate:'', cost:'', accDepOpening:'', additions:'', disposals:'', invoiceRef:'', notes:'' };

function calcAsset(a) {
    const rate = GDT_RATES[a.category] || 10;
    const cost = parseFloat(a.cost) || 0;
    const open = parseFloat(a.accDepOpening) || 0;
    const add  = parseFloat(a.additions) || 0;
    const disp = parseFloat(a.disposals) || 0;
    const base  = cost + add - disp;
    const dep   = parseFloat((base * rate / 100).toFixed(2));
    const nbv   = parseFloat((base - open - dep).toFixed(2));
    return { rate, dep, nbv, base };
}

function fmtN(n) { return (parseFloat(n)||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }

export default function AssetDepreciation({ onBack }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [msg, setMsg]         = useState('');
    const [msgType, setMsgType] = useState('ok');
    const fileInputRef          = useRef(null);

    // Form state
    const [hasAssets, setHasAssets]     = useState('yes');
    const [depMethod, setDepMethod]     = useState('GDT Pooling');
    const [isFirstYear, setIsFirstYear] = useState('no');
    const [assets, setAssets]           = useState([{ ...EMPTY_ASSET }]);
    const [uploads, setUploads]         = useState([]);

    // Load existing data
    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get('/api/company/toi/assets', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                if (r.data.data) {
                    const d = r.data.data;
                    setHasAssets(d.hasAssets || 'yes');
                    setDepMethod(d.depMethod || 'GDT Pooling');
                    setIsFirstYear(d.isFirstYear || 'no');
                    setAssets(d.assets?.length ? d.assets : [{ ...EMPTY_ASSET }]);
                    setUploads(d.uploads || []);
                }
            })
            .catch(e => console.error('Load assets error', e))
            .finally(() => setLoading(false));
    }, []);

    const updateAsset = (i, field, val) => {
        setAssets(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
    };
    const addAsset = () => setAssets(prev => [...prev, { ...EMPTY_ASSET }]);
    const removeAsset = (i) => setAssets(prev => prev.filter((_, idx) => idx !== i));

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setUploads(prev => [...prev, {
                    label: file.name,
                    fileName: file.name,
                    mimeType: file.type,
                    data: ev.target.result,
                    uploadedAt: new Date().toISOString()
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/toi/assets', { hasAssets, depMethod, isFirstYear, assets, uploads }, { headers: { Authorization: `Bearer ${token}` } });
            setMsg('Asset register saved successfully'); setMsgType('ok');
        } catch (err) {
            setMsg(err.response?.data?.message || 'Save failed'); setMsgType('err');
        } finally {
            setSaving(false);
            setTimeout(() => setMsg(''), 4000);
        }
    };

    // Totals
    const totals = assets.reduce((acc, a) => {
        const c = calcAsset(a);
        return {
            cost: acc.cost + (parseFloat(a.cost)||0),
            open: acc.open + (parseFloat(a.accDepOpening)||0),
            add:  acc.add  + (parseFloat(a.additions)||0),
            disp: acc.disp + (parseFloat(a.disposals)||0),
            dep:  acc.dep  + c.dep,
            nbv:  acc.nbv  + c.nbv,
        };
    }, { cost:0, open:0, add:0, disp:0, dep:0, nbv:0 });

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <Loader2 className="animate-spin text-yellow-400" size={40} />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            {/* Header */}
            <div className="bg-slate-900/90 border-b border-white/10 px-6 py-4 flex items-center gap-4 sticky top-0 z-30 backdrop-blur">
                <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition"><ArrowLeft size={18} /></button>
                <div>
                    <h1 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="text-yellow-400">📦</span> Asset & Depreciation Register
                    </h1>
                    <p className="text-[11px] text-slate-500">Fixed Assets · GDT Tax Pooling · Year Ended 31 Dec 2025</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs font-bold transition">
                        <Upload size={14} /> Upload Invoice
                    </button>
                    <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx" className="hidden" onChange={handleFileUpload} />
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-xs font-black transition disabled:opacity-60">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Register
                    </button>
                </div>
            </div>

            {msg && (
                <div className={`mx-6 mt-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold ${msgType === 'ok' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {msgType === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {msg}
                </div>
            )}

            <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
                {/* SECTION A — Setup */}
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-5">Section A — General Setup</h2>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2">Does the company own fixed assets?</label>
                            <div className="flex gap-3">
                                {['yes','no'].map(v => (
                                    <button key={v} onClick={() => setHasAssets(v)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${hasAssets===v ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-yellow-500'}`}>
                                        {v === 'yes' ? '✅ Yes' : '❌ No'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2">Depreciation Method</label>
                            <select value={depMethod} onChange={e => setDepMethod(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-yellow-400">
                                <option>GDT Pooling</option>
                                <option>Straight-Line</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2">Is this the first year of operations?</label>
                            <div className="flex gap-3">
                                {['yes','no'].map(v => (
                                    <button key={v} onClick={() => setIsFirstYear(v)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${isFirstYear===v ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-yellow-500'}`}>
                                        {v === 'yes' ? 'Yes' : 'No'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* GDT rate reference */}
                    <div className="mt-5 flex gap-2 flex-wrap">
                        {Object.entries(GDT_POOLS).map(([k,v]) => (
                            <span key={k} className="px-3 py-1 bg-slate-700/60 border border-slate-600 rounded-full text-[10px] font-bold text-slate-300">
                                {k}: <span className="text-yellow-400">{v}</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* SECTION B — Asset Table */}
                {hasAssets === 'yes' && (
                    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">Section B — Asset Register</h2>
                            <button onClick={addAsset} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-lg text-xs font-bold transition">
                                <Plus size={14} /> Add Asset
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        {['Description','Category (GDT)','Purchase Date','Cost (USD)','Acc Dep Opening','Additions','Disposals','Rate %','Dep This Year','Net Book Value','Invoice Ref',''].map(h => (
                                            <th key={h} className="text-left px-2 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {assets.map((a, i) => {
                                        const c = calcAsset(a);
                                        return (
                                            <tr key={i} className="group hover:bg-white/5 transition">
                                                <td className="px-2 py-2">
                                                    <input value={a.description} onChange={e => updateAsset(i,'description',e.target.value)} placeholder="e.g. Toyota Camry" className="w-36 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-yellow-400 text-xs" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <select value={a.category} onChange={e => updateAsset(i,'category',e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-yellow-400 text-xs">
                                                        {Object.keys(GDT_RATES).map(k => <option key={k}>{k}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="date" value={a.purchaseDate} onChange={e => updateAsset(i,'purchaseDate',e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-yellow-400 text-xs" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" value={a.cost} onChange={e => updateAsset(i,'cost',e.target.value)} placeholder="0.00" className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-yellow-400 text-xs text-right" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" value={a.accDepOpening} onChange={e => updateAsset(i,'accDepOpening',e.target.value)} placeholder="0.00" className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-yellow-400 text-xs text-right" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" value={a.additions} onChange={e => updateAsset(i,'additions',e.target.value)} placeholder="0.00" className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-yellow-400 text-xs text-right" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" value={a.disposals} onChange={e => updateAsset(i,'disposals',e.target.value)} placeholder="0.00" className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-yellow-400 text-xs text-right" />
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded font-bold">{c.rate}%</span>
                                                </td>
                                                <td className="px-2 py-2 text-right">
                                                    <span className="font-bold text-orange-400">{fmtN(c.dep)}</span>
                                                </td>
                                                <td className="px-2 py-2 text-right">
                                                    <span className={`font-bold ${c.nbv < 0 ? 'text-red-400' : 'text-green-400'}`}>{fmtN(c.nbv)}</span>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input value={a.invoiceRef} onChange={e => updateAsset(i,'invoiceRef',e.target.value)} placeholder="INV-001" className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-yellow-400 text-xs" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <button onClick={() => removeAsset(i)} className="text-slate-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* Totals */}
                                <tfoot>
                                    <tr className="border-t-2 border-yellow-500/40 bg-slate-800/80">
                                        <td colSpan={3} className="px-2 py-3 font-black text-xs text-yellow-400 uppercase tracking-widest">TOTALS</td>
                                        <td className="px-2 py-3 text-right font-black text-white text-xs">{fmtN(totals.cost)}</td>
                                        <td className="px-2 py-3 text-right font-black text-white text-xs">{fmtN(totals.open)}</td>
                                        <td className="px-2 py-3 text-right font-black text-white text-xs">{fmtN(totals.add)}</td>
                                        <td className="px-2 py-3 text-right font-black text-white text-xs">{fmtN(totals.disp)}</td>
                                        <td></td>
                                        <td className="px-2 py-3 text-right font-black text-orange-400 text-xs">{fmtN(totals.dep)}</td>
                                        <td className="px-2 py-3 text-right font-black text-green-400 text-xs">{fmtN(totals.nbv)}</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* SECTION C — Reconciliation vs AJ-03 */}
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-5">
                        <Calculator size={14} className="inline mr-2" />Section C — Reconciliation vs GL (AJ-03)
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-700/50 border border-white/10 rounded-xl p-4">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total Dep (This Register)</p>
                            <p className="text-2xl font-black text-orange-400">${fmtN(totals.dep)}</p>
                        </div>
                        <div className="bg-slate-700/50 border border-white/10 rounded-xl p-4">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">GL Posted (AJ-03)</p>
                            <p className="text-2xl font-black text-blue-400">$11,483.50</p>
                        </div>
                        <div className={`border rounded-xl p-4 ${Math.abs(totals.dep - 11483.50) < 0.01 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <p className="text-[10px] uppercase font-bold mb-1 text-slate-400">Variance</p>
                            <p className={`text-2xl font-black ${Math.abs(totals.dep - 11483.50) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                                {Math.abs(totals.dep - 11483.50) < 0.01 ? '✅ Matched' : `$${fmtN(Math.abs(totals.dep - 11483.50))} Gap`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* SECTION D — Uploads */}
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-5">
                        <FileText size={14} className="inline mr-2" />Section D — Document Uploads
                    </h2>
                    <div className="mb-4 grid grid-cols-3 gap-3 text-[11px] text-slate-400">
                        {[
                            { label: 'Purchase Invoices (per asset)', hint: 'PDF or image per asset' },
                            { label: 'Existing Asset Register', hint: 'Excel or PDF optional' },
                            { label: 'Prior Year Tax Return', hint: 'For opening pool balance' },
                        ].map((d, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 bg-slate-700/30 border border-dashed border-slate-600 rounded-xl">
                                <FileText size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                                <div><p className="font-bold text-white text-xs">{d.label}</p><p className="text-[10px]">{d.hint}</p></div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-dashed border-yellow-500/40 text-yellow-400 rounded-xl text-xs font-bold hover:bg-yellow-500/10 transition">
                        <Upload size={14} /> Click to upload files (PDF, JPG, PNG, Excel)
                    </button>
                    {uploads.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {uploads.map((u, i) => (
                                <div key={i} className="flex items-center gap-3 bg-slate-700/50 px-3 py-2 rounded-lg">
                                    <FileText size={14} className="text-yellow-400" />
                                    <span className="text-xs text-white">{u.fileName}</span>
                                    <button onClick={() => setUploads(prev => prev.filter((_,idx)=>idx!==i))} className="ml-auto text-slate-500 hover:text-red-400"><Trash2 size={12}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
