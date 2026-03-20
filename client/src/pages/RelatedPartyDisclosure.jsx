import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Save, Upload, CheckCircle, AlertCircle, Loader2, FileText, Users } from 'lucide-react';

function fmtN(n) { return (parseFloat(n)||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }

const EMPTY_PARTY = { name:'', relationship:'Director', nationality:'Cambodian', ownershipPct:'', country:'Cambodia' };
const EMPTY_TX = { txType:'Sales', partyName:'', amount:'', description:'', armLength:'yes', armLengthNote:'' };
const EMPTY_LOAN = { direction:'To Director', partyName:'', openingBal:'', newLoans:'', repayments:'', interestRate:'', interestAmt:'' };
const EMPTY_DIV = { shareholderName:'', pct:'', amount:'', dateDeclared:'', datePaid:'' };
const TX_TYPES = ['Sales','Purchase','Loan Given','Loan Received','Mgmt Fee','Royalty','Dividend','Guarantee'];
const RELATIONSHIPS = ['Director','Shareholder','Parent Company','Subsidiary','Associate','Spouse / Family','Other'];
const LOAN_DIRS = ['To Director','From Director','To Shareholder','From Shareholder'];

export default function RelatedPartyDisclosure({ onBack }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [msg, setMsg]         = useState('');
    const [msgType, setMsgType] = useState('ok');
    const fileInputRef          = useRef(null);

    // Section A
    const [hasParent, setHasParent]               = useState('no');
    const [hasSubsidiary, setHasSubsidiary]       = useState('no');
    const [hasTransactions, setHasTransactions]   = useState('no');
    const [hasDirectorLoans, setHasDirectorLoans] = useState('no');
    const [hasMgmtFees, setHasMgmtFees]           = useState('no');
    const [hasRoyalties, setHasRoyalties]         = useState('no');
    const [hasDividends, setHasDividends]         = useState('no');
    // Tables
    const [parties, setParties]           = useState([{ ...EMPTY_PARTY }]);
    const [transactions, setTransactions] = useState([{ ...EMPTY_TX }]);
    const [directorLoans, setDirectorLoans] = useState([{ ...EMPTY_LOAN }]);
    const [dividends, setDividends]       = useState([{ ...EMPTY_DIV }]);
    const [uploads, setUploads]           = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get('/api/company/toi/related-party', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                if (r.data.data) {
                    const d = r.data.data;
                    setHasParent(d.hasParent||'no'); setHasSubsidiary(d.hasSubsidiary||'no');
                    setHasTransactions(d.hasTransactions||'no'); setHasDirectorLoans(d.hasDirectorLoans||'no');
                    setHasMgmtFees(d.hasMgmtFees||'no'); setHasRoyalties(d.hasRoyalties||'no');
                    setHasDividends(d.hasDividends||'no');
                    setParties(d.parties?.length ? d.parties : [{ ...EMPTY_PARTY }]);
                    setTransactions(d.transactions?.length ? d.transactions : [{ ...EMPTY_TX }]);
                    setDirectorLoans(d.directorLoans?.length ? d.directorLoans : [{ ...EMPTY_LOAN }]);
                    setDividends(d.dividends?.length ? d.dividends : [{ ...EMPTY_DIV }]);
                    setUploads(d.uploads || []);
                }
            })
            .catch(e => console.error('Load related party error', e))
            .finally(() => setLoading(false));
    }, []);

    const updRow = (setter, i, f, v) => setter(prev => prev.map((r,idx) => idx===i ? {...r,[f]:v} : r));
    const addRow = (setter, template) => setter(prev => [...prev, { ...template }]);
    const remRow = (setter, i) => setter(prev => prev.filter((_,idx) => idx!==i));

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = ev => setUploads(prev => [...prev, { label:file.name, fileName:file.name, mimeType:file.type, data:ev.target.result, uploadedAt:new Date().toISOString() }]);
            reader.readAsDataURL(file);
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/toi/related-party', {
                hasParent, hasSubsidiary, hasTransactions, hasDirectorLoans, hasMgmtFees,
                hasRoyalties, hasDividends, parties, transactions, directorLoans, dividends, uploads
            }, { headers: { Authorization: `Bearer ${token}` } });
            setMsg('Related party data saved'); setMsgType('ok');
        } catch (err) {
            setMsg(err.response?.data?.message || 'Save failed'); setMsgType('err');
        } finally {
            setSaving(false);
            setTimeout(() => setMsg(''), 4000);
        }
    };

    const YN = ({ val, set, label }) => (
        <div className="bg-slate-700/40 border border-white/5 rounded-xl p-4">
            <label className="block text-xs font-bold text-slate-300 mb-3">{label}</label>
            <div className="flex gap-2">
                {['yes','no'].map(v => (
                    <button key={v} onClick={() => set(v)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${val===v ? 'bg-purple-500 text-white border-purple-400' : 'bg-slate-600 border-slate-500 text-slate-400 hover:border-purple-400'}`}>
                        {v === 'yes' ? '✅ Yes' : '❌ No'}
                    </button>
                ))}
            </div>
        </div>
    );

    const loanClosing = l => {
        const o = parseFloat(l.openingBal)||0;
        const n = parseFloat(l.newLoans)||0;
        const r = parseFloat(l.repayments)||0;
        return o + n - r;
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-purple-400" size={40}/></div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            {/* Header */}
            <div className="bg-slate-900/90 border-b border-white/10 px-6 py-4 flex items-center gap-4 sticky top-0 z-30 backdrop-blur">
                <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition"><ArrowLeft size={18}/></button>
                <div>
                    <h1 className="text-lg font-black uppercase tracking-widest flex items-center gap-2"><span className="text-purple-400">🔗</span> Related Party Disclosure</h1>
                    <p className="text-[11px] text-slate-500">Transactions · Director Loans · Dividends · Year Ended 31 Dec 2025</p>
                </div>
                <div className="ml-auto">
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-black transition disabled:opacity-60">
                        {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Data
                    </button>
                </div>
            </div>

            {msg && (
                <div className={`mx-6 mt-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold ${msgType==='ok' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {msgType==='ok' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>} {msg}
                </div>
            )}

            <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
                {/* SECTION A — 7 Questions */}
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-5">Section A — General Assessment (7 Questions)</h2>
                    <div className="grid grid-cols-4 gap-3">
                        <YN val={hasParent} set={setHasParent} label="Does GK SMART have a parent or holding company?" />
                        <YN val={hasSubsidiary} set={setHasSubsidiary} label="Does GK SMART have subsidiary companies?" />
                        <YN val={hasTransactions} set={setHasTransactions} label="Were there sales or purchases with related parties?" />
                        <YN val={hasDirectorLoans} set={setHasDirectorLoans} label="Were loans given to or received from directors / shareholders?" />
                        <YN val={hasMgmtFees} set={setHasMgmtFees} label="Were management or service fees paid to a related entity?" />
                        <YN val={hasRoyalties} set={setHasRoyalties} label="Were royalties or license fees paid to a related party?" />
                        <YN val={hasDividends} set={setHasDividends} label="Were dividends declared or paid to shareholders in 2025?" />
                    </div>
                </div>

                {/* SECTION B — Party Identification */}
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-purple-400">Section B — Related Party Identification</h2>
                        <button onClick={() => addRow(setParties, EMPTY_PARTY)} className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-lg text-xs font-bold transition">
                            <Plus size={12}/> Add Party
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {['Name of Related Party','Relationship','Nationality','% Ownership / Control','Country of Residence',''].map(h => (
                                        <th key={h} className="text-left px-2 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {parties.map((p,i) => (
                                    <tr key={i} className="group hover:bg-white/5">
                                        <td className="px-2 py-2"><input value={p.name} onChange={e=>updRow(setParties,i,'name',e.target.value)} placeholder="Full Name / Company Name" className="w-44 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs"/></td>
                                        <td className="px-2 py-2"><select value={p.relationship} onChange={e=>updRow(setParties,i,'relationship',e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs">{RELATIONSHIPS.map(r=><option key={r}>{r}</option>)}</select></td>
                                        <td className="px-2 py-2"><input value={p.nationality} onChange={e=>updRow(setParties,i,'nationality',e.target.value)} placeholder="Cambodian" className="w-28 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs"/></td>
                                        <td className="px-2 py-2"><input type="number" value={p.ownershipPct} onChange={e=>updRow(setParties,i,'ownershipPct',e.target.value)} placeholder="%" className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs text-center"/></td>
                                        <td className="px-2 py-2"><input value={p.country} onChange={e=>updRow(setParties,i,'country',e.target.value)} placeholder="Cambodia" className="w-28 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs"/></td>
                                        <td className="px-2 py-2"><button onClick={()=>remRow(setParties,i)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SECTION C — Transactions */}
                {hasTransactions === 'yes' && (
                    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xs font-black uppercase tracking-widest text-purple-400">Section C — Related Party Transactions</h2>
                            <button onClick={() => addRow(setTransactions, EMPTY_TX)} className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-lg text-xs font-bold transition">
                                <Plus size={12}/> Add Transaction
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        {['Type','Related Party Name','Amount (USD)','Description / Nature','Arm\'s Length?','Notes',''].map(h => (
                                            <th key={h} className="text-left px-2 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {transactions.map((t,i) => (
                                        <tr key={i} className="group hover:bg-white/5">
                                            <td className="px-2 py-2"><select value={t.txType} onChange={e=>updRow(setTransactions,i,'txType',e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs">{TX_TYPES.map(r=><option key={r}>{r}</option>)}</select></td>
                                            <td className="px-2 py-2"><input value={t.partyName} onChange={e=>updRow(setTransactions,i,'partyName',e.target.value)} placeholder="Party name" className="w-36 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs"/></td>
                                            <td className="px-2 py-2"><input type="number" value={t.amount} onChange={e=>updRow(setTransactions,i,'amount',e.target.value)} placeholder="0.00" className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs text-right"/></td>
                                            <td className="px-2 py-2"><input value={t.description} onChange={e=>updRow(setTransactions,i,'description',e.target.value)} placeholder="Brief description" className="w-40 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs"/></td>
                                            <td className="px-2 py-2">
                                                <select value={t.armLength} onChange={e=>updRow(setTransactions,i,'armLength',e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs">
                                                    <option value="yes">✅ Yes</option>
                                                    <option value="no">❌ No</option>
                                                </select>
                                            </td>
                                            <td className="px-2 py-2"><input value={t.armLengthNote} onChange={e=>updRow(setTransactions,i,'armLengthNote',e.target.value)} placeholder="Explain if No" className="w-36 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs"/></td>
                                            <td className="px-2 py-2"><button onClick={()=>remRow(setTransactions,i)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SECTION D — Director Loans */}
                {hasDirectorLoans === 'yes' && (
                    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xs font-black uppercase tracking-widest text-purple-400">Section D — Director / Shareholder Loan Detail</h2>
                            <button onClick={() => addRow(setDirectorLoans, EMPTY_LOAN)} className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-lg text-xs font-bold transition">
                                <Plus size={12}/> Add Loan
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        {['Direction','Party Name','Opening Bal','New Loans/Drawdowns','Repayments','Closing Bal','Int. Rate %','Interest Amt',''].map(h => (
                                            <th key={h} className="text-left px-2 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {directorLoans.map((l,i) => (
                                        <tr key={i} className="group hover:bg-white/5">
                                            <td className="px-2 py-2"><select value={l.direction} onChange={e=>updRow(setDirectorLoans,i,'direction',e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs">{LOAN_DIRS.map(d=><option key={d}>{d}</option>)}</select></td>
                                            <td className="px-2 py-2"><input value={l.partyName} onChange={e=>updRow(setDirectorLoans,i,'partyName',e.target.value)} placeholder="Director / Shareholder name" className="w-36 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs"/></td>
                                            {['openingBal','newLoans','repayments'].map(f => (
                                                <td key={f} className="px-2 py-2"><input type="number" value={l[f]} onChange={e=>updRow(setDirectorLoans,i,f,e.target.value)} placeholder="0.00" className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs text-right"/></td>
                                            ))}
                                            <td className="px-2 py-2 text-right font-black text-purple-300">{fmtN(loanClosing(l))}</td>
                                            {['interestRate','interestAmt'].map(f => (
                                                <td key={f} className="px-2 py-2"><input type="number" value={l[f]} onChange={e=>updRow(setDirectorLoans,i,f,e.target.value)} placeholder={f==='interestRate'?'%':'0.00'} className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs text-right"/></td>
                                            ))}
                                            <td className="px-2 py-2"><button onClick={()=>remRow(setDirectorLoans,i)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SECTION E — Dividends */}
                {hasDividends === 'yes' && (
                    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xs font-black uppercase tracking-widest text-purple-400">Section E — Dividend Declaration</h2>
                            <button onClick={() => addRow(setDividends, EMPTY_DIV)} className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-lg text-xs font-bold transition">
                                <Plus size={12}/> Add Dividend
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        {['Shareholder Name','% Shareholding','Amount Declared (USD)','Date Declared','Date Paid',''].map(h => (
                                            <th key={h} className="text-left px-2 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {dividends.map((d,i) => (
                                        <tr key={i} className="group hover:bg-white/5">
                                            <td className="px-2 py-2"><input value={d.shareholderName} onChange={e=>updRow(setDividends,i,'shareholderName',e.target.value)} placeholder="Shareholder name" className="w-40 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs"/></td>
                                            <td className="px-2 py-2"><input type="number" value={d.pct} onChange={e=>updRow(setDividends,i,'pct',e.target.value)} placeholder="%" className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs text-center"/></td>
                                            <td className="px-2 py-2"><input type="number" value={d.amount} onChange={e=>updRow(setDividends,i,'amount',e.target.value)} placeholder="0.00" className="w-28 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs text-right"/></td>
                                            <td className="px-2 py-2"><input type="date" value={d.dateDeclared} onChange={e=>updRow(setDividends,i,'dateDeclared',e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs"/></td>
                                            <td className="px-2 py-2"><input type="date" value={d.datePaid} onChange={e=>updRow(setDividends,i,'datePaid',e.target.value)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-purple-400 text-xs"/></td>
                                            <td className="px-2 py-2"><button onClick={()=>remRow(setDividends,i)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-white/10 bg-slate-700/30">
                                        <td colSpan={2} className="px-2 py-2 font-black text-[10px] text-purple-400 uppercase">Total Dividends</td>
                                        <td className="px-2 py-2 text-right font-black text-white text-xs">{fmtN(dividends.reduce((a,d)=>a+(parseFloat(d.amount)||0),0))}</td>
                                        <td colSpan={3}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* SECTION F — Uploads */}
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-4">Section F — Document Uploads</h2>
                    <div className="grid grid-cols-4 gap-3 mb-4 text-[11px]">
                        {[
                            { label:'MOC Shareholder Register', hint:'Certified current shareholders', req:true },
                            { label:'Director Loan Agreement', hint:'Terms & interest rate', req: hasDirectorLoans==='yes' },
                            { label:'Related Party Contract', hint:'Service/management fee agreement', req: hasMgmtFees==='yes' },
                            { label:'Board Minutes for Dividend', hint:'Resolution date & amount declared', req: hasDividends==='yes' },
                        ].map((d,i) => (
                            <div key={i} className={`flex items-start gap-2 p-3 border border-dashed rounded-xl ${d.req ? 'border-purple-500/40 bg-purple-500/5' : 'border-slate-600 bg-slate-700/20'}`}>
                                <FileText size={14} className={d.req ? 'text-purple-400' : 'text-slate-500'} />
                                <div><p className={`font-bold text-xs ${d.req ? 'text-white' : 'text-slate-500'}`}>{d.label} {d.req && <span className="text-purple-400">*</span>}</p><p className="text-[10px] text-slate-500">{d.hint}</p></div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-dashed border-purple-500/40 text-purple-400 rounded-xl text-xs font-bold hover:bg-purple-500/10 transition">
                        <Upload size={14}/> Upload Documents (PDF, JPG, PNG)
                    </button>
                    <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload}/>
                    {uploads.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            {uploads.map((u,i) => (
                                <div key={i} className="flex items-center gap-3 bg-slate-700/50 px-3 py-2 rounded-lg">
                                    <FileText size={14} className="text-purple-400 shrink-0"/>
                                    <span className="text-xs text-white truncate">{u.label}</span>
                                    <button onClick={()=>setUploads(prev=>prev.filter((_,idx)=>idx!==i))} className="ml-auto text-slate-500 hover:text-red-400"><Trash2 size={12}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
