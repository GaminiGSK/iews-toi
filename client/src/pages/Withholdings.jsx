import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Save, CheckCircle, AlertCircle, Loader2, Info, Building2, Truck, Wrench, Receipt } from 'lucide-react';

const fmtN = (n) => (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct  = (amt, rate) => parseFloat(((parseFloat(amt) || 0) * (rate / 100)).toFixed(2));

const NI = 'bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs w-full';

const EMPTY_RENTAL  = { description: '', landlordName: '', leasePeriod: '', annualAmount: '', invoiceRef: '', notes: '' };
const EMPTY_SERVICE = { description: '', providerName: '', serviceType: '', leasePeriod: '', annualAmount: '', invoiceRef: '', notes: '' };

const SERVICE_TYPES = ['Car Maintenance', 'Building Maintenance', 'IT Services & Support', 'Security Services', 'Cleaning Services', 'Professional Services', 'Management Fees', 'Other'];

// ── Rental Row ──────────────────────────────────────────────────────────────
function RentalRow({ item, idx, onUpdate, onRemove, color }) {
    const wht = pct(item.annualAmount, 10);
    const net = (parseFloat(item.annualAmount) || 0) - wht;
    return (
        <tr className="group hover:bg-white/5 transition border-b border-white/5">
            <td className="px-2 py-2"><input value={item.description}  onChange={e => onUpdate(idx, 'description',  e.target.value)} placeholder="e.g. Main Office 2nd Floor" className={NI} /></td>
            <td className="px-2 py-2"><input value={item.landlordName} onChange={e => onUpdate(idx, 'landlordName', e.target.value)} placeholder="Landlord / Owner name"      className={NI} /></td>
            <td className="px-2 py-2"><input value={item.leasePeriod}  onChange={e => onUpdate(idx, 'leasePeriod',  e.target.value)} placeholder="Jan–Dec 2025"              className={NI} /></td>
            <td className="px-2 py-2"><input type="number" value={item.annualAmount} onChange={e => onUpdate(idx, 'annualAmount', e.target.value)} placeholder="0.00" className={`${NI} text-right`} /></td>
            <td className="px-2 py-2 text-center"><span className={`px-2 py-0.5 rounded font-black text-xs ${color.badge}`}>10%</span></td>
            <td className="px-2 py-2 text-right text-xs font-bold text-orange-400">{fmtN(wht)}</td>
            <td className="px-2 py-2 text-right text-xs font-bold text-green-400">{fmtN(net)}</td>
            <td className="px-2 py-2"><input value={item.invoiceRef} onChange={e => onUpdate(idx, 'invoiceRef', e.target.value)} placeholder="INV-001" className={`${NI} w-20`} /></td>
            <td className="px-2 py-2">
                <button onClick={() => onRemove(idx)} className="text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
            </td>
        </tr>
    );
}

// ── Service Row ─────────────────────────────────────────────────────────────
function ServiceRow({ item, idx, onUpdate, onRemove }) {
    const vat   = pct(item.annualAmount, 15);
    const total = (parseFloat(item.annualAmount) || 0) + vat;
    return (
        <tr className="group hover:bg-white/5 transition border-b border-white/5">
            <td className="px-2 py-2"><input value={item.description}  onChange={e => onUpdate(idx, 'description',  e.target.value)} placeholder="e.g. Monthly AC Maintenance" className={NI} /></td>
            <td className="px-2 py-2"><input value={item.providerName} onChange={e => onUpdate(idx, 'providerName', e.target.value)} placeholder="Provider / Company name"      className={NI} /></td>
            <td className="px-2 py-2">
                <select value={item.serviceType} onChange={e => onUpdate(idx, 'serviceType', e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs w-full">
                    <option value="">Select type…</option>
                    {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
            </td>
            <td className="px-2 py-2"><input value={item.leasePeriod}  onChange={e => onUpdate(idx, 'leasePeriod',  e.target.value)} placeholder="Jan–Dec 2025" className={NI} /></td>
            <td className="px-2 py-2"><input type="number" value={item.annualAmount} onChange={e => onUpdate(idx, 'annualAmount', e.target.value)} placeholder="0.00" className={`${NI} text-right`} /></td>
            <td className="px-2 py-2 text-center"><span className="px-2 py-0.5 rounded font-black text-xs bg-blue-500/20 text-blue-400">15%</span></td>
            <td className="px-2 py-2 text-right text-xs font-bold text-blue-400">{fmtN(vat)}</td>
            <td className="px-2 py-2 text-right text-xs font-bold text-slate-200">{fmtN(total)}</td>
            <td className="px-2 py-2"><input value={item.invoiceRef}   onChange={e => onUpdate(idx, 'invoiceRef',   e.target.value)} placeholder="INV-001" className={`${NI} w-20`} /></td>
            <td className="px-2 py-2">
                <button onClick={() => onRemove(idx)} className="text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
            </td>
        </tr>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function Withholdings({ onBack }) {
    const [loading,  setLoading]  = useState(true);
    const [saving,   setSaving]   = useState(false);
    const [msg,      setMsg]      = useState('');
    const [msgType,  setMsgType]  = useState('ok');

    const [hasRentals,       setHasRentals]       = useState('no');
    const [hasServices,      setHasServices]      = useState('no');
    const [immovableRentals, setImmovableRentals] = useState([{ ...EMPTY_RENTAL }]);
    const [movableRentals,   setMovableRentals]   = useState([{ ...EMPTY_RENTAL }]);
    const [serviceContracts, setServiceContracts] = useState([{ ...EMPTY_SERVICE }]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get('/api/company/toi/withholdings', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                if (r.data.data) {
                    const d = r.data.data;
                    setHasRentals(d.hasRentals || 'no');
                    setHasServices(d.hasServices || 'no');
                    setImmovableRentals(d.immovableRentals?.length ? d.immovableRentals : [{ ...EMPTY_RENTAL }]);
                    setMovableRentals(d.movableRentals?.length   ? d.movableRentals   : [{ ...EMPTY_RENTAL }]);
                    setServiceContracts(d.serviceContracts?.length ? d.serviceContracts : [{ ...EMPTY_SERVICE }]);
                }
            })
            .catch(e => console.error('Load withholdings error', e))
            .finally(() => setLoading(false));
    }, []);

    const updR = (_list, setList) => (idx, field, val) => setList(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
    const addR = (_list, setList, empty) => () => setList(prev => [...prev, { ...empty }]);
    const remR = (_list, setList) => (idx) => setList(prev => prev.filter((_, i) => i !== idx));

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/toi/withholdings',
                { hasRentals, hasServices, immovableRentals, movableRentals, serviceContracts },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMsg('Withholdings register saved successfully'); setMsgType('ok');
        } catch (err) {
            setMsg(err.response?.data?.message || 'Save failed'); setMsgType('err');
        } finally {
            setSaving(false);
            setTimeout(() => setMsg(''), 4000);
        }
    };

    // ── Totals ────────────────────────────────────────────────────────────
    const sumAmt = (arr) => arr.reduce((s, it) => s + (parseFloat(it.annualAmount) || 0), 0);
    const totalImmoRent = sumAmt(immovableRentals);
    const totalMovRent  = sumAmt(movableRentals);
    const totalAllRent  = totalImmoRent + totalMovRent;
    const totalWHT      = totalAllRent * 0.10;
    const totalNetRent  = totalAllRent - totalWHT;
    const totalSvcNet   = sumAmt(serviceContracts);
    const totalVAT      = totalSvcNet * 0.15;

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-purple-400" size={40}/></div>;

    const IMMO_COLOR = { badge: 'bg-orange-500/20 text-orange-400', border: 'border-orange-500/30', text: 'text-orange-400' };
    const MOV_COLOR  = { badge: 'bg-yellow-500/20 text-yellow-400',  border: 'border-yellow-500/30',  text: 'text-yellow-400'  };

    const RentalTable = ({ sectionLabel, title, icon: Icon, items, onUpdate, onRemove, onAdd, color, desc }) => (
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.badge}`}>
                        <Icon size={18} className={color.text} />
                    </div>
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-white">{sectionLabel} — {title}</h2>
                        <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
                    </div>
                </div>
                <button onClick={onAdd} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${color.badge} ${color.border} hover:brightness-125`}>
                    <Plus size={12}/> Add Item
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[850px]">
                    <thead>
                        <tr className="border-b border-white/10">
                            {['Description', 'Landlord / Owner', 'Lease Period', 'Gross Amount (USD)', 'WHT', 'WHT Amount (10%)', 'Net to Landlord', 'Invoice Ref', ''].map(h => (
                                <th key={h} className="text-left px-2 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, i) => <RentalRow key={i} item={it} idx={i} onUpdate={onUpdate} onRemove={onRemove} color={color} />)}
                    </tbody>
                    <tfoot>
                        <tr className={`border-t-2 ${color.border} bg-slate-800/80`}>
                            <td colSpan={3} className={`px-2 py-2 font-black text-xs uppercase tracking-widest ${color.text}`}>TOTALS</td>
                            <td className="px-2 py-2 text-right font-black text-white text-xs">${fmtN(sumAmt(items))}</td>
                            <td></td>
                            <td className="px-2 py-2 text-right font-black text-orange-400 text-xs">${fmtN(pct(sumAmt(items), 10))}</td>
                            <td className="px-2 py-2 text-right font-black text-green-400 text-xs">${fmtN(sumAmt(items) - pct(sumAmt(items), 10))}</td>
                            <td colSpan={2}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="bg-slate-900/90 border-b border-white/10 px-6 py-4 flex items-center gap-4 sticky top-0 z-30 backdrop-blur">
                <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition"><ArrowLeft size={18}/></button>
                <div>
                    <h1 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="text-purple-400">🏷️</span> Withholdings Register
                    </h1>
                    <p className="text-[11px] text-slate-500">Rental WHT (10%) · Service VAT (15%) · Year Ended 31 Dec 2025</p>
                </div>
                <div className="ml-auto">
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-black transition disabled:opacity-60">
                        {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Register
                    </button>
                </div>
            </div>

            {msg && (
                <div className={`mx-6 mt-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold ${msgType === 'ok' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {msgType === 'ok' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>} {msg}
                </div>
            )}

            <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

                {/* ── SECTION A: General Setup ──────────────────────────── */}
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-5">Section A — General Setup</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2">Does the company rent assets? (Office, equipment, vehicles)</label>
                            <div className="flex gap-3">
                                {['yes','no'].map(v => (
                                    <button key={v} onClick={() => setHasRentals(v)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${hasRentals === v ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-purple-500'}`}>
                                        {v === 'yes' ? '✅ Yes' : '❌ No'}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">10% Withholding Tax applies on all rental payments (movable &amp; immovable assets)</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2">Does the company pay for maintenance or external services?</label>
                            <div className="flex gap-3">
                                {['yes','no'].map(v => (
                                    <button key={v} onClick={() => setHasServices(v)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${hasServices === v ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-blue-500'}`}>
                                        {v === 'yes' ? '✅ Yes' : '❌ No'}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">15% VAT charged by service providers — recoverable as Input VAT if VAT-registered</p>
                        </div>
                    </div>
                </div>

                {/* ── SECTION B: Immovable Asset Rentals ───────────────── */}
                {hasRentals === 'yes' && (
                    <RentalTable
                        sectionLabel="Section B"
                        title="Immovable Asset Rentals"
                        icon={Building2}
                        desc="Office space, warehouses, land, buildings — 10% WHT withheld & remitted to GDT monthly"
                        items={immovableRentals}
                        onUpdate={updR(immovableRentals, setImmovableRentals)}
                        onRemove={remR(immovableRentals, setImmovableRentals)}
                        onAdd={addR(immovableRentals, setImmovableRentals, EMPTY_RENTAL)}
                        color={IMMO_COLOR}
                    />
                )}

                {/* ── SECTION C: Movable Asset Rentals ─────────────────── */}
                {hasRentals === 'yes' && (
                    <RentalTable
                        sectionLabel="Section C"
                        title="Movable Asset Rentals"
                        icon={Truck}
                        desc="Equipment, vehicles, generators, machinery — 10% WHT withheld & remitted to GDT monthly"
                        items={movableRentals}
                        onUpdate={updR(movableRentals, setMovableRentals)}
                        onRemove={remR(movableRentals, setMovableRentals)}
                        onAdd={addR(movableRentals, setMovableRentals, EMPTY_RENTAL)}
                        color={MOV_COLOR}
                    />
                )}

                {/* Service Contracts (VAT) — only shown if hasServices */}
                {hasServices === 'yes' && (
                    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/20">
                                    <Wrench size={18} className="text-blue-400"/>
                                </div>
                                <div>
                                    <h2 className="text-xs font-black uppercase tracking-widest text-white">Service Contracts (VAT 15%)</h2>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Maintenance, repairs, management — 15% VAT added by the service provider on their invoice</p>
                                </div>
                            </div>
                            <button onClick={addR(serviceContracts, setServiceContracts, EMPTY_SERVICE)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition border bg-blue-500/20 border-blue-500/30 text-blue-400 hover:brightness-125">
                                <Plus size={12}/> Add Service
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[1000px]">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        {['Description', 'Provider Name', 'Service Type', 'Period', 'Net Amount (USD)', 'VAT', 'VAT Amount (15%)', 'Total Paid', 'Invoice Ref', ''].map(h => (
                                            <th key={h} className="text-left px-2 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {serviceContracts.map((it, i) => (
                                        <ServiceRow key={i} item={it} idx={i}
                                            onUpdate={updR(serviceContracts, setServiceContracts)}
                                            onRemove={remR(serviceContracts, setServiceContracts)}
                                        />
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-blue-500/30 bg-slate-800/80">
                                        <td colSpan={4} className="px-2 py-2 font-black text-xs uppercase tracking-widest text-blue-400">TOTALS</td>
                                        <td className="px-2 py-2 text-right font-black text-white text-xs">${fmtN(totalSvcNet)}</td>
                                        <td></td>
                                        <td className="px-2 py-2 text-right font-black text-blue-400 text-xs">${fmtN(totalVAT)}</td>
                                        <td className="px-2 py-2 text-right font-black text-slate-200 text-xs">${fmtN(totalSvcNet + totalVAT)}</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── SECTION D: Withholding Summary & TOI Impact ───────── */}
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Receipt size={16} className="text-purple-400"/>
                        <h2 className="text-xs font-black uppercase tracking-widest text-purple-400">Section D — Withholding Tax Summary & TOI Mapping</h2>
                    </div>

                    {/* Summary KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                            <p className="text-[10px] text-orange-300 font-black uppercase tracking-widest mb-1">Gross Rent Expense (B27)</p>
                            <p className="text-2xl font-black text-white">${fmtN(totalAllRent)}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Total rental expense → Income Statement B27</p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <p className="text-[10px] text-red-300 font-black uppercase tracking-widest mb-1">WHT Withheld (10%)</p>
                            <p className="text-2xl font-black text-orange-400">${fmtN(totalWHT)}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Remit to GDT monthly via IEWS WHT return</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest mb-1">Input VAT (15%)</p>
                            <p className="text-2xl font-black text-blue-400">${fmtN(totalVAT)}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Claimable against Output VAT (if VAT registered)</p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                            <p className="text-[10px] text-green-300 font-black uppercase tracking-widest mb-1">Net Paid to Landlords</p>
                            <p className="text-2xl font-black text-green-400">${fmtN(totalNetRent)}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Cash out after 10% WHT deducted at source</p>
                        </div>
                    </div>

                    {/* TOI Form Mapping */}
                    <div className="overflow-x-auto mb-5">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {['TOI Line Item', 'GDT Reference', 'Amount (USD)', 'Where to Enter'].map(h => (
                                        <th key={h} className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr className="hover:bg-white/5">
                                    <td className="px-3 py-2.5 font-bold text-white">Rental of Immovable Property</td>
                                    <td className="px-3 py-2.5"><span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded font-black">B27</span></td>
                                    <td className="px-3 py-2.5 font-bold text-orange-400">${fmtN(totalImmoRent)}</td>
                                    <td className="px-3 py-2.5 text-slate-400">Step 5 Income Statement → B27 "Rental of Immovable Property"</td>
                                </tr>
                                <tr className="hover:bg-white/5">
                                    <td className="px-3 py-2.5 font-bold text-white">Rental of Movable Property</td>
                                    <td className="px-3 py-2.5"><span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-black">B27</span></td>
                                    <td className="px-3 py-2.5 font-bold text-yellow-400">${fmtN(totalMovRent)}</td>
                                    <td className="px-3 py-2.5 text-slate-400">Step 5 Income Statement → B27 "Rental of Movable Property"</td>
                                </tr>
                                <tr className="hover:bg-white/5">
                                    <td className="px-3 py-2.5 font-bold text-white">WHT Withheld (10%)</td>
                                    <td className="px-3 py-2.5"><span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded font-black">IEWS</span></td>
                                    <td className="px-3 py-2.5 font-bold text-red-400">${fmtN(totalWHT)}</td>
                                    <td className="px-3 py-2.5 text-slate-400">Monthly WHT return (IEWS module). GDT cross-checks vs B27 annual total.</td>
                                </tr>
                                <tr className="hover:bg-white/5">
                                    <td className="px-3 py-2.5 font-bold text-white">Service Expenses (Net)</td>
                                    <td className="px-3 py-2.5"><span className="px-2 py-0.5 bg-slate-500/30 text-slate-300 rounded font-black">B33–B41</span></td>
                                    <td className="px-3 py-2.5 font-bold text-slate-200">${fmtN(totalSvcNet)}</td>
                                    <td className="px-3 py-2.5 text-slate-400">Step 5 → appropriate expense row (B33 Repairs, B41 Other) by service type</td>
                                </tr>
                                <tr className="hover:bg-white/5">
                                    <td className="px-3 py-2.5 font-bold text-white">Input VAT (15%)</td>
                                    <td className="px-3 py-2.5"><span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded font-black">VAT</span></td>
                                    <td className="px-3 py-2.5 font-bold text-blue-400">${fmtN(totalVAT)}</td>
                                    <td className="px-3 py-2.5 text-slate-400">VAT monthly return — credit against output VAT. If not VAT-reg → add to expense.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Cambodia Law Note */}
                    <div className="bg-slate-700/40 border border-white/5 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                            <Info size={14} className="text-purple-400 shrink-0 mt-0.5"/>
                            <div className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
                                <p><span className="text-white font-bold">10% WHT on Rentals:</span> When paying rent, company withholds 10% and pays landlord only 90%. The 10% is remitted to GDT monthly via IEWS. Full gross rent is deductible (B27 in TOI). GDT cross-checks B27 annual total vs monthly WHT filings — discrepancies trigger audits.</p>
                                <p><span className="text-white font-bold">15% VAT on Services:</span> Service providers add 15% VAT on their invoices. If VAT-registered, this is claimable Input VAT. If not VAT-registered, the 15% becomes part of the expense cost.</p>
                                <p className="text-yellow-400/80"><span className="font-bold">⚠️ IEWS Integration:</span> Monthly WHT remittance for each rental will be tracked in the IEWS module (coming soon). This register feeds directly into the TOI auto-fill at filing time.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
