import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Save, Upload, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const EMPTY_EMP = { position:'', count:'', annualSalary:'', fringeBenefits:'' };
const EMPTY_MONTH = (m) => ({ month: m, grossSalary:'', tosFiled:'', tosPaid:'' });
function fmtN(n) { return (parseFloat(n)||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }

// ⚠️ CRITICAL: EmpTable MUST be defined outside SalaryTOSRecon to prevent
// remount-on-keystroke (which caused focus loss after typing 1 character)
function EmpTable({ label, rows, setRows, color }) {
    const addEmp = () => setRows(prev => [...prev, { ...EMPTY_EMP }]);
    const remEmp = (i) => setRows(prev => prev.filter((_, idx) => idx !== i));
    const updEmp = (i, f, v) => setRows(prev => prev.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest" style={{ color }}>{label}</h3>
                <button onClick={addEmp} className="flex items-center gap-1 px-3 py-1 border border-dashed rounded-lg text-[10px] font-bold transition hover:opacity-80" style={{ borderColor: color, color }}>
                    <Plus size={12} /> Add Row
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/10">
                            {['Position / Title', 'No. of Persons', 'Annual Salary (USD)', 'Fringe Benefits (USD)', ''].map(h => (
                                <th key={h} className="text-left px-2 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {rows.map((e, i) => (
                            <tr key={i} className="group hover:bg-white/5">
                                <td className="px-2 py-2">
                                    <input
                                        value={e.position}
                                        onChange={ev => updEmp(i, 'position', ev.target.value)}
                                        placeholder="Position"
                                        className="w-40 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-blue-400 text-xs"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="text" inputMode="decimal"
                                        value={e.count}
                                        onChange={ev => updEmp(i, 'count', ev.target.value)}
                                        placeholder="0"
                                        className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-blue-400 text-xs text-center"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="text" inputMode="decimal"
                                        value={e.annualSalary}
                                        onChange={ev => updEmp(i, 'annualSalary', ev.target.value)}
                                        placeholder="0.00"
                                        className="w-28 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-blue-400 text-xs text-right"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="text" inputMode="decimal"
                                        value={e.fringeBenefits}
                                        onChange={ev => updEmp(i, 'fringeBenefits', ev.target.value)}
                                        placeholder="0.00"
                                        className="w-28 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-blue-400 text-xs text-right"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <button onClick={() => remEmp(i)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                        <Trash2 size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t border-white/10 bg-slate-700/30">
                            <td className="px-2 py-2 font-black text-[10px] uppercase text-slate-400">Subtotal</td>
                            <td className="px-2 py-2 text-center font-black text-white text-xs">{rows.reduce((a, e) => a + (parseInt(e.count) || 0), 0)}</td>
                            <td className="px-2 py-2 text-right font-black text-white text-xs">{fmtN(rows.reduce((a, e) => a + (parseFloat(e.annualSalary) || 0), 0))}</td>
                            <td className="px-2 py-2 text-right font-black text-white text-xs">{fmtN(rows.reduce((a, e) => a + (parseFloat(e.fringeBenefits) || 0), 0))}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

// YN also moved outside to avoid recreation on each render
function YN({ val, set, label }) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">{label}</label>
            <div className="flex gap-3">
                {['yes', 'no'].map(v => (
                    <button key={v} onClick={() => set(v)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${val === v ? 'bg-blue-500 text-white border-blue-400' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-blue-500'}`}>
                        {v === 'yes' ? '✅ Yes' : '❌ No'}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function SalaryTOSRecon({ onBack }) {
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [msg, setMsg]           = useState('');
    const [msgType, setMsgType]   = useState('ok');
    const fileInputRef            = useRef(null);
    const [uploadMonth, setUploadMonth] = useState('');

    // Section A
    const [hasEmployees, setHasEmployees]       = useState('yes');
    const [tosFiledMonthly, setTosFiledMonthly] = useState('yes');
    const [hasNonResident, setHasNonResident]   = useState('no');
    const [hasFringe, setHasFringe]             = useState('no');
    const [directorSalary, setDirectorSalary]   = useState('no');
    // Section B
    const [shEmployees, setShEmployees]         = useState([{ ...EMPTY_EMP, position: 'Managing Director' }]);
    const [nonShEmployees, setNonShEmployees]   = useState([{ ...EMPTY_EMP, position: 'Staff' }]);
    // Section C
    const [monthlyTOS, setMonthlyTOS]           = useState(MONTHS.map(EMPTY_MONTH));
    // Uploads
    const [uploads, setUploads]                 = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get('/api/company/toi/salary', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                if (r.data.data) {
                    const d = r.data.data;
                    setHasEmployees(d.hasEmployees || 'yes');
                    setTosFiledMonthly(d.tosFiledMonthly || 'yes');
                    setHasNonResident(d.hasNonResident || 'no');
                    setHasFringe(d.hasFringe || 'no');
                    setDirectorSalary(d.directorSalary || 'no');
                    setShEmployees(d.shareholderEmployees?.length ? d.shareholderEmployees : [{ ...EMPTY_EMP, position: 'Managing Director' }]);
                    setNonShEmployees(d.nonShareholderEmployees?.length ? d.nonShareholderEmployees : [{ ...EMPTY_EMP, position: 'Staff' }]);
                    setMonthlyTOS(d.monthlyTOS?.length ? d.monthlyTOS : MONTHS.map(EMPTY_MONTH));
                    setUploads(d.uploads || []);
                }
            })
            .catch(e => console.error('Load salary error', e))
            .finally(() => setLoading(false));
    }, []);

    const updMonth = useCallback((i, f, v) => {
        setMonthlyTOS(prev => prev.map((m, idx) => idx === i ? { ...m, [f]: v } : m));
    }, []);

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setUploads(prev => [...prev, {
                    label: uploadMonth ? `TOS Return — ${uploadMonth}` : file.name,
                    month: uploadMonth || 'Annual',
                    fileName: file.name,
                    mimeType: file.type,
                    data: ev.target.result,
                    uploadedAt: new Date().toISOString()
                }]);
            };
            reader.readAsDataURL(file);
        });
        setUploadMonth('');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/toi/salary', {
                hasEmployees, tosFiledMonthly, hasNonResident, hasFringe, directorSalary,
                shareholderEmployees: shEmployees, nonShareholderEmployees: nonShEmployees,
                monthlyTOS, uploads
            }, { headers: { Authorization: `Bearer ${token}` } });
            setMsg('Salary & TOS data saved'); setMsgType('ok');
        } catch (err) {
            setMsg(err.response?.data?.message || 'Save failed'); setMsgType('err');
        } finally {
            setSaving(false);
            setTimeout(() => setMsg(''), 4000);
        }
    };

    // Totals
    const shTotal  = shEmployees.reduce((a, e) => ({ sal: a.sal + (parseFloat(e.annualSalary) || 0), fri: a.fri + (parseFloat(e.fringeBenefits) || 0), cnt: a.cnt + (parseInt(e.count) || 0) }), { sal: 0, fri: 0, cnt: 0 });
    const nonTotal = nonShEmployees.reduce((a, e) => ({ sal: a.sal + (parseFloat(e.annualSalary) || 0), fri: a.fri + (parseFloat(e.fringeBenefits) || 0), cnt: a.cnt + (parseInt(e.count) || 0) }), { sal: 0, fri: 0, cnt: 0 });
    const grandSal    = shTotal.sal + nonTotal.sal;
    const grandFri    = shTotal.fri + nonTotal.fri;
    const annualGross = monthlyTOS.reduce((a, m) => a + (parseFloat(m.grossSalary) || 0), 0);
    const annualFiled = monthlyTOS.reduce((a, m) => a + (parseFloat(m.tosFiled) || 0), 0);
    const annualPaid  = monthlyTOS.reduce((a, m) => a + (parseFloat(m.tosPaid) || 0), 0);
    const matched     = Math.abs(grandSal - annualGross) < 0.01;

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-blue-400" size={40} /></div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            {/* Header */}
            <div className="bg-slate-900/90 border-b border-white/10 px-6 py-4 flex items-center gap-4 sticky top-0 z-30 backdrop-blur">
                <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition"><ArrowLeft size={18} /></button>
                <div>
                    <h1 className="text-lg font-black uppercase tracking-widest flex items-center gap-2"><span className="text-blue-400">👥</span> Salary & TOS Reconciliation</h1>
                    <p className="text-[11px] text-slate-500">Tax on Salary · Employee Summary · Year Ended 31 Dec 2025</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-xs font-black transition disabled:opacity-60">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Data
                    </button>
                </div>
            </div>

            {msg && (
                <div className={`mx-6 mt-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold ${msgType === 'ok' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {msgType === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {msg}
                </div>
            )}

            <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
                {/* SECTION A */}
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-5">Section A — General Setup</h2>
                    <div className="grid grid-cols-5 gap-4">
                        <YN val={hasEmployees}    set={setHasEmployees}    label="Does the company have employees?" />
                        <YN val={tosFiledMonthly} set={setTosFiledMonthly} label="Were TOS returns filed each month?" />
                        <YN val={hasNonResident}  set={setHasNonResident}  label="Any non-resident / foreign employees?" />
                        <YN val={hasFringe}       set={setHasFringe}       label="Were fringe benefits provided?" />
                        <YN val={directorSalary}  set={setDirectorSalary}  label="Did any director/shareholder receive salary?" />
                    </div>
                </div>

                {hasEmployees === 'yes' && (<>
                    {/* SECTION B */}
                    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 space-y-6">
                        <h2 className="text-xs font-black uppercase tracking-widest text-blue-400">Section B — Employee Summary (feeds into TOI Page 2)</h2>
                        <EmpTable label="Shareholder / Director Employees" rows={shEmployees} setRows={setShEmployees} color="#f59e0b" />
                        <EmpTable label="Non-Shareholder Staff Employees"  rows={nonShEmployees} setRows={setNonShEmployees} color="#60a5fa" />
                        {/* Grand Total */}
                        <div className="grid grid-cols-4 gap-4 pt-2 border-t border-white/10">
                            <div className="bg-slate-700/50 rounded-xl p-4 text-center"><p className="text-[10px] text-slate-400 uppercase font-bold">Total Headcount</p><p className="text-2xl font-black text-white">{shTotal.cnt + nonTotal.cnt}</p></div>
                            <div className="bg-slate-700/50 rounded-xl p-4 text-center"><p className="text-[10px] text-slate-400 uppercase font-bold">Total Annual Salary</p><p className="text-xl font-black text-blue-400">${fmtN(grandSal)}</p></div>
                            <div className="bg-slate-700/50 rounded-xl p-4 text-center"><p className="text-[10px] text-slate-400 uppercase font-bold">Total Fringe Benefits</p><p className="text-xl font-black text-yellow-400">${fmtN(grandFri)}</p></div>
                            <div className={`rounded-xl p-4 text-center border ${matched ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <p className="text-[10px] uppercase font-bold text-slate-400">vs Monthly Total</p>
                                <p className={`text-xl font-black ${matched ? 'text-green-400' : 'text-red-400'}`}>{matched ? '✅ Matched' : `$${fmtN(Math.abs(grandSal - annualGross))} Gap`}</p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION C — Monthly TOS */}
                    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-5">Section C — Monthly TOS Reconciliation (Jan–Dec 2025)</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        {['Month', 'Gross Salary Paid (USD)', 'TOS Filed with GDT (USD)', 'TOS Paid to GDT (USD)', 'Effective Rate', 'Variance'].map(h => (
                                            <th key={h} className="text-left px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {monthlyTOS.map((m, i) => {
                                        const g = parseFloat(m.grossSalary) || 0;
                                        const f = parseFloat(m.tosFiled) || 0;
                                        const p = parseFloat(m.tosPaid) || 0;
                                        const rate = g > 0 ? ((f / g) * 100).toFixed(1) : '-';
                                        const var_ = f - p;
                                        return (
                                            <tr key={i} className="hover:bg-white/5 transition">
                                                <td className="px-3 py-2 font-black text-slate-300">{m.month}</td>
                                                <td className="px-3 py-2"><input type="text" inputMode="decimal" value={m.grossSalary} onChange={ev => updMonth(i, 'grossSalary', ev.target.value)} placeholder="0.00" className="w-28 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-blue-400 text-xs text-right" /></td>
                                                <td className="px-3 py-2"><input type="text" inputMode="decimal" value={m.tosFiled}    onChange={ev => updMonth(i, 'tosFiled',    ev.target.value)} placeholder="0.00" className="w-28 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-blue-400 text-xs text-right" /></td>
                                                <td className="px-3 py-2"><input type="text" inputMode="decimal" value={m.tosPaid}     onChange={ev => updMonth(i, 'tosPaid',     ev.target.value)} placeholder="0.00" className="w-28 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-blue-400 text-xs text-right" /></td>
                                                <td className="px-3 py-2 text-center"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded font-bold">{rate}{rate !== '-' ? '%' : ''}</span></td>
                                                <td className="px-3 py-2 text-right">
                                                    {var_ === 0 ? <span className="text-green-400 font-bold">✅</span> :
                                                     var_ > 0 ? <span className="text-red-400 font-bold">-${fmtN(var_)} unpaid</span> :
                                                     <span className="text-yellow-400 font-bold">+${fmtN(Math.abs(var_))} overpaid</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-blue-500/40 bg-slate-800/80">
                                        <td className="px-3 py-3 font-black text-[10px] text-blue-400 uppercase tracking-widest">ANNUAL TOTAL</td>
                                        <td className="px-3 py-3 text-right font-black text-white text-xs">{fmtN(annualGross)}</td>
                                        <td className="px-3 py-3 text-right font-black text-white text-xs">{fmtN(annualFiled)}</td>
                                        <td className="px-3 py-3 text-right font-black text-white text-xs">{fmtN(annualPaid)}</td>
                                        <td></td>
                                        <td className="px-3 py-3 text-right">
                                            {Math.abs(annualFiled - annualPaid) < 0.01 ? <span className="text-green-400 font-black text-xs">✅ All Clear</span> : <span className="text-red-400 font-black text-xs">❌ ${fmtN(Math.abs(annualFiled - annualPaid))} gap</span>}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>)}

                {/* SECTION D — Uploads */}
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-5">Section D — Document Uploads</h2>
                    <div className="flex items-end gap-3 mb-4">
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Select Month</label>
                            <select value={uploadMonth} onChange={e => setUploadMonth(e.target.value)} className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-400">
                                <option value="">Annual / General</option>
                                {MONTHS.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-dashed border-blue-500/40 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/10 transition">
                            <Upload size={14} /> Upload TOS Return / Payroll Doc
                        </button>
                        <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx" className="hidden" onChange={handleFileUpload} />
                    </div>
                    {uploads.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {uploads.map((u, i) => (
                                <div key={i} className="flex items-center gap-3 bg-slate-700/50 px-3 py-2 rounded-lg">
                                    <FileText size={14} className="text-blue-400 shrink-0" />
                                    <div className="min-w-0"><p className="text-xs text-white truncate">{u.label}</p><p className="text-[10px] text-slate-500">{u.month}</p></div>
                                    <button onClick={() => setUploads(prev => prev.filter((_, idx) => idx !== i))} className="ml-auto text-slate-500 hover:text-red-400 shrink-0"><Trash2 size={12} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
