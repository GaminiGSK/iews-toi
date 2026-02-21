import React, { useState, useEffect } from 'react';
import DynamicForm from '../components/DynamicForm';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, RefreshCw, Radio, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const INITIAL_SCHEMA = {
    title: "Annual Income Tax Return",
    titleKh: "លិខិតប្រកាសពន្ធលើចំណូលប្រចាំឆ្នាំ",
    status: "active",
    sections: [
        {
            id: "header_period",
            fields: [
                {
                    key: "taxYear",
                    label: "Tax Period (Number of Month)",
                    labelKh: "Period",
                    type: "boxes",
                    length: 2,
                    colSpan: 3,
                    layout: "horizontal"
                },
                {
                    key: "periodFrom",
                    label: "From",
                    labelKh: "From",
                    type: "boxes",
                    length: 8,
                    format: "2-2-4",
                    noDash: true,
                    prefix: true,
                    colSpan: 4.5,
                    layout: "horizontal"
                },
                {
                    key: "periodTo",
                    label: "Until",
                    labelKh: "Until",
                    type: "boxes",
                    length: 8,
                    format: "2-2-4",
                    noDash: true,
                    colSpan: 4.5,
                    layout: "horizontal"
                }
            ]
        },
        {
            id: "section_1",
            title: "Section 1: Taxpayer Identification",
            fields: [
                { key: "enterpriseName", label: "Enterprise Name", type: "text" },
                { key: "tin", label: "Tax Identification Number (TIN)", type: "boxes", length: 9, format: "1-8" },
                { key: "registeredAddress", label: "Address", type: "text" }
            ]
        },
        {
            id: "section_2",
            title: "Section 2: Business Information",
            fields: [
                { key: "mainActivity", label: "Principal Business Activity", type: "text" },
                { key: "directorName", label: "Chairman / Director Name", type: "text" }
            ]
        }
    ]
};

const LiveTaxWorkspace = ({ embedded = false }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const packageId = searchParams.get('packageId') || searchParams.get('year') || 'admin_preview';
    const socket = useSocket();
    const [isSyncing, setIsSyncing] = useState(false);
    const [activePage, setActivePage] = useState(1);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (socket && packageId) {
            socket.emit('workspace:join', { packageId });

            socket.on('form:data', (data) => {
                console.log("[Tax Workspace] Received Data Update:", data);
                setFormData(prev => ({ ...prev, ...data }));
            });

            socket.on('form:update', (data) => {
                setFormData(prev => ({ ...prev, ...data }));
            });

            return () => {
                socket.off('form:data');
                socket.off('form:update');
            };
        }
    }, [socket, packageId]);

    const handleFormChange = (key, value) => {
        const update = { [key]: value };
        setFormData(prev => ({ ...prev, ...update }));

        // Emit to socket for persistence and broadcast
        if (socket) {
            socket.emit('workspace:update_data', {
                packageId,
                update
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-rose-500/30">
            {/* Header / Navigation */}
            {!embedded ? (
                <div className="bg-slate-900/90 backdrop-blur-xl border-b border-white/5 px-6 py-2.5 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="hidden lg:flex flex-col">
                            <div className="flex items-center gap-2">
                                <Radio size={14} className="text-rose-500 animate-pulse" />
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Live Session</span>
                            </div>
                            <h1 className="text-xs font-black text-white uppercase tracking-wider">Tax Workspace</h1>
                        </div>
                    </div>

                    {/* 27 PAGE SELECTION - REFINED WORKBENCH STYLE */}
                    <div className="flex-1 max-w-4xl flex overflow-x-auto mx-10 py-1 no-scrollbar gap-1.5 justify-center">
                        {Array.from({ length: 27 }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setActivePage(i + 1)}
                                className={`px-2.5 py-1 rounded-md text-[13px] font-bold border transition-all shrink-0 active:scale-90 ${activePage === i + 1
                                    ? 'bg-rose-600 border-rose-400/50 text-white shadow-lg shadow-rose-900/20'
                                    : 'bg-slate-800/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/10'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => socket?.emit('workspace:perform_action', { action: 'fill_year', packageId, params: { year: 2026 } })}
                            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-blue-900/20 active:scale-95"
                        >
                            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Sync AI</span>
                        </button>
                        <button
                            onClick={() => socket?.emit('workspace:perform_action', { action: 'fill_company', packageId, params: { companyCode: 'GK_SMART_AI' } })}
                            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-indigo-900/20 active:scale-95"
                        >
                            <CheckCircle2 size={14} />
                            Profile
                        </button>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-[0.15em] transition-all ${socket?.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${socket?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                            <span>{socket?.connected ? 'Online' : 'Offline'}</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* EMBEDDED SUB-NAVIGATOR FOR TABS */
                <div className="bg-black/40 border-b border-white/5 px-6 py-2 flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar">
                    {Array.from({ length: 27 }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setActivePage(i + 1)}
                            className={`px-3 py-1.5 rounded-lg text-[18px] font-bold border transition-all shrink-0 ${activePage === i + 1
                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40'
                                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                                }`}
                        >
                            P.{i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* MAIN CONTENT AREA: REPLICA OF THE LUXURY WORKBENCH DESIGN */}
            <div className="flex-1 bg-[#020617] overflow-y-auto px-6 py-8 flex justify-center no-scrollbar">
                <div className="w-full max-w-[1400px]">
                    {/* PAGE 1 CONTENT */}
                    {activePage === 1 && (
                        <div className="animate-fade-in relative grid grid-cols-2 gap-12">
                            {/* LEFT COLUMN */}
                            <div className="flex flex-col">
                                <div className="flex justify-between items-start border-b border-white/10 pb-8">
                                    <div className="flex flex-col gap-3">
                                        <h2 className="text-white font-bold text-3xl leading-snug max-w-xl" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                            លិខិតប្រកាសពន្ធលើចំណូលប្រចាំឆ្នាំចំពោះសហគ្រាសជាប់ពន្ធលើចំណូលតាមរបបស្វ័យប្រកាស
                                        </h2>
                                        <h1 className="text-slate-400 font-bold text-sm uppercase tracking-[0.2em]">
                                            Annual Income Tax Return <span className="text-slate-500 font-medium lowercase ml-1">for the year ended</span>
                                        </h1>
                                    </div>
                                    <div className="flex gap-2 bg-black/30 p-2 rounded-xl border border-white/5 shadow-inner">
                                        {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                            <div key={i} className="w-10 h-14 border border-white/10 flex items-center justify-center bg-slate-800/50 rounded-lg shadow-sm">
                                                <input
                                                    type="text"
                                                    maxLength="1"
                                                    className="w-full h-full text-center text-xl font-black outline-none bg-transparent text-white placeholder:text-white/10"
                                                    value={char}
                                                    placeholder="0"
                                                    onChange={(e) => {
                                                        const newDate = (formData.untilDate || "31122026").split('');
                                                        newDate[4 + i] = e.target.value;
                                                        handleFormChange('untilDate', newDate.join(''));
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* TAX PERIOD & DATE RANGE - REFINED DENSITY */}
                                <div className="mt-10 flex flex-col gap-10 border-b border-white/5 pb-10">
                                    <div className="flex items-center gap-12">
                                        {/* TAX PERIOD */}
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទជាប់ពន្ធ (ចំនួនខែ)</span>
                                                <span className="text-slate-500 text-[11px] font-black uppercase tracking-wider">Tax Period (Months)</span>
                                            </div>
                                            <div className="flex gap-1.5 p-1.5 bg-black/20 rounded-lg border border-white/5">
                                                {(formData.taxMonths || "12").split('').map((char, i) => (
                                                    <div key={i} className="w-10 h-12 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded-md shadow-sm">
                                                        <input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-xl" value={char} onChange={(e) => handleFormChange('taxMonths', (formData.taxMonths || "12").substring(0, i) + e.target.value + (formData.taxMonths || "12").substring(i + 1))} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-slate-700 text-sm">&#9654;</div>
                                        {/* START DATE */}
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ពីថ្ងៃ</span>
                                                <span className="text-slate-500 text-[11px] font-black uppercase tracking-wider">From</span>
                                            </div>
                                            <div className="flex gap-4 p-1.5 bg-black/20 rounded-lg border border-white/5">
                                                {[
                                                    { start: 0, len: 2 }, // Day
                                                    { start: 2, len: 2 }, // Month
                                                    { start: 4, len: 4 }  // Year
                                                ].map((section, sIdx) => (
                                                    <div key={sIdx} className="flex gap-1">
                                                        {Array.from({ length: section.len }).map((_, i) => {
                                                            const charIdx = section.start + i;
                                                            return (
                                                                <div key={i} className="w-9 h-11 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded shadow-sm">
                                                                    <input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-lg" value={formData.fromDate?.[charIdx] || ''} onChange={(e) => {
                                                                        const newDate = (formData.fromDate || "01012026").split('');
                                                                        newDate[charIdx] = e.target.value;
                                                                        handleFormChange('fromDate', newDate.join(''));
                                                                    }} />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {/* END DATE ROW */}
                                    <div className="flex items-center gap-10">
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដល់ថ្ងៃ</span>
                                            <span className="text-slate-500 text-[11px] font-black uppercase tracking-wider">Until</span>
                                        </div>
                                        <div className="flex gap-4 p-1.5 bg-black/20 rounded-lg border border-white/5 ml-4">
                                            {[
                                                { start: 0, len: 2 }, // Day
                                                { start: 2, len: 2 }, // Month
                                                { start: 4, len: 4 }  // Year
                                            ].map((section, sIdx) => (
                                                <div key={sIdx} className="flex gap-1">
                                                    {Array.from({ length: section.len }).map((_, i) => {
                                                        const charIdx = section.start + i;
                                                        return (
                                                            <div key={i} className="w-9 h-11 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded shadow-sm">
                                                                <input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-lg" value={formData.untilDate?.[charIdx] || ''} onChange={(e) => {
                                                                    const newDate = (formData.untilDate || "31122026").split('');
                                                                    newDate[charIdx] = e.target.value;
                                                                    handleFormChange('untilDate', newDate.join(''));
                                                                }} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ENTERPRISE DETAILS TABLE - REFINED STYLING */}
                                <div className="mt-12 border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                                    {[
                                        { kh: "ឈ្មោះសហគ្រាស ៖", en: "Name of Enterprise:", key: "enterpriseName" },
                                        { kh: "ចំនួនសាខាក្នុងស្រុក ៖", en: "Number of Local Branch:", key: "branchCount" },
                                        { kh: "កាលបរិច្ឆេទចុះបញ្ជីសារពើពន្ធ ៖", en: "Date of Tax Registration:", key: "registrationDate" },
                                        { kh: "ឈ្មោះអភិបាល/អ្នកគ្រប់គ្រង/ម្ចាស់សហគ្រាស ៖", en: "Name of Director/Manager/Owner:", key: "directorName" },
                                        { kh: "សកម្មភាពអាជីវកម្មចម្បង ៖", en: "Main Business Activities:", key: "mainActivity" }
                                    ].map((row, idx) => (
                                        <div key={idx} className="flex border-b border-white/5 last:border-0 min-h-[70px]">
                                            <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.02]">
                                                <span className="text-white font-bold text-base tracking-tight leading-snug mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider leading-none">{row.en}</span>
                                            </div>
                                            <div className="flex-1 p-5 flex items-center bg-transparent">
                                                <input type="text" value={formData[row.key] || ""} onChange={(e) => handleFormChange(row.key, e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-lg font-bold px-2 placeholder:text-white/10" placeholder="..." />
                                            </div>
                                        </div>
                                    ))}
                                    {/* SPECIAL ROW: ACCOUNTANT / TAX AGENT */}
                                    <div className="flex min-h-[90px]">
                                        <div className="w-[30%] border-r border-white/5 p-4 flex flex-col justify-center bg-white/[0.04]">
                                            <span className="text-white font-bold text-sm tracking-tight leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះភ្នាក់ងារសេវាកម្មពន្ធដារ ឬ គណនេយ្យករ...</span>
                                            <span className="text-slate-500 text-[9px] font-black uppercase tracking-tight leading-none">Accountant / Agent:</span>
                                        </div>
                                        <div className="w-[20%] border-r border-white/5 p-4 flex items-center">
                                            <input type="text" value={formData.accountantName || ""} onChange={(e) => handleFormChange('accountantName', e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-base font-bold" placeholder="..." />
                                        </div>
                                        <div className="w-[25%] border-r border-white/5 p-4 flex flex-col justify-center bg-white/[0.04]">
                                            <span className="text-white font-bold text-sm tracking-tight leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអាជ្ញាប័ណ្ណ...</span>
                                            <span className="text-slate-500 text-[9px] font-black uppercase tracking-tight leading-none">License Number:</span>
                                        </div>
                                        <div className="flex-1 p-4 flex items-center">
                                            <input type="text" value={formData.agentLicenseNo || ""} onChange={(e) => handleFormChange('agentLicenseNo', e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-base font-bold" placeholder="..." />
                                        </div>
                                    </div>
                                </div>

                                {/* ADDRESS DETAILS TABLE */}
                                <div className="mt-8 border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                                    {[
                                        { kh: "អាសយដ្ឋានបច្ចុប្បន្នរបស់ការិយាល័យចុះបញ្ជី ៖", en: "Current Registered Office Address:", key: "registeredAddress" },
                                        { kh: "អាសយដ្ឋានបច្ចុប្បន្នរបស់កន្លែងប្រកបអាជីវកម្មចម្បង ៖", en: "Current Principal Establishment Address:", key: "principalAddress" },
                                        { kh: "អាសយដ្ឋានឃ្លាំង ៖", en: "Warehouse Address:", key: "warehouseAddress" }
                                    ].map((row, idx) => (
                                        <div key={idx} className="flex border-b border-white/5 last:border-0 min-h-[70px]">
                                            <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.02]">
                                                <span className="text-white font-bold text-base tracking-tight leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider leading-none">{row.en}</span>
                                            </div>
                                            <div className="flex-1 p-5 flex items-center">
                                                <input type="text" value={formData[row.key] || ""} onChange={(e) => handleFormChange(row.key, e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-base font-bold" placeholder="..." />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="flex flex-col border-l border-white/10 pl-12">
                                {/* STANDARDIZED TIN HEADER FOR PAGE 1 */}
                                <div className="mb-10 flex items-center gap-6 bg-slate-900 border border-white/10 p-5 rounded-2xl shadow-2xl">
                                    <div className="flex flex-col items-end">
                                        <span className="text-base font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                    </div>
                                    <div className="flex gap-1.5 p-1 bg-black/20 rounded-lg border border-white/5">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="w-9 h-12 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded shadow-sm">
                                                <span className="text-xl font-black text-white">{(formData.tin || "")[i]}</span>
                                            </div>
                                        ))}
                                        <div className="w-5 h-[3px] bg-white opacity-40 mx-1 self-center" />
                                        {Array.from({ length: 9 }).map((_, i) => (
                                            <div key={i + 3} className="w-9 h-12 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded shadow-sm">
                                                <span className="text-xl font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTION: ACCOUNTING RECORDS */}
                                <div className="border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                                    <div className="flex border-b border-white/5 min-h-[90px]">
                                        <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                                            <span className="text-white font-bold text-base tracking-tight leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការរក្សាទុកបញ្ជីគណនេយ្យ ៖</span>
                                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider leading-none">Accounting Records:</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-6 gap-8 flex-wrap">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" className="w-5 h-5 accent-rose-500 bg-slate-800 border-white/10 rounded" />
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-sm leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រើប្រាស់កម្មវិធី (ឈ្មោះ) ៖</span>
                                                    <span className="text-slate-500 text-[9px] font-black uppercase leading-none">Using Software:</span>
                                                </div>
                                                <input type="text" value={formData.accountingSoftware || ""} onChange={(e) => handleFormChange('accountingSoftware', e.target.value)} className="w-32 border-b border-white/10 bg-transparent outline-none text-white text-sm font-bold px-1" placeholder="..." />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" className="w-5 h-5 accent-rose-500 bg-slate-800 border-white/10 rounded" />
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-sm leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនបានប្រើប្រាស់កម្មវិធី</span>
                                                    <span className="text-slate-500 text-[9px] font-black uppercase leading-none">Not Using Software</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION: TAX COMPLIANCE */}
                                    <div className="flex border-b border-white/5 min-h-[80px]">
                                        <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                                            <span className="text-white font-bold text-base tracking-tight leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ស្ថានភាពអនុលោមភាពសារពើពន្ធ</span>
                                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider leading-none">Tax Compliance Status:</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-6 gap-10">
                                            {['GOLD', 'SILVER', 'BRONZE'].map((level, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <input type="checkbox" className="w-5 h-5 accent-amber-500 bg-slate-800 border-white/10 rounded" />
                                                    <span className="text-white font-black text-xs tracking-widest">{level}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SECTION: STATUTORY AUDIT */}
                                    <div className="flex min-h-[90px]">
                                        <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                                            <span className="text-white font-bold text-base tracking-tight leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្រូវឱ្យមានការធ្វើសវនកម្មដែលឬទេ?</span>
                                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider leading-none">Statutory Audit:</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-6 gap-10">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" className="w-5 h-5 accent-rose-500 bg-slate-800 border-white/10 rounded" />
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-sm leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្រូវឱ្យមាន (ភ្ជាប់របាយការណ៍)</span>
                                                    <span className="text-slate-500 text-[9px] font-black uppercase opacity-60">Required</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" className="w-5 h-5 accent-rose-500 bg-slate-800 border-white/10 rounded" />
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-sm leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនតម្រូវឱ្យមាន</span>
                                                    <span className="text-slate-500 text-[9px] font-black uppercase opacity-60">Not Required</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: LEGAL FORM / BUSINESS OPERATIONS */}
                                <div className="mt-8 border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                                    <div className="border-b border-white/5 min-h-[60px] flex items-center px-6 bg-white/[0.04]">
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-base tracking-tight leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រូបភាពគតិយុត្ត ឬ ទម្រង់នៃការធ្វើអាជីវកម្ម ឬ សកម្មភាពផ្សេងៗ</span>
                                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Legal Form or Form of Business Operations:</span>
                                        </div>
                                    </div>
                                    <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-10">
                                        {[
                                            { kh: "សហគ្រាសឯកបុគ្គល/រូបវន្តបុគ្គល", en: "Sole Proprietorship / Physical Person" },
                                            { kh: "ក្រុមហ៊ុនសហកម្មសិទ្ធិទូទៅ", en: "General Partnership" },
                                            { kh: "ក្រុមហ៊ុនសហកម្មសិទ្ធិមានកម្រិត", en: "Limited Partnership" },
                                            { kh: "ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិតមានសមាជិកតែម្នាក់", en: "Single Member Private Limited" },
                                            { kh: "ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិត", en: "Private Limited Company" },
                                            { kh: "ក្រុមហ៊ុនមហាជនទទួលខុសត្រូវមានកម្រិត", en: "Public Limited Company" },
                                            { kh: "ចំណែកក្នុងសហគ្រាសចម្រុះ", en: "Interest in Joint Venture" },
                                            { kh: "សហគ្រាសសាធារណៈ", en: "Public Enterprise" },
                                            { kh: "សហគ្រាសរដ្ឋ", en: "State Enterprise" },
                                            { kh: "ក្រុមហ៊ុនរដ្ឋចម្រុះ", en: "State Joint Venture" },
                                            { kh: "សាខាក្រុមហ៊ុនបរទេស", en: "Foreign Company's Branch" },
                                            { kh: "ការិយាល័យតំណាង", en: "Representative Office" },
                                            { kh: "អង្គការ NGO / សមាគម", en: "NGO / Association" },
                                        ].map((type, idx) => (
                                            <div key={idx} className="flex items-start gap-3 hover:bg-white/[0.04] p-2 transition-all rounded-lg group cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4 accent-emerald-500 bg-slate-800 border-white/10 rounded mt-1 shadow-sm" />
                                                <div className="flex flex-col">
                                                    <span className="text-slate-200 font-bold text-[13px] leading-tight transition-colors group-hover:text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{type.kh}</span>
                                                    <span className="text-slate-500 text-[9px] font-black uppercase mt-0.5">{type.en}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex items-start gap-3 p-2 col-span-1">
                                            <input type="checkbox" className="w-4 h-4 accent-emerald-500 bg-slate-800 border-white/10 rounded mt-1" />
                                            <div className="flex flex-col flex-1">
                                                <span className="text-slate-200 font-bold text-[13px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សហគ្រាសផ្សេងៗ</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-slate-500 text-[9px] font-black uppercase whitespace-nowrap">Others:</span>
                                                    <input type="text" value={formData.legalFormOther || ""} onChange={(e) => handleFormChange('legalFormOther', e.target.value)} className="flex-1 bg-transparent border-b border-white/10 outline-none text-slate-200 text-xs font-bold px-1 focus:border-emerald-500/50 transition-colors" placeholder="..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: INCOME TAX DETAILS */}
                                <div className="mt-8 border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                                    {/* EXEMPTION DETAILS */}
                                    <div className="flex border-b border-white/5 min-h-[80px]">
                                        <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                                            <span className="text-white font-bold text-base tracking-tight leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការលើកលែងពន្ធលើចំណូល</span>
                                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Income Tax Exemption:</span>
                                        </div>
                                        <div className="flex-1 flex font-black">
                                            <div className="w-[30%] border-r border-white/5 p-4 flex flex-col justify-center">
                                                <span className="text-slate-400 font-bold text-[11px] leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំចំណូលដំបូង</span>
                                                <span className="text-slate-500 text-[9px] uppercase leading-none">First Revenue:</span>
                                                <input type="text" value={formData.firstRevenueYear || ""} onChange={(e) => handleFormChange('firstRevenueYear', e.target.value)} className="mt-1 w-full bg-transparent border-none outline-none text-white text-base font-bold focus:text-indigo-400 transition-colors" placeholder="..." />
                                            </div>
                                            <div className="w-[30%] border-r border-white/5 p-4 flex flex-col justify-center bg-white/[0.02]">
                                                <span className="text-slate-400 font-bold text-[11px] leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំចំណេញដំបូង</span>
                                                <span className="text-slate-500 text-[9px] uppercase leading-none">First Profit:</span>
                                                <input type="text" value={formData.firstProfitYear || ""} onChange={(e) => handleFormChange('firstProfitYear', e.target.value)} className="mt-1 w-full bg-transparent border-none outline-none text-white text-base font-bold focus:text-indigo-400 transition-colors" placeholder="..." />
                                            </div>
                                            <div className="flex-1 p-4 flex flex-col justify-center">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-400 font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រយៈពេលអនុគ្រោះ</span>
                                                        <p className="text-slate-500 text-[9px] uppercase leading-none mt-0.5">Priority Period:</p>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-500 font-black text-[9px] uppercase">Year</span>
                                                    </div>
                                                </div>
                                                <input type="text" value={formData.priorityPeriod || ""} onChange={(e) => handleFormChange('priorityPeriod', e.target.value)} className="mt-1 w-full bg-transparent border-none outline-none text-white text-base font-bold focus:text-indigo-400 transition-colors" placeholder="..." />
                                            </div>
                                        </div>
                                    </div>

                                    {/* TAX RATE SELECTION */}
                                    <div className="flex border-b border-white/5 min-h-[80px]">
                                        <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                                            <span className="text-white font-bold text-base tracking-tight leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រាពន្ធលើចំណូល</span>
                                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Income Tax Rate:</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-10 justify-between">
                                            {["30%", "20%", "5%", "0%", "0-20%"].map((rate, i) => (
                                                <div key={i} className="flex flex-col items-center gap-1.5 group cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 accent-emerald-500 bg-slate-800 border-white/10 rounded group-hover:border-emerald-500/50 transition-all" />
                                                    <span className="text-slate-300 font-black text-[10px] tracking-widest">{rate}</span>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-4 border-l border-white/10 pl-8">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-slate-300 font-bold text-[11px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រាតាមថ្នាក់</span>
                                                    <span className="text-slate-500 text-[9px] font-black uppercase mt-1">Progressive</span>
                                                </div>
                                                <input type="checkbox" className="w-5 h-5 accent-emerald-500 bg-slate-800 border-white/10 rounded shadow-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* TAX DUE & BOX 18 */}
                                    <div className="flex min-h-[90px]">
                                        <div className="w-[40%] border-r border-white/5 p-5 flex flex-col justify-center bg-white/[0.04]">
                                            <span className="text-white font-bold text-base tracking-tight leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទឹកប្រាក់ពន្ធត្រូវបង់</span>
                                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Income Tax Due:</span>
                                        </div>
                                        <div className="w-[16%] border-r border-white/5 p-5 flex items-center">
                                            <input type="text" value={formData.incomeTaxDue || ""} onChange={(e) => handleFormChange('incomeTaxDue', e.target.value)} className="w-full bg-transparent border-none outline-none text-emerald-400 text-xl font-black placeholder:text-emerald-500/20" placeholder="0.00" />
                                        </div>
                                        <div className="w-[10%] border-r border-white/5 flex flex-col items-center justify-center bg-rose-500/5 transition-colors hover:bg-rose-500/10">
                                            <span className="text-rose-400 text-[9px] font-black uppercase tracking-tighter">Box</span>
                                            <span className="text-rose-400 text-2xl font-black">18</span>
                                        </div>
                                        <div className="w-[18%] border-r border-white/5 p-4 flex flex-col justify-center bg-white/[0.02]">
                                            <span className="text-slate-400 font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឥណទានពន្ធ</span>
                                            <span className="text-slate-500 text-[8px] font-black uppercase mt-0.5">Tax Credit CF:</span>
                                        </div>
                                        <div className="flex-1 p-5 flex items-center">
                                            <input type="text" value={formData.taxCreditCarriedForward || ""} onChange={(e) => handleFormChange('taxCreditCarriedForward', e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-base font-black placeholder:text-white/10" placeholder="0.00" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-16 flex flex-col items-center opacity-30 group cursor-default">
                                    <div className="w-px bg-slate-700 h-12 group-hover:h-20 transition-all duration-700" />
                                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.8em] mt-4 group-hover:tracking-[1.2em] transition-all duration-700">Blueprint Phase Complete</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 2 CONTENT */}
                    {activePage === 2 && (
                        <div className="animate-fade-in relative px-2 py-8 grid grid-cols-2 gap-12 items-start">
                            {/* LEFT COLUMN: CAPITAL & SHAREHOLDERS */}
                            <div className="flex flex-col">
                                {/* CAPITAL CONTRIBUTIONS BOXED HEADER */}
                                <div className="w-full border border-white/10 p-6 flex justify-between items-center bg-slate-900/40 rounded-2xl relative overflow-hidden group shadow-2xl">
                                    <div className="flex flex-col gap-1 relative z-10 transition-transform group-hover:scale-[1.01] duration-500">
                                        <h2 className="text-white font-bold text-3xl tracking-tight leading-none" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ការចូលរួមមូលធនគិតត្រឹមការិយបរិច្ឆេទ</h2>
                                        <h1 className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Capital Contributions as at</h1>
                                    </div>

                                    {/* 4 DATE BOXES */}
                                    <div className="flex gap-1.5 relative z-10 p-1.5 bg-black/20 rounded-xl border border-white/5 shadow-inner">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="w-10 h-14 border border-white/10 flex items-center justify-center bg-slate-800 rounded-lg shadow-sm">
                                                <input
                                                    type="text"
                                                    maxLength="1"
                                                    className="w-full h-full text-center text-xl font-black outline-none bg-transparent text-white"
                                                    value={(formData.untilDate?.slice(-4) || "2026")[i]}
                                                    readOnly
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* STANDARDIZED TIN SECTION FOR PAGE 2 */}
                                <div className="w-full mt-8 flex items-center gap-8 bg-slate-900/60 p-5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-sm">
                                    <div className="flex flex-col items-end">
                                        <span className="text-white font-bold text-lg tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider leading-none">Tax Identification Number (TIN):</span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-auto p-1.5 bg-black/20 rounded-xl border border-white/5 shadow-inner">
                                        <div className="flex gap-1.5">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="w-9 h-12 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded shadow-sm">
                                                    <span className="text-xl font-black text-white">{(formData.tin || "")[i]}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-5 h-[3px] bg-white opacity-40 mx-1 self-center" />
                                        <div className="flex gap-1.5">
                                            {Array.from({ length: 9 }).map((_, i) => (
                                                <div key={i + 3} className="w-9 h-12 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded shadow-sm">
                                                    <span className="text-xl font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* SHAREHOLDER TABLE SECTION */}
                                <div className="w-full mt-10 border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                                    {/* COMPLEX MULTI-LEVEL HEADER */}
                                    <div className="flex border-b border-white/10 min-h-[90px] bg-white/[0.04]">
                                        <div className="w-[20%] border-r border-white/10 p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-sm leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះអ្នកចូលហ៊ុន</span>
                                            <span className="text-slate-500 text-[9px] font-black uppercase leading-tight">Shareholder's Name</span>
                                        </div>
                                        <div className="w-[18%] border-r border-white/10 p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-sm leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អាសយដ្ឋានបច្ចុប្បន្ន</span>
                                            <span className="text-slate-500 text-[9px] font-black uppercase leading-tight">Current Address</span>
                                        </div>
                                        <div className="w-[12%] border-r border-white/10 p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-sm leading-tight mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មុខងារ</span>
                                            <span className="text-slate-500 text-[9px] font-black uppercase leading-tight">Position</span>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <div className="h-[40%] border-b border-white/10 flex flex-col items-center justify-center py-1 bg-white/[0.02]">
                                                <span className="text-white font-bold text-sm leading-none mb-0.5" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ភាគហ៊ុន ឬចំណែកដែលមាន</span>
                                                <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider">Shares Held</span>
                                            </div>
                                            <div className="flex-1 flex">
                                                <div className="w-1/2 border-r border-white/10 flex flex-col">
                                                    <div className="h-1/2 border-b border-white/10 flex flex-col items-center justify-center py-1">
                                                        <span className="text-slate-300 font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដើមការិយបរិច្ឆេទ</span>
                                                        <span className="text-slate-500 text-[8px] font-black uppercase">Start Period</span>
                                                    </div>
                                                    <div className="flex-1 flex text-[10px] font-black text-slate-400">
                                                        <div className="w-[30%] border-r border-white/10 flex flex-col items-center justify-center leading-none">
                                                            <span>%</span>
                                                        </div>
                                                        <div className="flex-1 flex flex-col items-center justify-center leading-none">
                                                            <span className="uppercase text-[8px]">Amount</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex flex-col">
                                                    <div className="h-1/2 border-b border-white/10 flex flex-col items-center justify-center py-1">
                                                        <span className="text-slate-300 font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចុងការិយបរិច្ឆេទ</span>
                                                        <span className="text-slate-500 text-[8px] font-black uppercase">End Period</span>
                                                    </div>
                                                    <div className="flex-1 flex text-[10px] font-black text-slate-400">
                                                        <div className="w-[30%] border-r border-white/10 flex flex-col items-center justify-center leading-none">
                                                            <span>%</span>
                                                        </div>
                                                        <div className="flex-1 flex flex-col items-center justify-center leading-none">
                                                            <span className="uppercase text-[8px]">Amount</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.04] border-b border-white/10 px-4 py-2 flex flex-col">
                                        <span className="text-white font-bold text-xs" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ក. មូលធន/មូលធនភាគហ៊ុនចុះបញ្ជី</span>
                                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider">A. Registered Capital / Share Capital</span>
                                    </div>
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <div key={r} className="flex border-b border-white/10 h-10 hover:bg-white/[0.04] transition-colors group">
                                            <div className="w-[20%] border-r border-white/10 p-1 flex items-center">
                                                <span className="text-slate-700 text-[10px] font-mono w-4 shrink-0 text-center">{r}</span>
                                                <input type="text" className="w-full bg-transparent outline-none text-white text-xs font-bold px-1" placeholder="..." />
                                            </div>
                                            <div className="w-[18%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs px-1" /></div>
                                            <div className="w-[12%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-center" /></div>
                                            <div className="flex-1 flex">
                                                <div className="w-1/2 flex border-r border-white/10">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic text-xs text-slate-500"><input type="text" className="w-full bg-transparent outline-none text-white text-center" placeholder="0" /></div>
                                                    <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-right" placeholder="0.00" /></div>
                                                </div>
                                                <div className="flex-1 flex">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic text-xs text-slate-500"><input type="text" className="w-full bg-transparent outline-none text-white text-center" placeholder="0" /></div>
                                                    <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-right" placeholder="0.00" /></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex h-10 bg-white/[0.04] border-b border-white/10">
                                        <div className="w-[50%] border-r border-white/10 flex items-center px-4">
                                            <span className="text-white font-bold text-xs" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>សរុប</span>
                                            <span className="text-slate-500 text-[9px] font-black uppercase ml-2">Total</span>
                                        </div>
                                        <div className="flex-1 flex">
                                            <div className="w-1/2 flex border-r border-white/10">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-500/70 text-[10px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end font-black text-white/50 text-[10px]">-</div>
                                            </div>
                                            <div className="flex-1 flex font-black">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center text-rose-500/70 text-[10px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end text-white/50 text-[10px]">-</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.04] border-y border-white/10 px-4 py-2 flex flex-col">
                                        <span className="text-white font-bold text-xs" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ខ. មូលធន/មូលធនភាគហ៊ុន (បានបង់)</span>
                                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider">B. Paid up Capital / Share Capital</span>
                                    </div>
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <div key={r} className="flex border-b border-white/10 h-10 hover:bg-white/[0.04] transition-colors group">
                                            <div className="w-[20%] border-r border-white/10 p-1 flex items-center">
                                                <span className="text-slate-700 text-[10px] font-mono w-4 shrink-0 text-center">{r}</span>
                                                <input type="text" className="w-full bg-transparent outline-none text-white text-xs font-bold px-1" placeholder="..." />
                                            </div>
                                            <div className="w-[18%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs px-1" /></div>
                                            <div className="w-[12%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-center" /></div>
                                            <div className="flex-1 flex">
                                                <div className="w-1/2 flex border-r border-white/10">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic text-xs text-slate-500"><input type="text" className="w-full bg-transparent outline-none text-white text-center" placeholder="0" /></div>
                                                    <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-right" placeholder="0.00" /></div>
                                                </div>
                                                <div className="flex-1 flex">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic text-xs text-slate-500"><input type="text" className="w-full bg-transparent outline-none text-white text-center" placeholder="0" /></div>
                                                    <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-right" placeholder="0.00" /></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex h-10 bg-white/[0.04]">
                                        <div className="w-[50%] border-r border-white/10 flex items-center px-4">
                                            <span className="text-white font-bold text-xs" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>សរុប</span>
                                            <span className="text-slate-500 text-[9px] font-black uppercase ml-2">Total</span>
                                        </div>
                                        <div className="flex-1 flex font-black">
                                            <div className="w-1/2 flex border-r border-white/10">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center text-rose-500/70 text-[10px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end text-white/50 text-[10px]">-</div>
                                            </div>
                                            <div className="flex-1 flex">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center text-rose-500/70 text-[10px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end text-white/50 text-[10px]">-</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: EMPLOYEE INFORMATION */}
                            <div className="flex flex-col">
                                {/* EMPLOYEE INFO BOXED HEADER */}
                                <div className="w-full border border-white/10 p-5 flex flex-col items-center bg-slate-900/40 rounded-2xl relative group shadow-2xl">
                                    <h2 className="text-white font-bold text-2xl tracking-tight leading-none mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ព័ត៌មានអំពីនិយោជិតសហគ្រាសនៅក្នុងការិយបរិច្ឆេទ</h2>
                                    <h1 className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Employee Census Information</h1>
                                </div>

                                {/* EMPLOYEE TABLE */}
                                <div className="w-full mt-8 border border-white/10 overflow-hidden bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                                    <div className="flex border-b border-white/10 h-[80px] bg-white/[0.04]">
                                        <div className="w-[30%] border-r border-white/10 p-2 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-xs leading-tight mb-0.5" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>បរិយាយ</span>
                                            <span className="text-slate-500 text-[8px] font-black uppercase tracking-tight">Description</span>
                                        </div>
                                        <div className="w-[18%] border-r border-white/10 p-2 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-xs leading-tight mb-0.5" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>តួនាទី</span>
                                            <span className="text-slate-500 text-[8px] font-black uppercase tracking-tight">Position</span>
                                        </div>
                                        <div className="w-[10%] border-r border-white/10 p-2 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-xs leading-tight mb-0.5" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ចំនួន</span>
                                            <span className="text-slate-500 text-[8px] font-black uppercase tracking-tight">Number</span>
                                        </div>
                                        <div className="w-[22%] border-r border-white/10 p-2 flex flex-col items-center justify-center text-center bg-white/[0.02]">
                                            <span className="text-white font-bold text-[10px] leading-tight mb-0.5" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ប្រាក់បៀវត្ស</span>
                                            <span className="text-slate-500 text-[8px] font-black uppercase leading-tight text-center">Salary (Excl. Fringe)</span>
                                        </div>
                                        <div className="flex-1 p-2 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[10px] leading-tight mb-0.5" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>អត្ថប្រយោជន៍បន្ថែម</span>
                                            <span className="text-slate-500 text-[8px] font-black uppercase leading-tight">Fringe Benefits</span>
                                        </div>
                                    </div>

                                    {/* SECTION 1: SHAREHOLDING MANAGERS */}
                                    <div className="flex border-b border-white/10 h-10 bg-white/[0.04]">
                                        <div className="w-[30%] border-r border-white/10 px-4 flex flex-col justify-center">
                                            <span className="text-white font-bold text-[10px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>១- អ្នកគ្រប់គ្រងជាម្ចាស់ភាគហ៊ុន</span>
                                            <span className="text-slate-500 text-[8px] font-black uppercase">1- Shareholding Managers</span>
                                        </div>
                                        <div className="flex-1 flex text-[10px] font-black text-slate-500">
                                            <div className="w-[18%] border-r border-white/10"></div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center">-</div>
                                            <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4">-</div>
                                            <div className="flex-1 flex items-center justify-end px-4">-</div>
                                        </div>
                                    </div>
                                    {[1, 2, 3].map((r) => (
                                        <div key={`s1-${r}`} className="flex border-b border-white/10 h-9 hover:bg-white/[0.04] transition-colors">
                                            <div className="w-[30%] border-r border-white/10 px-4 flex items-center italic text-[10px] text-slate-400">Entry {r}</div>
                                            <div className="w-[18%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-center" /></div>
                                            <div className="w-[10%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-center" placeholder="0" /></div>
                                            <div className="w-[22%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-right" placeholder="0.00" /></div>
                                            <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-right" placeholder="0.00" /></div>
                                        </div>
                                    ))}

                                    {/* SECTION 2: NON-SHAREHOLDING MANAGERS */}
                                    <div className="flex border-b border-white/10 h-10 bg-white/[0.04]">
                                        <div className="w-[30%] border-r border-white/10 px-4 flex flex-col justify-center">
                                            <span className="text-white font-bold text-[10px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>២- អ្នកគ្រប់គ្រងមិនមែនជាម្ចាស់ភាគហ៊ុន</span>
                                            <span className="text-slate-500 text-[8px] font-black uppercase">2- Non-Share Managers</span>
                                        </div>
                                        <div className="flex-1 flex text-[10px] font-black text-slate-500">
                                            <div className="w-[18%] border-r border-white/10"></div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center">-</div>
                                            <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4">-</div>
                                            <div className="flex-1 flex items-center justify-end px-4">-</div>
                                        </div>
                                    </div>
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <div key={`s2-${r}`} className="flex border-b border-white/10 h-9 hover:bg-white/[0.04] transition-colors">
                                            <div className="w-[30%] border-r border-white/10 px-4 flex items-center italic text-[10px] text-slate-400">Entry {r}</div>
                                            <div className="w-[18%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-center" /></div>
                                            <div className="w-[10%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-center" placeholder="0" /></div>
                                            <div className="w-[22%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-right" placeholder="0.00" /></div>
                                            <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-right" placeholder="0.00" /></div>
                                        </div>
                                    ))}

                                    {/* SUMMARY ROWS */}
                                    <div className="flex border-b border-white/10 h-10 bg-white/[0.04]">
                                        <div className="w-[48%] border-r border-white/10 px-4 flex flex-col justify-center bg-rose-500/5">
                                            <span className="text-white font-bold text-[10px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>៣- សរុបបុគ្គលិក-កម្មករ</span>
                                            <span className="text-slate-500 text-[8px] font-black uppercase">3- Total Staff</span>
                                        </div>
                                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-xs">0</div>
                                        <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white/50 text-[10px]">-</div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black text-white/50 text-[10px]">-</div>
                                    </div>
                                    <div className="flex h-10 bg-white/[0.04]">
                                        <div className="w-[48%] border-r border-white/10 px-4 flex flex-col justify-center bg-emerald-500/5">
                                            <span className="text-white font-bold text-[10px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>៤- បុគ្គលិក-កម្មករជាប់ពន្ធលើប្រាក់បៀវត្ស</span>
                                            <span className="text-slate-500 text-[8px] font-black uppercase">4- Taxable Salary Staff</span>
                                        </div>
                                        <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-emerald-400 text-xs">0</div>
                                        <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white/50 text-[10px]">-</div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black text-white/50 text-[10px]">-</div>
                                    </div>
                                </div>

                                {/* BOTTOM DECORATION */}
                                <div className="mt-20 flex flex-col items-center opacity-10">
                                    <div className="w-[1px] bg-white h-20" />
                                    <p className="text-white font-mono text-[22px] uppercase tracking-[1em] mt-8">Employee Census Schedule Locked</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 3 CONTENT - BALANCE SHEET ASSETS */}
                    {activePage === 3 && (
                        <div className="animate-fade-in relative px-4 py-8 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-[1400px] bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl mb-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងតុល្យការគិតត្រឹមការិយបរិច្ឆេទ</h2>
                                        <h1 className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">BALANCE SHEET AS AT</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-10 h-12 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-xl font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[28px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[22px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-8 h-[3px] bg-white opacity-40 mx-2 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-[1400px] grid grid-cols-2 gap-10 items-start">
                                {/* LEFT COLUMN: NON-CURRENT ASSETS */}
                                <div className="flex flex-col gap-6">
                                    {/* ASSETS TOTAL (A0) - HEADER-LIKE */}
                                    <div className="border border-white/10 h-16 bg-rose-500/10 rounded-2xl flex items-center font-black text-white shadow-xl overflow-hidden backdrop-blur-sm">
                                        <div className="w-[60%] border-r border-white/10 px-6">
                                            <span className="text-lg" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>I- ទ្រព្យសម្បត្តិ (A0 = A1 + A13)</span>
                                            <span className="text-[9px] block text-slate-500 uppercase tracking-wider">Total Assets</span>
                                        </div>
                                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 text-xl text-rose-400">
                                            {formData.a0_n || '-'}
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4 text-xl text-rose-400/70">
                                            {formData.a0_n1 || '-'}
                                        </div>
                                    </div>

                                    {/* NON-CURRENT ASSETS (A1-A12) */}
                                    <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                                        <div className="flex bg-white/[0.04] border-b border-white/10 h-12 items-center">
                                            <div className="w-[50%] border-r border-white/10 px-4">
                                                <span className="font-bold text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យសម្បត្តិមិនចរន្ត [A1 = សរុប(A2:A12)]</span>
                                                <span className="text-[8px] block font-black uppercase tracking-tight text-slate-500">Non-Current Assets</span>
                                            </div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase">Year N</div>
                                            <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase">Year N-1</div>
                                        </div>
                                        {[
                                            { ref: "A 2", kh: "ដីធ្លីរបស់សហគ្រាស", en: "Freehold land", key: "a2" },
                                            { ref: "A 3", kh: "ការរៀបចំនិងការកែលម្អដីធ្លី", en: "Land improvements", key: "a3" },
                                            { ref: "A 4", kh: "សំណង់អាគាររបស់សហគ្រាស", en: "Freehold buildings", key: "a4" },
                                            { ref: "A 5", kh: "សំណង់សាងសង់លើដីជួល", en: "Buildings on leasehold land", key: "a5" },
                                            { ref: "A 6", kh: "ទ្រព្យសកម្មរូបវន្តកំពុងដំណើការ", en: "Assets in progress", key: "a6" },
                                            { ref: "A 7", kh: "រោងចក្រ និងសម្ភារៈ", en: "Plant and machinery", key: "a7" },
                                            { ref: "A 8", kh: "កេរ្តិ៍ឈ្មោះអាជីវកម្ម និងពាណិជ្ជកម្ម", en: "Goodwill", key: "a8" },
                                            { ref: "A 9", kh: "ចំណាយបង្កើតសហគ្រាសដំបូង", en: "Formation expenses", key: "a9" },
                                            { ref: "A 10", kh: "ទ្រព្យសកម្មរូបវន្តនៃកិច្ចសន្យាជួល", en: "Leasehold assets", key: "a10" },
                                            { ref: "A 11", kh: "វិនិយោគក្នុងសហគ្រាសដទៃទៀត", en: "Other investments", key: "a11" },
                                            { ref: "A 12", kh: "ទ្រព្យសកម្មមិនចរន្តផ្សេងៗ", en: "Other non-current assets", key: "a12" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/[0.04] transition-colors">
                                                <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                                                    <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-700">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-xs">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-xs text-white/50">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: CURRENT ASSETS */}
                                <div className="flex flex-col gap-6">
                                    <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                                        <div className="flex bg-indigo-500/10 border-b border-white/10 h-12 items-center">
                                            <div className="w-[50%] border-r border-white/10 px-4">
                                                <span className="font-bold text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យសម្បត្តិចរន្ត [A13 = សរុប(A14:A27)]</span>
                                                <span className="text-[8px] block font-black uppercase text-slate-500 tracking-tight">Current Assets</span>
                                            </div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase">Year N</div>
                                            <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400 uppercase">Year N-1</div>
                                        </div>
                                        {[
                                            { ref: "A 14", kh: "ស្តុកវត្ថុធាតុដើម និងសម្ភារៈផ្គត់ផ្គង់", en: "Raw materials and supplies", key: "a14" },
                                            { ref: "A 15", kh: "ស្តុកទំនិញ", en: "Stocks of goods", key: "a15" },
                                            { ref: "A 16", kh: "ស្តុកផលិតផលសម្រេច", en: "Stocks of finished products", key: "a16" },
                                            { ref: "A 17", kh: "ផលិតផលកំពុងផលិត", en: "Products in progress", key: "a17" },
                                            { ref: "A 18", kh: "គណនីត្រូវទទួល / អតិថិជន", en: "Accounts receivable", key: "a18" },
                                            { ref: "A 19", kh: "គណនីត្រូវទទួលផ្សេងទៀត", en: "Other receivables", key: "a19" },
                                            { ref: "A 20", kh: "ចំណាយបង់ទុកមុន", en: "Prepaid expenses", key: "a20" },
                                            { ref: "A 21", kh: "សាច់ប្រាក់នៅក្នុងបេឡា", en: "Cash on hand", key: "a21" },
                                            { ref: "A 22", kh: "សាច់ប្រាក់នៅធនាគារ", en: "Cash in banks", key: "a22" },
                                            { ref: "A 23", kh: "ឥណទានពីការបង់ប្រាក់រំលស់នៃពន្ធ", en: "Income tax prepayment credit", key: "a23" },
                                            { ref: "A 24", kh: "ឥណទានអាករលើតម្លៃបន្ថែម", en: "VAT credit", key: "a24" },
                                            { ref: "A 25", kh: "ឥណទានពន្ធ-អាករដទៃទៀត", en: "Other taxes credit", key: "a25" },
                                            { ref: "A 26", kh: "ទ្រព្យសកម្មចរន្តផ្សេងៗ", en: "Other current assets", key: "a26" },
                                            { ref: "A 27", kh: "លទ្ធផលពីបរិវត្តរូបិយប័ណ្ណ", en: "Currency translation gain/loss", key: "a27" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-9 items-center last:border-0 hover:bg-white/[0.04] transition-colors">
                                                <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                                                    <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[7.5px] font-bold text-slate-500 uppercase">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[8.5px] font-black text-slate-700">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[11px]">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[11px] text-white/50">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 4 CONTENT - BALANCE SHEET LIABILITIES & EQUITY */}
                    {activePage === 4 && (
                        <div className="animate-fade-in relative px-4 py-8 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-[1400px] bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl mb-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងតុល្យការគិតត្រឹមការិយបរិច្ឆេទ (បន្ត)</h2>
                                        <h1 className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">BALANCE SHEET (LIABILITIES & EQUITY)</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded shadow-sm">
                                                    <span className="text-xl font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 flex items-center gap-6 bg-slate-900/80 p-4 border border-white/10 rounded-xl shadow-xl backdrop-blur-sm">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-1.5 p-1 bg-black/20 rounded-lg border border-white/5">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800 rounded shadow-inner">
                                                        <span className="text-lg font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-4 h-[3px] bg-white opacity-40 mx-1 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800 rounded shadow-inner">
                                                        <span className="text-lg font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-[1400px] grid grid-cols-2 gap-10 items-start">
                                {/* LEFT COLUMN: EQUITY */}
                                <div className="flex flex-col gap-6">
                                    <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                                        <div className="flex bg-white/[0.04] border-b border-white/10 h-12 items-center">
                                            <div className="w-[50%] border-r border-white/10 px-4">
                                                <span className="font-bold text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មូលនិធិ/ឧបត្ថម្ភទ្រព្យ [A29 = សរុប(A30:A36)]</span>
                                                <span className="text-[8px] block font-black uppercase tracking-tight text-slate-500">Equity</span>
                                            </div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">Year N</div>
                                            <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400">Year N-1</div>
                                        </div>
                                        {[
                                            { ref: "A 30", kh: "មូលធន/មូលធនភាគហ៊ុន", en: "Capital / Share capital", key: "a30" },
                                            { ref: "A 31", kh: "តម្លៃលើសការលក់ភាគហ៊ុន", en: "Share premium", key: "a31" },
                                            { ref: "A 32", kh: "មូលធនបម្រុងតាមច្បាប់", en: "Legal reserve", key: "a32" },
                                            { ref: "A 33", kh: "លាភវាយតម្លៃឡើងវិញ", en: "Revaluation gain", key: "a33" },
                                            { ref: "A 34", kh: "បម្រុងផ្សេងៗ", en: "Other reserves", key: "a34" },
                                            { ref: "A 35", kh: "ចំណេញ/ខាតពីមុន", en: "Result forward", key: "a35" },
                                            { ref: "A 36", kh: "ចំណេញ/ខាតគ្រានេះ", en: "Period result", key: "a36" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/[0.04] transition-colors">
                                                <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                                                    <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-700">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[11px]">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[11px] text-white/50">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex bg-emerald-500/10 h-12 items-center font-black border-t border-white/10">
                                            <div className="w-[60%] border-r border-white/10 px-6 text-xs text-emerald-400">TOTAL EQUITY (A29)</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 text-emerald-400 text-sm">{formData.a29_n || '-'}</div>
                                            <div className="flex-1 flex items-center justify-end px-4 text-emerald-400/50 text-sm">{formData.a29_n1 || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                                {/* RIGHT COLUMN: LIABILITIES */}
                                <div className="flex flex-col gap-6">
                                    {/* NON-CURRENT LIABILITIES */}
                                    <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                                        <div className="flex bg-rose-500/5 border-b border-white/10 h-11 items-center">
                                            <div className="w-[50%] border-r border-white/10 px-4">
                                                <span className="font-bold text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បំណុលមិនចរន្ត [A37 = សរុប(A38:A41)]</span>
                                                <span className="text-[8px] block font-black uppercase text-slate-500 tracking-tight">Non-Current Liabilities</span>
                                            </div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">N</div>
                                            <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400">N-1</div>
                                        </div>
                                        {[
                                            { ref: "A 38", kh: "បំណុលភាគីពាក់ព័ន្ធ", en: "Related parties", key: "a38" },
                                            { ref: "A 39", kh: "បំណុលធនាគារ/ក្រៅ", en: "Banks/External", key: "a39" },
                                            { ref: "A 40", kh: "សំវិធានធន", en: "Provisions", key: "a40" },
                                            { ref: "A 41", kh: "បំណុលវែងផ្សេងៗ", en: "Other non-current", key: "a41" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-9 items-center last:border-0 hover:bg-white/[0.04] transition-colors">
                                                <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                                                    <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[7.5px] font-bold text-slate-500 uppercase">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[8.5px] font-black text-slate-700">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[11px]">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[11px] text-white/50">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CURRENT LIABILITIES */}
                                    <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                                        <div className="flex bg-rose-500/10 border-b border-white/10 h-11 items-center">
                                            <div className="w-[50%] border-r border-white/10 px-4">
                                                <span className="font-bold text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បំណុលចរន្ត [A42 = សរុប(A43:A50)]</span>
                                                <span className="text-[8px] block font-black uppercase text-slate-500 tracking-tight">Current Liabilities</span>
                                            </div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">N</div>
                                            <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400">N-1</div>
                                        </div>
                                        {[
                                            { ref: "A 43", kh: "ឥណទានវិបារូប៍ក្នុងស្រុក", en: "Local bank overdraft", key: "a43" },
                                            { ref: "A 44", kh: "បំណុលមានការប្រាក់", en: "Interest bearing debt", key: "a44" },
                                            { ref: "A 45", kh: "ត្រូវសងភាគីពាក់ព័ន្ធ", en: "Payable to related parties", key: "a45" },
                                            { ref: "A 46", kh: "គណនីត្រូវសង / អ្នកផ្គត់ផ្គង់", en: "Accounts payable", key: "a46" },
                                            { ref: "A 47", kh: "បំណុលបង់ទុកមុន", en: "Prepaid liabilities", key: "a47" },
                                            { ref: "A 48", kh: "បំណុលពន្ធ-អាករ", en: "Taxes payable", key: "a48" },
                                            { ref: "A 49", kh: "បំណុលចរន្តផ្សេងៗ", en: "Other current liabilities", key: "a49" },
                                            { ref: "A 50", kh: "លទ្ធផលពីប្តូររូបិយប័ណ្ណ", en: "Currency translation gain/loss", key: "a50" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-9 items-center last:border-0 hover:bg-white/[0.04] transition-colors">
                                                <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                                                    <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[7.5px] font-bold text-slate-500 uppercase">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[8.5px] font-black text-slate-700">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[11px]">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[11px] text-white/50">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* GRAND TOTAL LIABILITIES & EQUITY (A28) */}
                                    <div className="border border-white/10 h-16 bg-emerald-500/10 rounded-2xl flex items-center font-black text-white shadow-xl overflow-hidden backdrop-blur-sm">
                                        <div className="w-[60%] border-r border-white/10 px-6">
                                            <span className="text-lg" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>II- បំណុល និងបុព្វលាភ (A28 = A29 + A37 + A42)</span>
                                            <span className="text-[9px] block text-slate-400 uppercase tracking-wider">Total Liabilities & Equity</span>
                                        </div>
                                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 text-xl text-emerald-400">
                                            {formData.a28_n || '-'}
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4 text-xl text-emerald-400/70">
                                            {formData.a28_n1 || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 5 CONTENT - PROFIT & LOSS */}
                    {activePage === 5 && (
                        <div className="animate-fade-in relative px-4 py-8 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-[1400px] bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl mb-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍លទ្ធផលសម្រាប់គ្រាជាប់ពន្ធ</h2>
                                        <h1 className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">INCOME STATEMENT FOR THE YEAR ENDED</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800/80 rounded shadow-sm">
                                                    <span className="text-xl font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 flex items-center gap-6 bg-slate-900/80 p-4 border border-white/10 rounded-xl shadow-xl backdrop-blur-sm">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-1.5 p-1 bg-black/20 rounded-lg border border-white/5">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800 rounded shadow-inner">
                                                        <span className="text-lg font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-4 h-[3px] bg-white opacity-40 mx-1 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-8 h-10 border border-white/10 flex items-center justify-center bg-slate-800 rounded shadow-inner">
                                                        <span className="text-lg font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-[1400px] grid grid-cols-2 gap-10 items-start">
                                {/* LEFT COLUMN: REVENUES & COGS */}
                                <div className="flex flex-col gap-6">
                                    {/* SECTION III: OPERATING REVENUES */}
                                    <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                                        <div className="flex bg-white/[0.04] border-b border-white/10 h-12 items-center">
                                            <div className="w-[50%] border-r border-white/10 px-4">
                                                <span className="font-bold text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>III- ចំណូលប្រតិបត្តិការ [B0 = សរុប(B1:B3)]</span>
                                                <span className="text-[8px] block font-black uppercase text-slate-500">Operating Revenues</span>
                                            </div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">Year N</div>
                                            <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400">Year N-1</div>
                                        </div>
                                        {[
                                            { ref: "B 1", kh: "ការលក់ផលិតផល", en: "Sales of products", key: "b1" },
                                            { ref: "B 2", kh: "ការលក់ទំនិញ", en: "Sales of goods", key: "b2" },
                                            { ref: "B 3", kh: "ការផ្គត់ផ្គង់សេវា", en: "Supplies of services", key: "b3" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/[0.04] transition-colors">
                                                <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                                                    <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-700">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-white/50">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* SECTION IV: COGS & GROSS PROFIT */}
                                    <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                                        <div className="flex bg-white/[0.04] border-b border-white/10 h-12 items-center">
                                            <div className="w-[50%] border-r border-white/10 px-4">
                                                <span className="font-bold text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>IV- ថ្លៃដើមផលិតផល និង Gross Profit</span>
                                                <span className="text-[8px] block font-black uppercase text-slate-500">COGS & Gross Profit</span>
                                            </div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400">Year N</div>
                                            <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-slate-400">Year N-1</div>
                                        </div>
                                        {[
                                            { ref: "B 4", kh: "ថ្លៃដើមលក់ផលិតផល (ផលិត)", en: "COPS (Production)", key: "b4" },
                                            { ref: "B 5", kh: "ថ្លៃដើមលក់ទំនិញ (មិនមែនផលិត)", en: "COGS (Non-production)", key: "b5" },
                                            { ref: "B 6", kh: "ថ្លៃដើមសេវាផ្គត់ផ្គង់", en: "Cost of services supplied", key: "b6" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-10 items-center hover:bg-white/[0.04] transition-colors">
                                                <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                                                    <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-700">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-white/50">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex bg-rose-500/10 border-t border-white/10 h-12 items-center">
                                            <div className="w-[50%] border-r border-white/10 px-4">
                                                <span className="font-bold text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លទ្ធផលដុល (B7 = B0 - B4 - B5 - B6)</span>
                                                <span className="text-[8px] block font-black uppercase text-slate-400">Gross Profit (B7)</span>
                                            </div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-400">B 7</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-rose-400">$ 0.00</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-rose-400/50">$ 0.00</div>
                                        </div>
                                    </div>

                                    {/* SUBSIDIARY REVENUES (B8:B11) */}
                                    <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                                        <div className="flex bg-white/[0.04] border-b border-white/10 h-10 items-center">
                                            <div className="w-[50%] border-r border-white/10 px-4">
                                                <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលបន្ទាប់បន្សំ [B8 = សរុប(B9:B11)]</span>
                                                <span className="text-[8px] block font-black uppercase text-slate-500">Subsidiary Revenues</span>
                                            </div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">B 8</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-sm">$ 0.00</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-sm text-white/50">$ 0.00</div>
                                        </div>
                                        {[
                                            { ref: "B 9", kh: "ចំណូលពីការដូរភតិសន្យា", en: "Rental fees", key: "b9" },
                                            { ref: "B 10", kh: "ចំណូលពីសិទ្ធិប្រើប្រាស់", en: "Royalties", key: "b10" },
                                            { ref: "B 11", kh: "ចំណូលបន្ទាប់បន្សំផ្សេងទៀត", en: "Other subsidiary", key: "b11" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-9 items-center last:border-0 hover:bg-white/[0.04] transition-colors">
                                                <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                                                    <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[7.5px] font-bold text-slate-500 uppercase">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[8.5px] font-black text-slate-700">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[11px]">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[11px] text-white/50">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* OTHER REVENUES (B12:B21) */}
                                    <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                                        <div className="flex bg-white/[0.04] border-b border-white/10 h-10 items-center">
                                            <div className="w-[50%] border-r border-white/10 px-4">
                                                <span className="font-bold text-[11px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលផ្សេងៗ [B12 = សរុប(B13:B21)]</span>
                                                <span className="text-[8px] block font-black uppercase text-slate-500">Other Revenues</span>
                                            </div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">B 12</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-sm">$ 0.00</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-sm text-white/50">$ 0.00</div>
                                        </div>
                                        {[
                                            { ref: "B 13", kh: "ជំនួយ/ឧបត្ថម្ភ", en: "Grants/Subsidies", key: "b13" },
                                            { ref: "B 14", kh: "ភាគលាភ ទទួល ឬត្រូវទទួល", en: "Dividends", key: "b14" },
                                            { ref: "B 15", kh: "ការប្រាក់ ទទួល ឬត្រូវទទួល", en: "Interests", key: "b15" },
                                            { ref: "B 16", kh: "លាភពីការលក់ទ្រព្យសកម្ម", en: "Gain on disposal", key: "b16" },
                                            { ref: "B 17", kh: "លាភពីការលក់មូលបត្រ", en: "Gain on securities", key: "b17" },
                                            { ref: "B 18", kh: "ចំណែកប្រាក់ចំណេញ (JV)", en: "Profit share JV", key: "b18" },
                                            { ref: "B 19", kh: "លាភប្តូរប្រាក់ (សម្រេច)", en: "Realized forex gain", key: "b19" },
                                            { ref: "B 20", kh: "លាភប្តូរប្រាក់ (មិនទាន់)", en: "Unrealized forex gain", key: "b20" },
                                            { ref: "B 21", kh: "ចំណូលផ្សេងទៀត", en: "Other revenues", key: "b21" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-9 items-center last:border-0 hover:bg-white/[0.04] transition-colors">
                                                <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                                                    <span className="font-bold text-[10px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[7.5px] font-bold text-slate-500 uppercase">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[8.5px] font-black text-slate-700">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[11px]">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[11px] text-white/50">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: OPERATING EXPENSES */}
                                <div className="flex flex-col gap-6">
                                    <div className="border border-white/10 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                                        <div className="flex bg-indigo-500/10 border-b border-white/10 h-12 items-center">
                                            <div className="w-[50%] border-r border-white/10 px-4">
                                                <span className="font-bold text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>V- ចំណាយប្រតិបត្តិការសរុប [B22 = សរុប(B23:B41)]</span>
                                                <span className="text-[8px] block font-black uppercase text-slate-500">Total Operating Expenses</span>
                                            </div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">B 22</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-sm">$ 0.00</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-sm text-white/50">$ 0.00</div>
                                        </div>
                                        <div className="grid grid-cols-1">
                                            {[
                                                { ref: "B 23", kh: "ចំណាយប្រាក់បៀវត្ស", en: "Salary expenses", key: "b23" },
                                                { ref: "B 24", kh: "ចំណាយប្រេង ហ្គាស អគ្គិសនី និងទឹក", en: "Fuel, gas, utilities", key: "b24" }
                                            ].map((row, idx) => (
                                                <div key={idx} className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/[0.04] transition-colors">
                                                    <div className="w-[50%] border-r border-white/10 px-4 flex flex-col">
                                                        <span className="font-bold text-[10.5px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="text-[8px] font-bold text-slate-500 uppercase">{row.en}</span>
                                                    </div>
                                                    <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[9px] font-black text-slate-700">{row.ref}</div>
                                                    <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                                        {formData[row.key + '_n'] || '-'}
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-end px-4 font-black text-white/50">
                                                        {formData[row.key + '_n1'] || '-'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SECTION VI: NET RESULT */}
                                    <div className="border border-white/10 h-16 bg-emerald-500/10 rounded-2xl flex items-center font-black text-white shadow-xl overflow-hidden backdrop-blur-sm">
                                        <div className="w-[60%] border-r border-white/10 px-6">
                                            <span className="text-lg" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>VI- លទ្ធផលជារួម (ចំណេញ/ខាត) : B42</span>
                                            <span className="text-[9px] block text-slate-400 uppercase tracking-wider">Overall Result (Net Profit / Loss)</span>
                                        </div>
                                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 text-xl text-emerald-400">$ 0.00</div>
                                        <div className="flex-1 flex items-center justify-end px-4 text-xl text-emerald-400/50">$ 0.00</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 6 CONTENT - EXPENSES & NET RESULT */}
                    {activePage === 6 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-7xl bg-white/5 backdrop-blur-md border-[2px] border-white p-8 shadow-2xl mb-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-[136px] font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍លទ្ធផលសម្រាប់គ្រាជាប់ពន្ធ (បន្ត)</h2>
                                        <h1 className="text-[112px] font-black text-white uppercase tracking-tighter">INCOME STATEMENT (CONTINUED)</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-10 h-12 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-xl font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[28px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[22px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-8 h-[3px] bg-white opacity-40 mx-2 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-[1600px] grid grid-cols-2 gap-10 items-start">
                                {/* LEFT COLUMN: FURTHER OPERATING EXPENSES */}
                                <div className="flex flex-col gap-8">
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-indigo-500/10 border-b-[2px] border-white h-14 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយប្រតិបត្តិការ (បន្ត)</span>
                                                <span className="text-[22px] block font-black uppercase tracking-tight">Operating Expenses (Continued)</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">REF</div>
                                            <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[24px] font-bold">YEAR N</div>
                                            <div className="flex-1 flex items-center justify-center text-[24px] font-bold">YEAR N-1</div>
                                        </div>
                                        {[
                                            { ref: "B 25", kh: "ចំណាយធ្វើដំណើរ និងស្នាក់នៅ", en: "Travelling and accommodation", key: "b25" },
                                            { ref: "B 26", kh: "ចំណាយដឹកជញ្ជូន", en: "Transportation expenses", key: "b26" },
                                            { ref: "B 27", kh: "ចំណាយជួល", en: "Rental expenses", key: "b27" },
                                            { ref: "B 28", kh: "ចំណាយជួសជុល និងថែទាំ", en: "Repair and maintenance", key: "b28" },
                                            { ref: "B 29", kh: "ចំណាយកម្សាន្ត", en: "Entertainment expenses", key: "b29" },
                                            { ref: "B 30", kh: "កម្រៃជើងសារ ឃោសនា និងលក់", en: "Commission, ads, and selling", key: "b30" },
                                            { ref: "B 31", kh: "ចំណាយពន្ធ-អាករផ្សេងៗ", en: "Other tax expenses", key: "b31" },
                                            { ref: "B 32", kh: "ចំណាយលើអំណោយ", en: "Donation expenses", key: "b32" },
                                            { ref: "B 33", kh: "កម្រៃសេវាគ្រប់គ្រង ប្រឹក្សា បច្ចេកទេស", en: "Management & technical fees", key: "b33" },
                                            { ref: "B 34", kh: "ចំណាយលើសួយសារ", en: "Royalty expenses", key: "b34" },
                                            { ref: "B 35", kh: "ចំណាយលើបំណុលអាក្រក់", en: "Written-off bad debts", key: "b35" },
                                            { ref: "B 36", kh: "ចំណាយរំលស់", en: "Amortisation/Depreciation", key: "b36" },
                                            { ref: "B 37", kh: "ការកើនឡើង/ថយចុះ នូវសំវិធានធន", en: "Incr/decr in provisions", key: "b37" },
                                            { ref: "B 38", kh: "ខាតពីការបោះបង់ទ្រព្យសកម្មថេរ", en: "Loss on disposal of assets", key: "b38" },
                                            { ref: "B 39", kh: "ខាតពីការប្តូរប្រាក់ (សម្រេច)", en: "Realised currency loss", key: "b39" },
                                            { ref: "B 40", kh: "ខាតពីការប្តូរប្រាក់ (មិនទាន់សម្រេច)", en: "Unrealised currency loss", key: "b40" },
                                            { ref: "B 41", kh: "ចំណាយផ្សេងៗ", en: "Other expenses", key: "b41" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-11 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[28px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[20px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[20px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[28px]">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[28px]">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: SUMMARY & NET RESULT */}
                                <div className="flex flex-col gap-8">
                                    {/* SECTION VI: PROFIT FROM OPERATIONS */}
                                    <div className="border-[3px] border-white h-24 bg-indigo-500/20 flex items-center font-black text-white shadow-2xl">
                                        <div className="w-[60%] border-r-[2px] border-white px-8">
                                            <span className="text-[40px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញ(ខាត) ពីប្រតិបត្តិការ (B42)</span>
                                            <span className="text-[26px] block opacity-80 uppercase">Profit/Loss from Operations</span>
                                        </div>
                                        <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-6 text-[40px]">
                                            {formData.b42_n || '-'}
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-6 text-[40px]">
                                            {formData.b42_n1 || '-'}
                                        </div>
                                    </div>

                                    {/* SECTION VII: INTEREST EXPENSES */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-rose-500/10 border-b-[2px] border-white h-14 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយការប្រាក់</span>
                                                <span className="text-[22px] block font-black uppercase">Interest Expenses</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[22px] font-bold">N</div>
                                            <div className="flex-1 flex items-center justify-center text-[22px] font-bold">N-1</div>
                                        </div>
                                        {[
                                            { ref: "B 43", kh: "ចំណាយការប្រាក់បង់ឱ្យនិវាសនជន", en: "Interest paid to residents", key: "b43" },
                                            { ref: "B 44", kh: "ចំណាយការប្រាក់បង់ឱ្យអនិវាសនជន", en: "Interest paid to non-residents", key: "b44" },
                                            { ref: "B 45", kh: "ចំណាយការប្រាក់លូត", en: "Unwinding interest expenses", key: "b45" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[30px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[22px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* SECTION VIII: PROFIT BEFORE TAX */}
                                    <div className="border-[2px] border-white h-20 bg-amber-500/10 flex items-center font-black text-white shadow-xl">
                                        <div className="w-[60%] border-r-[2px] border-white px-8">
                                            <span className="text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញ(ខាត) មុនបង់ពន្ធ (B46)</span>
                                            <span className="text-[24px] block opacity-80 uppercase">Profit(Loss) Before Tax</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px]">B 46</div>
                                        <div className="w-[15%] border-r border-white/10 flex items-center justify-end px-4">
                                            {formData.b46_n || '-'}
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4">
                                            {formData.b46_n1 || '-'}
                                        </div>
                                    </div>

                                    {/* SECTION IX: INCOME TAX */}
                                    <div className="border-[2px] border-white h-20 bg-rose-500/10 flex items-center font-black text-white shadow-xl">
                                        <div className="w-[60%] border-r-[2px] border-white px-8">
                                            <span className="text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ពន្ធលើប្រាក់ចំណូល (B47)</span>
                                            <span className="text-[24px] block opacity-80 uppercase">Income Tax</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px]">B 47</div>
                                        <div className="w-[15%] border-r border-white/10 flex items-center justify-end px-4">
                                            {formData.b47_n || '-'}
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4">
                                            {formData.b47_n1 || '-'}
                                        </div>
                                    </div>

                                    {/* SECTION X: NET PROFIT AFTER TAX */}
                                    <div className="border-[4px] border-white h-28 bg-emerald-500/30 flex items-center font-black text-white shadow-3xl">
                                        <div className="w-[60%] border-r-[2px] border-white px-8">
                                            <span className="text-[52px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញ(ខាត) ក្រោយបង់ពន្ធ (B48)</span>
                                            <span className="text-[32px] block opacity-80 uppercase">Net Profit After Tax</span>
                                        </div>
                                        <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-6 text-[56px] text-emerald-400">
                                            {formData.b48_n || '-'}
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-6 text-[56px] text-emerald-400">
                                            {formData.b48_n1 || '-'}
                                        </div>
                                    </div>

                                    <div className="mt-4 p-4 bg-white/5 border border-white/20 rounded-lg text-[22px] italic text-white/60 leading-relaxed">
                                        * ចំណាយការប្រាក់មិនមានការទូទាត់ជាក់ស្តែងដែលតម្រូវឱ្យកត់ត្រាស្របតាមស្តង់ដាររបាយការណ៍ហិរញ្ញវត្ថុអន្តរជាតិ (CIFRS) <br />
                                        * Interest Expense without actual payment but recorded by the CIFRS requirement.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 7 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-7xl bg-white/5 backdrop-blur-md border-[2px] border-white p-8 shadow-2xl mb-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-[136px] font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្លៃដើមផលិតផលបានលក់</h2>
                                        <h1 className="text-[112px] font-black text-white uppercase tracking-tighter">COSTS OF PRODUCTS SOLD (PRODUCTION ENTERPRISE)</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-10 h-12 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-xl font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[28px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[22px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-8 h-[3px] bg-white opacity-40 mx-2 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-[1600px] grid grid-cols-2 gap-10 items-start">
                                {/* LEFT COLUMN: RAW MATERIALS & OTHER PRODUCTION COSTS */}
                                <div className="flex flex-col gap-8">
                                    {/* SECTION: RAW MATERIALS & SUPPLIES */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-indigo-500/10 border-b-[2px] border-white h-14 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>វត្ថុធាតុដើម និងសម្ភារៈផ្គត់ផ្គង់</span>
                                                <span className="text-[22px] block font-black uppercase">Raw Materials and Supplies</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[22px] font-bold">YEAR N</div>
                                            <div className="flex-1 flex items-center justify-center text-[22px] font-bold">YEAR N-1</div>
                                        </div>
                                        {[
                                            { ref: "C 1", kh: "ស្តុកវត្ថុធាតុដើម និងសម្ភារៈផ្គត់ផ្គង់ដើមគ្រា", en: "Stock at the beginning of the period", key: "c1" },
                                            { ref: "C 2", kh: "ចំណាយទិញវត្ថុធាតុដើម និងសម្ភារៈផ្គត់ផ្គង់ក្នុងគ្រា", en: "Purchases during the period", key: "c2" },
                                            { ref: "C 3", kh: "ចំណាយផ្សេងៗទាក់ទងដល់ការទិញ (១)", en: "Other purchase expenses (1)", key: "c3" },
                                            { ref: "C 4", kh: "សរុបវត្ថុធាតុដើម និងសម្ភារៈសម្រាប់ផលិត", en: "Total materials available for production", key: "c4", isTotal: true },
                                            { ref: "C 5", kh: "ដក៖ ស្តុកវត្ថុធាតុដើម និងសម្ភារៈចុងគ្រា", en: "Less: Stock at the end of the period", key: "c5" },
                                            { ref: "C 6", kh: "ចំណាយថ្លៃវត្ថុធាតុដើមបានប្រើប្រាស់", en: "Materials and supplies used", key: "c6", highlight: true }
                                        ].map((row, idx) => (
                                            <div key={idx} className={`flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors ${row.isTotal ? 'bg-white/5 font-black' : ''} ${row.highlight ? 'bg-indigo-500/10 font-bold border-t border-white/30' : ''}`}>
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[28px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[20px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[22px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* SECTION: OTHER PRODUCTION COSTS */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-rose-500/10 border-b-[2px] border-white h-14 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយផ្សេងៗក្នុងផលិតកម្ម</span>
                                                <span className="text-[22px] block font-black uppercase">Other Production Costs (C7)</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[22px] font-bold">YEAR N</div>
                                            <div className="flex-1 flex items-center justify-center text-[22px] font-bold">YEAR N-1</div>
                                        </div>
                                        {[
                                            { ref: "C 8", kh: "ប្រាក់បៀវត្សអ្នកគ្រប់គ្រង និងកម្មករផលិតកម្ម", en: "Salaries for production staff", key: "c8" },
                                            { ref: "C 9", kh: "រំលស់ទ្រព្យសកម្មអរូបីយៈ", en: "Amortization of intangible assets", key: "c9" },
                                            { ref: "C 10", kh: "ប្រេងឥន្ធនៈ ទឹក និងថាមពល", en: "Fuel, water and power", key: "c10" },
                                            { ref: "C 11", kh: "ការវេចខ្ចប់", en: "Packaging", key: "c11" },
                                            { ref: "C 12", kh: "រំលស់រោងចក្រ គ្រឿងម៉ាស៊ីន និងបរិក្ខារ", en: "Depreciation of plants and equipment", key: "c12" },
                                            { ref: "C 13", kh: "សេវាម៉ៅការបន្ត និងសេវាផលិតដទៃ", en: "Sub-contract & production services", key: "c13" },
                                            { ref: "C 14", kh: "ចំណាយផ្សេងៗក្នុងផលិតកម្ម", en: "Other manufacturing costs", key: "c14" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-12 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[26px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[20px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[20px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex bg-rose-500/20 h-14 items-center font-black border-t-[2px] border-white">
                                            <div className="w-[60%] border-r-[2px] border-white px-8 text-[32px]">TOTAL OTHER COSTS (C7)</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 text-rose-400">{formData.c7_n || '-'}</div>
                                            <div className="flex-1 flex items-center justify-end px-4 text-rose-400">{formData.c7_n1 || '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: WIP, FINISHED PRODUCTS & TOTAL COPS */}
                                <div className="flex flex-col gap-8">
                                    {/* SECTION: WORK IN PROGRESS */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-amber-500/10 border-b-[2px] border-white h-14 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការងារកំពុងដំណើរការ (WIP)</span>
                                                <span className="text-[22px] block font-black uppercase">Work In Progress</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[22px] font-bold">YEAR N</div>
                                            <div className="flex-1 flex items-center justify-center text-[22px] font-bold">YEAR N-1</div>
                                        </div>
                                        {[
                                            { ref: "C 15", kh: "ការងារកំពុងដំណើរការនៅដើមគ្រា", en: "Work in progress at the beginning", key: "c15" },
                                            { ref: "C 16", kh: "ដក៖ ការងារកំពុងដំណើរការនៅចុងគ្រា", en: "Less: Work in progress at the end", key: "c16" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[28px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[22px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[22px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* SECTION: TOTAL PRODUCTION COSTS (C17) */}
                                    <div className="border-[3px] border-white h-24 bg-indigo-500/20 flex items-center font-black text-white shadow-2xl">
                                        <div className="w-[60%] border-r-[2px] border-white px-8">
                                            <span className="text-[40px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុបចំណាយថ្លៃដើមផលិតកម្ម (C17)</span>
                                            <span className="text-[26px] block opacity-80 uppercase">Total Production Costs (C17 = C6 + C7 + C15 - C16)</span>
                                        </div>
                                        <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-6 text-[44px]">
                                            {formData.c17_n || '-'}
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-6 text-[44px]">
                                            {formData.c17_n1 || '-'}
                                        </div>
                                    </div>

                                    {/* SECTION: FINISHED PRODUCTS */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl mt-4">
                                        <div className="flex bg-emerald-500/10 border-b-[2px] border-white h-14 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ផលិតផលសម្រេច</span>
                                                <span className="text-[22px] block font-black uppercase">Finished Products</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[22px] font-bold">YEAR N</div>
                                            <div className="flex-1 flex items-center justify-center text-[22px] font-bold">YEAR N-1</div>
                                        </div>
                                        {[
                                            { ref: "C 18", kh: "ស្តុកផលិតផលសម្រេចនៅដើមគ្រា", en: "Stock of finished products at the beginning", key: "c18" },
                                            { ref: "C 19", kh: "ដក៖ ស្តុកផលិតផលសម្រេចនៅចុងគ្រា", en: "Less: Stock of finished products at the end", key: "c19" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[28px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[22px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[22px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* SECTION: FINAL COST OF PRODUCTS SOLD (C20) */}
                                    <div className="border-[4px] border-white h-28 bg-emerald-500/30 flex items-center font-black text-white shadow-3xl">
                                        <div className="w-[60%] border-r-[2px] border-white px-8">
                                            <span className="text-[52px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្លៃដើមផលិតផលបានលក់ (C20)</span>
                                            <span className="text-[32px] block opacity-80 uppercase">Cost of Finished Products Sold (C17 + C18 - C19)</span>
                                        </div>
                                        <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-6 text-[56px] text-emerald-400">
                                            {formData.c20_n || '-'}
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-6 text-[56px] text-emerald-400">
                                            {formData.c20_n1 || '-'}
                                        </div>
                                    </div>

                                    <div className="mt-4 p-4 bg-white/5 border border-white/20 rounded-lg text-[20px] italic text-white/60 leading-relaxed">
                                        (១) ចំណាយផ្សេងៗទាក់ទងដល់ការទិញវត្ថុធាតុដើម ឬសម្ភារៈផ្គត់ផ្គង់មានជាអាទិ៍៖ ដឹកជញ្ជូន ពន្ធអាករពេលនាំចូល លើកដាក់ រត់ការ... <br />
                                        (1)- Other expenses related to purchases such as transportation, import duties, lift-on/off, and clearance services...
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 8 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-7xl bg-white/5 backdrop-blur-md border-[2px] border-white p-8 shadow-2xl mb-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-[136px] font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្លៃដើមទំនិញបានលក់</h2>
                                        <h1 className="text-[112px] font-black text-white uppercase tracking-tighter">COSTS OF GOODS SOLD (NON-PRODUCTION ENTERPRISE)</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-10 h-12 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-xl font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[28px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[22px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-8 h-[3px] bg-white opacity-40 mx-2 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-5xl flex flex-col gap-10">
                                {/* MAIN TABLE SECTION */}
                                <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 backdrop-blur-sm shadow-2xl">
                                    <div className="flex bg-indigo-500/20 border-b-[2px] border-white h-16 items-center">
                                        <div className="w-[50%] border-r-[2px] border-white px-6">
                                            <span className="font-bold text-[40px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                                            <span className="text-[24px] block font-black uppercase tracking-tight">Description</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">REF</div>
                                        <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[24px] font-bold">YEAR N</div>
                                        <div className="flex-1 flex items-center justify-center text-[24px] font-bold">YEAR N-1</div>
                                    </div>

                                    {[
                                        { ref: "D 1", kh: "ស្តុកទំនិញដើមគ្រា", en: "Stock of goods at the beginning of the period", key: "d1" },
                                        { ref: "D 2", kh: "ចំណាយទិញទំនិញក្នុងគ្រា", en: "Purchases of goods during the period", key: "d2" },
                                        {
                                            ref: "D 3",
                                            kh: "ចំណាយផ្សេងៗទាក់ទងដល់ការទិញទំនិញ [D3 = សរុប(D4:D6)]",
                                            en: "Other Expenses Related to Purchasing of Goods [D3 = Sum(D4:D6)]",
                                            key: "d3",
                                            isHeader: true
                                        },
                                        { ref: "D 4", kh: "ចំណាយដឹកជញ្ជូនចូល", en: "Transportation-in expenses", key: "d4", indent: true },
                                        { ref: "D 5", kh: "ចំណាយបង់ពន្ធគយនាំចូល និងពន្ធដទៃទៀតដែលជាបន្ទុករបស់សហគ្រាស", en: "Import duties and other taxes as enterprise's expenses", key: "d5", indent: true },
                                        { ref: "D 6", kh: "ចំណាយដទៃទៀតក្រៅពី D4 និង D5", en: "Other expenses excluding D4 and D5", key: "d6", indent: true },
                                        {
                                            ref: "D 7",
                                            kh: "សរុបចំណាយថ្លៃដើមទំនិញ [D7 = (D1 + D2 + D3)]",
                                            en: "Total Costs of Goods [D7 = (D1 + D2 + D3)]",
                                            key: "d7",
                                            isTotal: true
                                        },
                                        { ref: "D 8", kh: "ដក៖ ស្តុកទំនិញនៅចុងគ្រា", en: "Less: Stock of goods at the end of the period", key: "d8" },
                                        {
                                            ref: "D 9",
                                            kh: "ថ្លៃដើមទំនិញដែលបានលក់ [D9 = (D7 - D8)]",
                                            en: "Costs of Goods Sold [(D9 = D7 - D8)]",
                                            key: "d9",
                                            isGrandTotal: true
                                        },
                                    ].map((row, idx) => (
                                        <div key={idx} className={`flex border-b border-white/10 h-16 items-center last:border-0 hover:bg-white/5 transition-colors 
                                            ${row.isHeader ? 'bg-white/10 font-bold' : ''} 
                                            ${row.isTotal ? 'bg-indigo-500/10 font-black' : ''}
                                            ${row.isGrandTotal ? 'bg-emerald-500/20 h-24 border-t-[3px] border-white font-black' : ''}`}>

                                            <div className={`w-[50%] border-r-[2px] border-white px-6 flex flex-col ${row.indent ? 'pl-12' : ''}`}>
                                                <span className={`${row.isGrandTotal ? 'text-[44px]' : row.isTotal ? 'text-[36px]' : 'text-[30px]'} font-bold leading-tight`} style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className={`${row.isGrandTotal ? 'text-[28px]' : 'text-[22px]'} font-bold opacity-70`}>{row.en}</span>
                                            </div>

                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px] font-black">{row.ref}</div>

                                            <div className={`w-[20%] border-r border-white/10 flex items-center justify-end px-6 font-black ${row.isGrandTotal ? 'text-[48px] text-emerald-400' : 'text-[32px]'}`}>
                                                {formData[row.key + '_n'] || '-'}
                                            </div>

                                            <div className={`flex-1 flex items-center justify-end px-6 font-black ${row.isGrandTotal ? 'text-[48px] text-emerald-400' : 'text-[32px]'}`}>
                                                {formData[row.key + '_n1'] || '-'}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* DECORATIVE FOOTER */}
                                <div className="flex justify-between items-center opacity-30 mt-10">
                                    <div className="text-[20px] uppercase tracking-[0.3em] font-black">Non-Production Schedule</div>
                                    <div className="w-1/2 h-[1px] bg-white"></div>
                                    <div className="text-[20px] uppercase tracking-[0.3em] font-black px-4">Page 08</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 9 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-7xl bg-white/5 backdrop-blur-md border-[2px] border-white p-8 shadow-2xl mb-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-[136px] font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការគណនាពន្ធលើប្រាក់ចំណូល</h2>
                                        <h1 className="text-[112px] font-black text-white uppercase tracking-tighter">TABLE OF INCOME TAX CALCULATION</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-10 h-12 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-xl font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[28px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[22px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-8 h-[3px] bg-white opacity-40 mx-2 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-[1600px] grid grid-cols-2 gap-10 items-start">
                                {/* LEFT COLUMN: PROFIT & NON-DEDUCTIBLE EXPENSES */}
                                <div className="flex flex-col gap-6">
                                    {/* SECTION: INITIAL PROFIT/LOSS */}
                                    <div className="border-[3px] border-white h-24 bg-indigo-500/20 flex items-center font-black text-white shadow-2xl">
                                        <div className="w-[60%] border-r-[2px] border-white px-6">
                                            <span className="text-[32px] leading-tight block" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញ/(ខាត) មុនបង់ពន្ធ / លទ្ធផលគណនេយ្យ ចំណេញ / (ខាត) (E1 = B46)</span>
                                            <span className="text-[22px] block opacity-80 uppercase">Profit/(Loss) Before Tax / Accounting Profit / (Loss)</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px]">E 1</div>
                                        <div className="flex-1 flex items-center justify-end px-6 text-[44px]">
                                            {formData.e1_amount || '-'}
                                        </div>
                                    </div>

                                    {/* SECTION: NON-DEDUCTIBLE EXPENSES */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-rose-500/20 border-b-[2px] border-white h-12 items-center px-4 gap-4">
                                            <div className="bg-rose-500 px-2 py-0.5 text-[20px] font-black uppercase">Add</div>
                                            <span className="font-bold text-[28px] uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយមិនអាចកាត់កងបាន (Non-Deductible Expenses)</span>
                                        </div>
                                        {[
                                            { ref: "E 2", kh: "ចំណាយរំលស់តាមគណនេយ្យ", en: "Accounting amortisation, depletion and depreciation", key: "e2" },
                                            { ref: "E 3", kh: "ចំណាយលើការកម្សាន្តសប្បាយ ការរាំរែកកម្សាន្ត និងការទទួលភ្ញៀវ", en: "Amusement, recreation and entertainment expenses", key: "e3" },
                                            { ref: "E 4", kh: "ការកើនឡើងខ្ពស់នៃសំវិធានធន", en: "Increase in provisions", key: "e4" },
                                            { ref: "E 5", kh: "អំណោយ ជំនួយឧបត្ថម្ភផ្សេងៗ", en: "Donations, grants and subsidies", key: "e5" },
                                            { ref: "E 6", kh: "ខាតពីការលក់ទ្រព្យសកម្មថេរតាមបញ្ជីគណនេយ្យ", en: "Loss on disposal of fixed assets (as per accounting book)", key: "e6" },
                                            { ref: "E 7", kh: "ចំណាយមហាសាលៈ ស្តុក សម្ភារៈសម្រាប់កម្សាន្តផ្សេងៗ", en: "Extravagant expenses", key: "e7" },
                                            { ref: "E 8", kh: "ចំណាយមិនបម្រើឱ្យសកម្មភាពអាជីវកម្ម", en: "Non-business related expenses", key: "e8" },
                                            { ref: "E 9", kh: "ខាតលើប្រតិបត្តិការជាមួយបុគ្គលជាប់ទាក់ទង", en: "Losses on transactions with related parties", key: "e9" },
                                            { ref: "E 10", kh: "ចំណាយលើការកាត់ពិន័យ និងទោសទណ្ឌផ្សេងៗ", en: "Fines and other penalties", key: "e10" },
                                            { ref: "E 11", kh: "ចំណាយនៃកាលបរិច្ឆេទមុន", en: "Expenses related to previous period", key: "e11" },
                                            { ref: "E 12", kh: "ចំណាយពន្ធអាករដែលមិនអាចកាត់កងបាន", en: "Other non-deductible tax expenses", key: "e12" },
                                            { ref: "E 13", kh: "លាភការរបស់ម្ចាស់អាជីវកម្ម និងគ្រួសារ", en: "Remuneration of owners and families", key: "e13" },
                                            { ref: "E 14", kh: "ផលប្រយោជន៍របស់ម្ចាស់អាជីវកម្ម និងគ្រួសារ", en: "Benefits of owners and families", key: "e14" },
                                            { ref: "E 15", kh: "ចំណាយបៀវត្សដែលមិនទាន់បានបង់ក្នុងរយៈពេល ១៨០ថ្ងៃនៃឆ្នាំបន្ទាប់", en: "Salary unpaid within 180 days of next tax year", key: "e15" },
                                            { ref: "E 16", kh: "ចំណាយដល់បុគ្គលជាប់ទាក់ទងដែលមិនទាន់បានបង់ក្នុងរយៈពេល ១៨០ថ្ងៃនៃឆ្នាំបន្ទាប់", en: "Related-party expenses unpaid within 180 days of next tax year", key: "e16" },
                                            { ref: "E 17", kh: "ចំណាយផ្សេងៗមិនអាចកាត់កងបានដទៃទៀត", en: "Other non-deductible expenses", key: "e17" },
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-11 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[60%] border-r-[2px] border-white px-4 flex flex-col justify-center">
                                                    <span className="font-bold text-[22px] leading-tight truncate" title={row.kh} style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[18px] font-bold opacity-60 truncate" title={row.en}>{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[20px] font-black">{row.ref}</div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[26px]">
                                                    {formData[row.key + '_amount'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex bg-rose-500/10 h-12 items-center font-black border-t-[2px] border-white">
                                            <div className="w-[70%] border-r-[2px] border-white px-4 text-[26px]">សរុប [E18 = សរុប(E2:E17)] / Total</div>
                                            <div className="flex-1 flex items-center justify-end px-4 text-rose-400">{formData.e18_amount || '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: TAXABLE INCOME & TAX DEDUCTIBLE EXPENSES */}
                                <div className="flex flex-col gap-6">
                                    {/* SECTION: TAXABLE INCOME NOT IN BOOKS */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-indigo-500/20 border-b-[2px] border-white h-12 items-center px-4 gap-4">
                                            <div className="bg-indigo-500 px-2 py-0.5 text-[20px] font-black uppercase">Add</div>
                                            <span className="font-bold text-[28px] uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលជាប់ពន្ធដែលមិនបានកត់ត្រាក្នុងបញ្ជីគណនេយ្យ</span>
                                        </div>
                                        {[
                                            { ref: "E 19", kh: "ការផ្គត់ផ្គង់ទំនិញ និងសេវាដោយឥតគិតថ្លៃ", en: "Supplies of goods and services free of charge", key: "e19" },
                                            { ref: "E 20", kh: "ការដាក់ឱ្យប្រើប្រាស់ទ្រព្យសកម្មថេរផ្ទាល់ខ្លួនដោយឥតគិតថ្លៃ", en: "Granting fixed assets for users free of charge", key: "e20" },
                                            { ref: "E 21", kh: "ការកែលម្អទ្រព្យសកម្មថេរដោយភតិកៈដោយឥតបង់ថ្លៃឱ្យភតិកភារ", en: "Improvement of fixed assets made by lessee without charge to lessor", key: "e21" },
                                            { ref: "E 22", kh: "អំណោយ ជំនួយឧបត្ថម្ភផ្សេងៗដែលមិនបានទទួលស្គាល់ក្នុងបញ្ជីគណនេយ្យ", en: "Donations, grants and subsidies not recorded in the accounting book", key: "e22" },
                                            { ref: "E 23", kh: "ផលចំណេញ / កម្រៃពីការលក់ទ្រព្យសកម្មថេរតាមច្បាប់ស្តីពីសារពើពន្ធ", en: "Gain on disposal of fixed assets as per LOT", key: "e23" },
                                            { ref: "E 24", kh: "ចំណូលផ្សេងៗទៀតដែលមិនបានកត់ត្រាក្នុងបញ្ជីគណនេយ្យ", en: "Other incomes not recorded in the accounting book", key: "e24" },
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[60%] border-r-[2px] border-white px-4 flex flex-col justify-center">
                                                    <span className="font-bold text-[22px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[18px] font-bold opacity-60">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[20px] font-black">{row.ref}</div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_amount'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex bg-indigo-500/10 h-12 items-center font-black border-t-[2px] border-white">
                                            <div className="w-[70%] border-r-[2px] border-white px-4 text-[26px]">សរុប [E25 = សរុប(E19:E24)] / Total</div>
                                            <div className="flex-1 flex items-center justify-end px-4 text-indigo-400">{formData.e25_amount || '-'}</div>
                                        </div>
                                    </div>

                                    {/* SECTION: DEDUCTIBLE EXPENSES NOT IN BOOKS */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-emerald-500/20 border-b-[2px] border-white h-12 items-center px-4 gap-4">
                                            <div className="bg-emerald-500 px-2 py-0.5 text-[20px] font-black uppercase text-black">Less</div>
                                            <span className="font-bold text-[28px] uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយមិនកត់ត្រាក្នុងបញ្ជីគណនេយ្យតែអាចកាត់កងតាមសារពើពន្ធ</span>
                                        </div>
                                        {[
                                            { ref: "E 26", kh: "រំលស់អនុញ្ញាតតាមច្បាប់ស្តីពីសារពើពន្ធ", en: "Deductible amortisation, depletion and depreciation as per LOT", key: "e26" },
                                            { ref: "E 27", kh: "រំលស់ពិសេសអនុញ្ញាតតាមច្បាប់ស្តីពីសារពើពន្ធ", en: "Special depreciation as per LOT", key: "e27" },
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-16 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[60%] border-r-[2px] border-white px-4 flex flex-col justify-center">
                                                    <span className="font-bold text-[24px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[20px] font-bold opacity-60">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[22px] font-black">{row.ref}</div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_amount'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* DECORATIVE FOOTER */}
                                    <div className="mt-auto p-6 bg-white/5 border border-white/20 rounded-xl">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <span className="text-emerald-400 font-black text-sm">i</span>
                                            </div>
                                            <span className="font-bold text-[28px] text-white/80">Table Layout Optimized</span>
                                        </div>
                                        <p className="text-[22px] text-white/40 leading-relaxed italic">
                                            This table calculates the reconciliation between accounting profit and taxable income according to the Law on Taxation (LOT).
                                            Non-deductible expenses (Add) and additional taxable income (Add) are added back, while additional tax deductions (Less) are subtracted.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 10 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-7xl bg-white/5 backdrop-blur-md border-[2px] border-white p-8 shadow-2xl mb-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-[136px] font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការគណនាពន្ធលើប្រាក់ចំណូល (បន្ត)</h2>
                                        <h1 className="text-[112px] font-black text-white uppercase tracking-tighter">TABLE OF INCOME TAX CALCULATION (CONT.)</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-10 h-12 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-xl font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-6">
                                            <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[28px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                    <span className="text-[22px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {Array.from({ length: 3 }).map((_, i) => (
                                                        <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                            <span className="text-[32px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                        </div>
                                                    ))}
                                                    <div className="w-8 h-[3px] bg-white opacity-40 mx-2 self-center" />
                                                    {Array.from({ length: 9 }).map((_, i) => (
                                                        <div key={i + 3} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                            <span className="text-[32px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-[1600px] grid grid-cols-2 gap-10 items-start">
                                {/* LEFT COLUMN: FURTHER ADJUSTMENTS & PROFITS */}
                                <div className="flex flex-col gap-6">
                                    {/* SECTION: FURTHER DEDUCTIBLE EXPENSES */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-emerald-500/10 border-b-[2px] border-white h-12 items-center px-4 gap-4">
                                            <div className="bg-emerald-500/40 px-2 py-0.5 text-[20px] font-black uppercase">Less</div>
                                            <span className="font-bold text-[28px] uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយផ្សេងទៀតអាចកាត់កងបាន</span>
                                        </div>
                                        {[
                                            { ref: "E 28", kh: "ការថយចុះខ្ពស់នៃសំវិធានធន", en: "Decrease in provision", key: "e28" },
                                            { ref: "E 29", kh: "ខាតពីការលក់ទ្រព្យសកម្មថេរតាមច្បាប់ហិរញ្ញវត្ថុ", en: "Loss on disposal of fixed assets as per LOT", key: "e29" },
                                            { ref: "E 30", kh: "ចំណាយផ្សេងទៀតអាចកាត់កងតាមសារពើពន្ធ", en: "Other deductible expenses", key: "e30" },
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-12 items-center hover:bg-white/5 transition-colors">
                                                <div className="w-[60%] border-r-[2px] border-white px-4 flex flex-col justify-center">
                                                    <span className="font-bold text-[24px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[20px] font-bold opacity-60">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[22px] font-black">{row.ref}</div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_amount'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex bg-emerald-500/20 h-12 items-center font-black border-t-[2px] border-white">
                                            <div className="w-[70%] border-r-[2px] border-white px-4 text-[26px]">សរុប [E31 = សរុប(E28:E30)] / Total</div>
                                            <div className="flex-1 flex items-center justify-end px-4 text-emerald-400">{formData.e31_amount || '-'}</div>
                                        </div>
                                    </div>

                                    {/* SECTION: INCOME NOT TAXABLE */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-emerald-500/10 border-b-[2px] border-white h-12 items-center px-4 gap-4">
                                            <div className="bg-emerald-500/40 px-2 py-0.5 text-[20px] font-black uppercase">Less</div>
                                            <span className="font-bold text-[28px] uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលកត់ត្រាក្នុងបញ្ជីគណនេយ្យ តែមិនជាប់ពន្ធ</span>
                                        </div>
                                        {[
                                            { ref: "E 32", kh: "ភាគលាភដែលបានទទួលពីនិវាសនជន", en: "Dividend income received from resident taxpayers", key: "e32" },
                                            { ref: "E 33", kh: "ផលចំណេញពីការលក់ទ្រព្យសកម្មថេរតាមបញ្ជីគណនេយ្យ", en: "Gain on disposal of fixed assets as per accounting book", key: "e33" },
                                            { ref: "E 34", kh: "ចំណូលផ្សេងទៀតកត់ត្រាក្នុងបញ្ជីគណនេយ្យ តែមិនជាប់ពន្ធ", en: "Other incomes recorded in books, but not taxable", key: "e34" },
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-14 items-center hover:bg-white/5 transition-colors">
                                                <div className="w-[60%] border-r-[2px] border-white px-4 flex flex-col justify-center">
                                                    <span className="font-bold text-[24px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[20px] font-bold opacity-60">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[22px] font-black">{row.ref}</div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_amount'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex bg-emerald-500/20 h-12 items-center font-black border-t-[2px] border-white">
                                            <div className="w-[70%] border-r-[2px] border-white px-4 text-[26px]">សរុប [E35 = សរុប(E32:E34)] / Total</div>
                                            <div className="flex-1 flex items-center justify-end px-4 text-emerald-400">{formData.e35_amount || '-'}</div>
                                        </div>
                                    </div>

                                    {/* SECTION: PROFIT AFTER ADJUSTMENTS & CHARITABLE */}
                                    <div className="flex flex-col gap-4">
                                        <div className="border-[3px] border-white h-20 bg-indigo-500/20 flex items-center font-black text-white shadow-2xl">
                                            <div className="w-[60%] border-r-[2px] border-white px-6">
                                                <span className="text-[32px] leading-tight block" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញ/(ខាត) ក្រោយការបន្ស៊ាំ (E36 = E1 + E18 + E25 - E31 - E35)</span>
                                                <span className="text-[22px] block opacity-80 uppercase">Profit/(Loss) After Adjustments</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px]">E 36</div>
                                            <div className="flex-1 flex items-center justify-end px-6 text-[44px]">
                                                {formData.e36_amount || '-'}
                                            </div>
                                        </div>

                                        <div className="border-[2px] border-white h-14 bg-rose-500/10 flex items-center text-white">
                                            <div className="w-[60%] border-r-[2px] border-white px-6 flex items-center gap-4">
                                                <div className="bg-rose-500 px-2 py-0.5 text-[20px] font-black uppercase">Add</div>
                                                <div className="flex flex-col">
                                                    <span className="text-[24px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយលើវិភាគទានសប្បុរសធម៌មិនអនុញ្ញាត</span>
                                                    <span className="text-[20px] opacity-60">Non-deductible charitable contributions</span>
                                                </div>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px] font-black">E 37</div>
                                            <div className="flex-1 flex items-center justify-end px-6 font-black">{formData.e37_amount || '-'}</div>
                                        </div>

                                        <div className="border-[2px] border-white h-14 bg-indigo-500/10 flex items-center text-white">
                                            <div className="w-[60%] border-r-[2px] border-white px-6">
                                                <span className="text-[26px] font-black leading-tight block" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញ/(ខាត) មុនការបន្ស៊ាំការប្រាក់ (E38 = E36 + E37)</span>
                                                <span className="text-[20px] opacity-60 uppercase">Profit/(Loss) before interest adjustment</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px] font-black">E 38</div>
                                            <div className="flex-1 flex items-center justify-end px-6 font-black text-[36px]">{formData.e38_amount || '-'}</div>
                                        </div>

                                        <div className="border-[2px] border-white h-14 bg-indigo-500/20 flex items-center text-white">
                                            <div className="w-[60%] border-r-[2px] border-white px-6">
                                                <span className="text-[26px] font-black leading-tight block" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>និយតកម្មការប្រាក់ (E39 = +/-)</span>
                                                <span className="text-[20px] opacity-60 uppercase">Adjusted interest expenses</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px] font-black">E 39</div>
                                            <div className="flex-1 flex items-center justify-end px-6 font-black">{formData.e39_amount || '-'}</div>
                                        </div>

                                        <div className="border-[2px] border-white h-16 bg-emerald-500/20 flex items-center text-white border-t-[4px]">
                                            <div className="w-[60%] border-r-[2px] border-white px-6">
                                                <span className="text-[30px] font-black leading-tight block" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញ/(ខាត) ក្នុងគ្រា (E40 = E38 +/- E39)</span>
                                                <span className="text-[22px] opacity-60 uppercase">Profit/(Loss) During the Period</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px] font-black">E 40</div>
                                            <div className="flex-1 flex items-center justify-end px-6 font-black text-[40px] text-emerald-400">{formData.e40_amount || '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: TAX CALCULATION & FINAL PAYABLE */}
                                <div className="flex flex-col gap-6">
                                    {/* SECTION: TAXABLE INCOME CALCULATION */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-white/10 border-b-[2px] border-white h-12 items-center px-6">
                                            <span className="font-bold text-[28px] uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការគណនាប្រាក់ចំណូលជាប់ពន្ធ</span>
                                        </div>
                                        <div className="flex border-b border-white/10 h-14 items-center px-6">
                                            <div className="w-[60%] flex gap-4 items-center">
                                                <div className="bg-emerald-500/40 px-2 py-0.5 text-[20px] font-black uppercase">Less</div>
                                                <div className="flex flex-col">
                                                    <span className="text-[24px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការខាតកន្លងមកអនុញ្ញាតឱ្យកាត់</span>
                                                    <span className="text-[20px] opacity-60">Accumulated losses brought forward</span>
                                                </div>
                                            </div>
                                            <div className="w-[10%] flex justify-center opacity-40 text-[22px] font-black">E 41</div>
                                            <div className="flex-1 flex justify-end font-black">{formData.e41_amount || '-'}</div>
                                        </div>
                                        <div className="flex h-20 bg-indigo-500/30 items-center px-6 border-t-[3px] border-white">
                                            <div className="w-[70%] border-r-[2px] border-white pr-6">
                                                <span className="text-[32px] font-black leading-tight block" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណូលជាប់ពន្ធ / (ខាត) ចរន្ត (E42 = E40 - E41)</span>
                                                <span className="text-[22px] opacity-60 uppercase">Taxable Income / (Loss) for Tax Calculation</span>
                                            </div>
                                            <div className="flex-1 flex justify-end text-[44px] font-black text-indigo-300">
                                                {formData.e42_amount || '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION: FINAL TAX PAYABLE SUMMARY */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-3xl">
                                        <div className="flex bg-indigo-500/40 h-12 items-center px-6 border-b-[2px] border-white">
                                            <span className="font-black text-[28px] uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ពន្ធដែលត្រូវបង់ / ឥណទានពន្ធ</span>
                                        </div>
                                        <div className="flex flex-col">
                                            {[
                                                { ref: "E 45", kh: "សរុបពន្ធ (E45 = E43 + E44)", en: "Total Tax", key: "e45", bg: "bg-white/5" },
                                                { ref: "E 50", kh: "កាតព្វកិច្ចពន្ធលើប្រាក់ចំណូល (E50 = E47 - E49)", en: "Income Tax Liability", key: "e50", bg: "bg-indigo-500/10" },
                                                { ref: "E 51", kh: "ពន្ធអប្បបរមា", en: "Minimum Tax", key: "e51", bg: "bg-white/5" },
                                            ].map((row, idx) => (
                                                <div key={idx} className={`flex border-b border-white/10 h-14 items-center px-6 ${row.bg}`}>
                                                    <div className="w-[60%] flex flex-col">
                                                        <span className="text-[26px] font-black" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="text-[20px] opacity-60 uppercase tracking-tighter">{row.en}</span>
                                                    </div>
                                                    <div className="w-[10%] flex justify-center opacity-40 text-[22px] font-black">{row.ref}</div>
                                                    <div className="flex-1 flex justify-end font-black">{formData[row.key + '_amount'] || '-'}</div>
                                                </div>
                                            ))}

                                            <div className="flex bg-emerald-500/40 h-28 items-center px-8 border-t-[4px] border-white">
                                                <div className="w-[60%] border-r-[2px] border-white pr-6">
                                                    <span className="text-[40px] font-black leading-tight block" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ពន្ធលើប្រាក់ចំណូលដែលត្រូវបង់ (E59)</span>
                                                    <span className="text-[26px] opacity-80 uppercase font-black">Income tax payable / Tax credit forward</span>
                                                </div>
                                                <div className="flex-1 flex flex-col items-end">
                                                    <span className="text-[64px] font-black text-emerald-300 antialiased tracking-tighter">
                                                        {formData.e59_amount || '$ 0.00'}
                                                    </span>
                                                    <span className="text-[20px] font-black opacity-50 uppercase tracking-[0.2em]">Final Assessment</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION: ADDITIONAL TAX CREDITS Section (E55-E58) */}
                                    <div className="p-6 bg-white/5 border border-white/20 rounded-xl mt-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center border border-white/20">
                                                <span className="text-indigo-300 font-black text-lg">CP</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-[28px] text-white">Tax Credits (E55 - E58)</span>
                                                <span className="text-[20px] text-white/40 italic">Credits including WHT, Prepayments, and Carry Forwards</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                                <span className="text-[22px] block opacity-40 mb-1">E 55+56 (Paid)</span>
                                                <span className="text-[32px] font-black text-white">{formData.e55_56_combined || '-'}</span>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                                <span className="text-[22px] block opacity-40 mb-1">E 58 (BF)</span>
                                                <span className="text-[32px] font-black text-white">{formData.e58_amount || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 11 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER - MATCHING IMAGE BRACKET */}
                            <div className="w-full max-w-7xl flex flex-col items-center mb-16 px-10">
                                <div className="w-full border-[4px] border-white p-10 flex flex-col items-center bg-white/5 relative shadow-2xl">
                                    <h2 className="text-[36px] font-bold text-white text-center leading-tight mb-4" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                        ការអនុញ្ញាតឱ្យដកចេញនូវភាគទានសប្បុរសធម៌ ការប្រាក់ <br />
                                        និងការដាក់បញ្ចូលខាត ដែលការអនុញ្ញាតឱ្យដកចេញបន្ត
                                    </h2>
                                    <h1 className="text-[32px] font-black text-white text-center uppercase tracking-wider">
                                        CHARITABLE CONTRIBUTIONS, DEDUCTIBLE INTEREST EXPENSES AND <br />
                                        ACCUMULATED LOSSES CARRIED FORWARD
                                    </h1>

                                    {/* TIN & TAX YEAR BOXES IN HEADER AREA */}
                                    <div className="absolute -bottom-12 right-0 flex flex-col gap-4">
                                        <div className="flex items-center gap-6 bg-slate-950 px-6 py-4 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[22px] font-bold text-white px-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[16px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-10 h-14 border-[2px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[26px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-6 h-[2px] bg-white opacity-40 mx-1 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-10 h-14 border-[2px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[26px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 px-6 py-2 border-[2px] border-white/20 ml-auto">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[18px] font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                                                <span className="text-[14px] font-black text-white/60 uppercase">Tax Year</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                {["2", "0", "2", "6"].map((char, i) => (
                                                    <div key={i} className="w-10 h-12 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                        <span className="text-[24px] font-black text-white">{char}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full flex justify-center mt-12 gap-8 items-center">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[20px] font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                        <span className="text-[16px] font-black text-white/40 uppercase">Tax Identification Number (TIN):</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="w-9 h-12 border-[2px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[22px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                </div>
                                            ))}
                                            <div className="w-6 h-[2.5px] bg-white opacity-40 mx-2 self-center" />
                                            {Array.from({ length: 9 }).map((_, i) => (
                                                <div key={i + 3} className="w-9 h-12 border-[2px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[22px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-6xl flex flex-col gap-20">
                                {/* SECTION A: CHARITABLE CONTRIBUTIONS */}
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col">
                                        <h3 className="text-white font-bold text-[28px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក-គណនាភាគទានសប្បុរសធម៌</h3>
                                        <h4 className="text-white/60 font-black text-[22px] uppercase">A. Charitable Contribution Calculation</h4>
                                    </div>

                                    <div className="border-[4px] border-white overflow-hidden text-white bg-white/5 shadow-2xl">
                                        <div className="flex bg-indigo-500/20 border-b-[4px] border-white h-20 items-center">
                                            <div className="flex-1 border-r-[4px] border-white px-8 text-center">
                                                <span className="font-bold text-[28px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                                                <span className="text-[22px] block font-black uppercase leading-none mt-1">Description</span>
                                            </div>
                                            <div className="w-[15%] border-r-[4px] border-white flex items-center justify-center font-black text-[24px]">យោង/REF</div>
                                            <div className="w-[25%] flex items-center justify-center text-[28px] font-bold">ចំនួនទឹកប្រាក់/Amount</div>
                                        </div>

                                        {[
                                            { ref: "F 1", kh: "ប្រាក់ចំណេញសុទ្ធ/(ខាត) ក្រោយបន្សាំ (F1 = E36)", en: "Profit/(loss) after adjustment (F1 = E36)", key: "f1" },
                                            { ref: "F 2", kh: "ចំណាយសប្បុរសធម៌", en: "Charitable contributions", key: "f2" },
                                            { ref: "F 3", kh: "ប្រាក់ចំណូលសុទ្ធសំរាប់គណនាភាគទានសប្បុរសធម៌ (F3 = F1 + F2)", en: "Adjusted income for calculation (F3 = F1 + F2)", key: "f3", isCalculated: true },
                                            { ref: "F 4", kh: "ចំណាយសប្បុរសធម៌អតិបរមា (F4 = F3 x 5%)", en: "Maximum deductible contributions (F4 = F3 x 5%)", key: "f4", isCalculated: true },
                                            { ref: "F 5", kh: "ចំណាយសប្បុរសធម៌អនុញ្ញាតក្នុងគ្រា (F5 = ទាបជាងរវាង F4 និង F2)", en: "Deductible charitable contributions (Lower of F4 or F2)", key: "f5", isCalculated: true },
                                            { ref: "F 6", kh: "ចំណាយសប្បុរសធម៌មិនអនុញ្ញាតបូកចូលភ្នាល់ពន្ធ (F6 = F2 - F5)", en: "Non-deductible contributions to be added back (F6 = F2 - F5)", key: "f6", isGrandTotal: true },
                                        ].map((row, idx) => (
                                            <div key={idx} className={`flex border-b border-white/10 h-24 items-center last:border-0 hover:bg-white/5 transition-colors 
                                                ${row.isCalculated ? 'bg-indigo-500/5' : ''}
                                                ${row.isGrandTotal ? 'bg-rose-500/20 h-32 border-t-[4px] border-white' : ''}`}>
                                                <div className="flex-1 border-r-[4px] border-white px-10 flex flex-col justify-center">
                                                    <span className={`${row.isGrandTotal ? 'text-[36px]' : 'text-[28px]'} font-bold leading-tight`} style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className={`${row.isGrandTotal ? 'text-[24px]' : 'text-[20px]'} font-bold opacity-60`}>{row.en}</span>
                                                </div>
                                                <div className="w-[15%] border-r-[4px] border-white flex items-center justify-center opacity-40 text-[22px] font-black">{row.ref}</div>
                                                <div className={`w-[25%] flex items-center justify-end px-10 font-black ${row.isGrandTotal ? 'text-[42px] text-rose-400' : 'text-[32px]'}`}>
                                                    <input type="text" className="w-full bg-transparent text-right outline-none" value={formData[row.key] || ""} onChange={(e) => handleFormChange(row.key, e.target.value)} placeholder="-" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTION B: INTEREST EXPENSES */}
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col">
                                        <h3 className="text-white font-bold text-[28px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខ-គណនាចំណាយការប្រាក់</h3>
                                        <h4 className="text-white/60 font-black text-[22px] uppercase">B. Interest Expense Calculation</h4>
                                    </div>

                                    <div className="border-[4px] border-white overflow-hidden text-white bg-white/5 shadow-2xl">
                                        <div className="flex bg-rose-500/20 border-b-[4px] border-white h-20 items-center">
                                            <div className="flex-1 border-r-[4px] border-white px-8 text-center">
                                                <span className="font-bold text-[28px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការគណនាចំណាយការប្រាក់អនុញ្ញាតក្នុងគ្រា</span>
                                                <span className="text-[22px] block font-black uppercase leading-none mt-1">Calculation of Deductible Interest during the Period</span>
                                            </div>
                                            <div className="w-[15%] border-r-[4px] border-white flex items-center justify-center font-black text-[24px]">យោង/REF</div>
                                            <div className="w-[25%] flex items-center justify-center text-[28px] font-bold">ចំនួនទឹកប្រាក់/Amount</div>
                                        </div>

                                        {[
                                            { ref: "G 1", kh: "ប្រាក់ចំណេញសុទ្ធ/(ខាត) មុនការបន្សាំការប្រាក់ (G1 = E38)", en: "Net Profit/(loss) before interest adjustment (G1 = E38)", key: "g1" },
                                            { ref: "G 2", kh: "បូក៖ ចំណាយការប្រាក់ក្នុងគ្រា", en: "Add: Interest expenses during the period", key: "g2" },
                                            { ref: "G 3", kh: "ដក៖ ចំណូលការប្រាក់ក្នុងគ្រា", en: "Less: Interest income during the period", key: "g3" },
                                            { ref: "G 4", kh: "ចំណូលសុទ្ធគ្មានការប្រាក់ (G4 = G1 + G2 - G3 បើ >= 0)", en: "Net non-interest income (G4 = G1 + G2 - G3)", key: "g4", isCalculated: true },
                                            { ref: "G 5", kh: "៥០% នៃចំណូលសុទ្ធគ្មានការប្រាក់ (G5 = G4 x 50%)", en: "50% of net non-interest income (G5 = G4 x 50%)", key: "g5", isCalculated: true },
                                            { ref: "G 6", kh: "ចំណូលការប្រាក់ក្នុងគ្រា (G6 = G3)", en: "Interest income during the period (G6 = G3)", key: "g6", isCalculated: true },
                                            { ref: "G 7", kh: "ចំណាយការប្រាក់អតិបរមាអនុញ្ញាតក្នុងគ្រា (G7 = G5 + G6)", en: "Max deductible interest expense (G7 = G5 + G6)", key: "g7", isCalculated: true },
                                            { ref: "G 8*", kh: "ចំនួនទឹកប្រាក់ដែលត្រូវបូកចូលក្នុងប្រាក់ចំណេញជាប់ពន្ធ (G8 = G2 - G7)", en: "Amount to be added to taxable income (G8 = G2 - G7)", key: "g8", isGrandTotal: true },
                                        ].map((row, idx) => (
                                            <div key={idx} className={`flex border-b border-white/10 h-24 items-center last:border-0 hover:bg-white/5 transition-colors 
                                                ${row.isCalculated ? 'bg-rose-500/5' : ''}
                                                ${row.isGrandTotal ? 'bg-rose-500/30 h-32 border-t-[4px] border-white' : ''}`}>
                                                <div className="flex-1 border-r-[4px] border-white px-10 flex flex-col justify-center">
                                                    <span className={`${row.isGrandTotal ? 'text-[36px]' : 'text-[28px]'} font-bold leading-tight`} style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className={`${row.isGrandTotal ? 'text-[24px]' : 'text-[20px]'} font-bold opacity-60`}>{row.en}</span>
                                                </div>
                                                <div className="w-[15%] border-r-[4px] border-white flex items-center justify-center opacity-40 text-[22px] font-black">{row.ref}</div>
                                                <div className={`w-[25%] flex items-center justify-end px-10 font-black ${row.isGrandTotal ? 'text-[42px] text-rose-400' : 'text-[32px]'}`}>
                                                    <input type="text" className="w-full bg-transparent text-right outline-none" value={formData[row.key] || ""} onChange={(e) => handleFormChange(row.key, e.target.value)} placeholder="-" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-10 bg-white/5 border-[2px] border-white/20 rounded-2xl text-[24px] italic text-white/60 leading-relaxed">
                                        * Note: If G7 &lt; G2, the difference (G8) should be added back to taxable income. <br />
                                        * Note: If G7 &gt; G2, the difference should be carried forward as per LOT - See Table B.1 on Page 13.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {activePage === 12 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center overflow-x-auto">
                            <div className="w-[1800px] flex flex-col items-center">
                                {/* PAGE HEADER - TIN & YEAR AREA */}
                                <div className="w-full flex flex-col items-end mb-16 px-10">
                                    <div className="flex gap-16 items-start">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-6">
                                                <span className="text-[28px] font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                                                <span className="text-[22px] font-black text-white/40 uppercase">Tax Year</span>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">{char}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[28px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[22px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-8 h-[3px] bg-white opacity-40 mx-2 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full flex flex-col gap-12 mt-10">
                                    {/* TABLE B.1: INTEREST EXPENSES CARRIED FORWARD */}
                                    <div className="flex flex-col gap-8">
                                        <div className="flex flex-col border-l-[10px] border-emerald-500 pl-8">
                                            <h3 className="text-white font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខ.១-តារាងការអនុញ្ញាតលើចំណាយការប្រាក់ដែលបានបន្ត</h3>
                                            <h4 className="text-white/60 font-black text-[28px] uppercase tracking-tight">B.1 Table of Interest Expenses Carried Forward</h4>
                                        </div>

                                        <div className="border-[4px] border-white bg-white/5 shadow-2xl overflow-hidden">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-emerald-500/10 border-b-[4px] border-white text-white h-32 text-[22px]">
                                                        <th className="border-r-[2px] border-white p-4 w-[12%]">
                                                            <span className="block font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទ</span>
                                                            <span className="font-black uppercase">Period</span>
                                                        </th>
                                                        <th className="border-r-[2px] border-white p-4 w-[20%]">
                                                            <span className="block font-bold italic" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយការប្រាក់អតិបរមាដែលអាចដក <br /> កាត់បានជាមួយការប្រាក់យកមកពីឆ្នាំមុន</span>
                                                            <span className="font-black uppercase opacity-70">Max Interest Deductible (G9)</span>
                                                        </th>
                                                        <th className="border-r-[2px] border-white p-4 w-[18%]">
                                                            <span className="block font-bold italic" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>និយ័តកម្មការប្រាក់មិនអនុញ្ញាត <br /> កាត់កងក្នុងគ្រាការិយបរិច្ឆេទ</span>
                                                            <span className="font-black uppercase opacity-70">Not-Allowed Interest (G10)</span>
                                                        </th>
                                                        <th className="border-r-[2px] border-white p-4 w-[16%]">
                                                            <span className="block font-bold italic" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការប្រាក់អនុញ្ញាតប្រើប្រាស់ <br /> កាត់កងក្នុងគ្រាការិយបរិច្ឆេទ</span>
                                                            <span className="font-black uppercase opacity-70">Interest Allowed (G11)*</span>
                                                        </th>
                                                        <th className="border-r-[2px] border-white p-4 w-[16%]">
                                                            <span className="block font-bold italic" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការប្រាក់អនុញ្ញាតប្រើប្រាស់ <br /> កាត់កងសរុបបន្ត</span>
                                                            <span className="font-black uppercase opacity-70">Accumulated Interest (G12)</span>
                                                        </th>
                                                        <th className="p-4 w-[18%]">
                                                            <span className="block font-bold italic" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការប្រាក់ដែលនៅសល់អនុញ្ញាត <br /> ប្រើប្រាស់សរុបបន្តទៅមុខ</span>
                                                            <span className="font-black uppercase opacity-70">Carried Forward (G13)</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-white font-black text-[28px]">
                                                    {["N-5", "N-4", "N-3", "N-2", "N-1", "N"].map((year, i) => (
                                                        <tr key={i} className="border-b border-white/10 h-24 hover:bg-white/5 transition-colors">
                                                            <td className="border-r-[2px] border-white p-4 text-center">
                                                                <span className="block font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំ {year}</span>
                                                                <span className="text-[20px] font-black opacity-50">Year {year}</span>
                                                            </td>
                                                            <td className="border-r-[2px] border-white p-4 relative">
                                                                {i < 5 ? (
                                                                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                                                        <div className="w-full h-1 bg-white rotate-[15deg]"></div>
                                                                        <div className="w-full h-1 bg-white -rotate-[15deg]"></div>
                                                                    </div>
                                                                ) : <input type="text" className="w-full bg-transparent text-right outline-none text-white" placeholder="0.00" />}
                                                            </td>
                                                            <td className="border-r-[2px] border-white p-4"><input type="text" className="w-full bg-transparent text-right outline-none" placeholder="0.00" /></td>
                                                            <td className="border-r-[2px] border-white p-4 font-black text-emerald-400 bg-emerald-500/10"><input type="text" className="w-full bg-transparent text-right outline-none" placeholder="0.00" /></td>
                                                            <td className="border-r-[2px] border-white p-4"><input type="text" className="w-full bg-transparent text-right outline-none text-white/40" placeholder="0.00" /></td>
                                                            <td className="p-4 font-black text-rose-300 bg-rose-500/5"><input type="text" className="w-full bg-transparent text-right outline-none" placeholder="0.00" /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-[24px] text-white/40 italic">* Sum amount of column (G11) to be deducted from adjusted taxable income by filling in the box (E39)</p>
                                    </div>

                                    {/* TABLE C: TAXABLE ACCUMULATED LOSSES CARRIED FORWARD */}
                                    <div className="flex flex-col gap-10 mt-10">
                                        <div className="flex flex-col border-l-[10px] border-indigo-500 pl-8">
                                            <h3 className="text-white font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>គ.តារាងការបន្តខាតដែលបានកើតពីពន្ធដារតាមរយៈបន្តទៅមុខ</h3>
                                            <h4 className="text-white/60 font-black text-[28px] uppercase tracking-tight">C. Table of Taxable Accumulated Losses Carried Forward</h4>
                                        </div>

                                        <div className="border-[4px] border-white bg-white/5 shadow-2xl overflow-hidden">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-indigo-500/10 border-b-[4px] border-white text-white h-32 text-[20px]">
                                                        <th className="border-r-[2px] border-white p-4 w-[12%]">
                                                            <span className="block font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទ</span>
                                                            <span className="font-black uppercase">Period</span>
                                                        </th>
                                                        <th className="border-r-[2px] border-white p-4 w-[17.6%]">
                                                            <span className="block font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លទ្ធផលចំណេញសារពើពន្ធ</span>
                                                            <span className="font-black uppercase opacity-70">Taxable Profit (1)</span>
                                                        </th>
                                                        <th className="border-r-[2px] border-white p-4 w-[17.6%]">
                                                            <span className="block font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លទ្ធផលខាតសារពើពន្ធ <br /> ក្នុងគ្រាការិយបរិច្ឆេទ</span>
                                                            <span className="font-black uppercase opacity-70">Taxable Loss (2)</span>
                                                        </th>
                                                        <th className="border-r-[2px] border-white p-4 w-[17.6%]">
                                                            <span className="block font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខាតអនុញ្ញាតប្រើប្រាស់ <br /> ក្នុងគ្រាការិយបរិច្ឆេទ</span>
                                                            <span className="font-black uppercase opacity-70">Loss Allowance (3)</span>
                                                        </th>
                                                        <th className="border-r-[2px] border-white p-4 w-[17.6%]">
                                                            <span className="block font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខាតអនុញ្ញាតប្រើប្រាស់ <br /> កាត់កងសរុបបន្ត</span>
                                                            <span className="font-black uppercase opacity-70">Accu. Losses Allowance (4)*</span>
                                                        </th>
                                                        <th className="p-4 w-[17.6%]">
                                                            <span className="block font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ខាតដែលនៅសេសសល់អនុញ្ញាត <br /> យកទៅប្រើប្រាស់បន្តទៅមុខ</span>
                                                            <span className="font-black uppercase opacity-70">Losses Carried Forward (5)</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-white font-black text-[28px]">
                                                    {["N-5", "N-4", "N-3", "N-2", "N-1", "N**"].map((year, i) => (
                                                        <tr key={i} className="border-b border-white/10 h-24 hover:bg-white/5 transition-colors">
                                                            <td className="border-r-[2px] border-white p-4 text-center">
                                                                <span className="block font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំ {year}</span>
                                                                <span className="text-[20px] font-black opacity-50">Year {year}</span>
                                                            </td>
                                                            <td className="border-r-[2px] border-white p-4"><input type="text" className="w-full bg-transparent text-right outline-none text-white/40" placeholder="0.00" /></td>
                                                            <td className="border-r-[2px] border-white p-4"><input type="text" className="w-full bg-transparent text-right outline-none text-white/40" placeholder="0.00" /></td>
                                                            <td className="border-r-[2px] border-white p-4"><input type="text" className="w-full bg-transparent text-right outline-none text-white/40" placeholder="0.00" /></td>
                                                            <td className="border-r-[2px] border-white p-4 font-black bg-indigo-500/10"><input type="text" className="w-full bg-transparent text-right outline-none text-emerald-400" placeholder="0.00" /></td>
                                                            <td className="p-4 font-black text-indigo-300"><input type="text" className="w-full bg-transparent text-right outline-none" placeholder="0.00" /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="flex flex-col gap-4 p-10 bg-white/5 rounded-2xl border-[3px] border-white/10 text-[22px] text-white/40 italic leading-relaxed shadow-inner">
                                            <p>(4)* គឺជាចំនួនទឹកប្រាក់ខាតពីអតីតការិយបរិច្ឆេទដែលត្រូវបានអនុញ្ញាតក្នុងឆ្នាំជាប់ពន្ធបច្ចុប្បន្ន និងក្នុងគ្រាការិយបរិច្ឆេទនេះ It is an accumulated taxable loss allowance from previous periods and current period.</p>
                                            <p>** ឆ្នាំ N គឺជាឆ្នាំជាប់ពន្ធ Year N is the current tax year</p>
                                            <p className="mt-4">ក្នុងករណីដែលមានខាតនៅគ្រាការិយបរិច្ឆេទជាប់ពន្ធណាមួយ ការខាតបង់នោះត្រូវបានទុកជាបន្ទុកសម្រាប់ឆ្នាំជាប់ពន្ធបន្តបន្ទាប់ ហើយត្រូវដកចេញពីប្រាក់ចំណេញសម្រេចបាននៅក្នុងឆ្នាំជាប់ពន្ធបន្តបន្ទាប់នោះ។</p>
                                            <p className="mt-2 text-[20px]">In case of any loss in any tax year, this loss is considered as a charge for the following tax year and shall be deducted from the profit realized in that following year.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 13 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* LANDSCAPE HEADER AREA */}
                            <div className="w-[2400px] flex flex-col items-center mb-10 px-10">
                                <div className="w-full flex justify-between items-start mb-16">
                                    <div className="border-[6px] border-white p-10 bg-white/5 shadow-2xl">
                                        <h2 className="text-[64px] font-bold text-white text-center leading-tight mb-4" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                            តារាងគណនារំលស់តាមច្បាប់ស្តីពីសារពើពន្ធ
                                        </h2>
                                        <h1 className="text-[48px] font-black text-white text-center uppercase tracking-wider">
                                            DEPRECIATION TABLE AS PER LOT
                                        </h1>
                                    </div>
                                    <div className="flex flex-col gap-8">
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[28px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[22px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-8 h-[3px] bg-white opacity-40 mx-2 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* TABLE I, II, III: STRAIGHT LINE */}
                                <div className="w-full border-[4px] border-white bg-white/5 overflow-hidden">
                                    <table className="w-full border-collapse text-[22px]">
                                        <thead>
                                            <tr className="bg-indigo-500/10 border-b-[4px] border-white text-white h-32">
                                                <th className="border-r-[2px] border-white p-3 w-[3%]">ល.រ<br />No.</th>
                                                <th className="border-r-[2px] border-white p-3 w-[15%]">ប្រភេទទ្រព្យសកម្ម<br />Fixed Assets</th>
                                                <th className="border-r-[2px] border-white p-3 w-[10%]">ថ្លៃដើម<br />Historical Cost (1)</th>
                                                <th className="border-r-[2px] border-white p-3 w-[10%]">លទ្ធកម្ម/ផលិតកម្ម<br />Acquisitions (2)</th>
                                                <th className="border-r-[2px] border-white p-3 w-[8%]">ថ្លៃដើមទ្រព្យលក់ចេញ<br />Disposals (3)</th>
                                                <th className="border-r-[2px] border-white p-3 w-[10%]">តម្លៃមូលដ្ឋានរំលស់<br />Depre. Base (4)=(1)+(2)-(3)</th>
                                                <th className="border-r-[2px] border-white p-3 w-[4%]">អត្រា<br />Rate (5)</th>
                                                <th className="border-r-[2px] border-white p-3 w-[8%]">រំលស់សរុបគ្រានេះ<br />Allowance (6)=(4)*(5)</th>
                                                <th className="border-r-[2px] border-white p-3 w-[8%]">រំលស់បង្គរដើមគ្រា<br />Accu. Depre. (7)</th>
                                                <th className="border-r-[2px] border-white p-3 w-[8%]">រំលស់ទ្រព្យលក់ចេញ<br />Disposals Depre. (8)</th>
                                                <th className="border-r-[2px] border-white p-3 w-[8%]">រំលស់បង្គរចុងគ្រា<br />Accu. Depre. (9)=(6)+(7)-(8)</th>
                                                <th className="p-3 w-[8%]">តម្លៃនៅសល់<br />Net Value (10)=(4)-(9)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-white">
                                            {/* SECTION I */}
                                            <tr className="bg-white/5 font-bold">
                                                <td className="border-r-[2px] border-white border-b-[2px] p-6 text-center text-[28px]">I</td>
                                                <td colSpan="11" className="p-6 border-b-[2px] border-white text-[28px]">រំលស់ទ្រព្យអរូបី (រំលស់តាមវិធីខ្សែបន្ទាត់ត្រង់) / Amortisation of Intangible Assets (Straight-Line Method)</td>
                                            </tr>
                                            {[1, 2, 3].map(i => (
                                                <tr key={i} className="border-b border-white/10 h-20">
                                                    <td className="border-r-[2px] border-white text-center opacity-40">-</td>
                                                    <td className="border-r-[2px] border-white px-6"><input className="w-full bg-transparent outline-none text-[28px]" placeholder="..." /></td>
                                                    {Array(10).fill(0).map((_, j) => (
                                                        <td key={j} className="border-r-[2px] border-white last:border-0 px-4"><input className="w-full bg-transparent text-right outline-none text-[28px]" placeholder="-" /></td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {/* SECTION II */}
                                            <tr className="bg-white/5 font-bold">
                                                <td className="border-r-[2px] border-white border-b-[2px] p-6 text-center text-[28px]">II</td>
                                                <td colSpan="11" className="p-6 border-b-[2px] border-white text-[28px]">រំលស់កសិកម្ម និងធនធានធម្មជាតិ / Depletion of Agriculture and Natural Resources</td>
                                            </tr>
                                            <tr className="border-b border-white/10 h-20 text-[28px]">
                                                <td className="border-r-[2px] border-white text-center font-bold">1</td>
                                                <td className="border-r-[2px] border-white px-6">កសិកម្មរយៈពេលវែង (Long-Term Agriculture)</td>
                                                {Array(10).fill(0).map((_, j) => (
                                                    <td key={j} className="border-r-[2px] border-white last:border-0 px-4"><input className="w-full bg-transparent text-right outline-none" placeholder="-" /></td>
                                                ))}
                                            </tr>
                                            <tr className="border-b border-white/10 h-20 text-[28px]">
                                                <td className="border-r-[2px] border-white text-center font-bold">2</td>
                                                <td className="border-r-[2px] border-white px-6">ធនធានធម្មជាតិ (Natural Resources)</td>
                                                {Array(10).fill(0).map((_, j) => (
                                                    <td key={j} className="border-r-[2px] border-white last:border-0 px-4"><input className="w-full bg-transparent text-right outline-none" placeholder="-" /></td>
                                                ))}
                                            </tr>
                                            {/* SECTION III */}
                                            <tr className="bg-white/5 font-bold">
                                                <td className="border-r-[2px] border-white border-b-[2px] p-6 text-center text-[28px]">III</td>
                                                <td colSpan="11" className="p-6 border-b-[2px] border-white text-[28px]">រំលស់ទ្រព្យរូបីថ្នាក់ ១ (រំលស់តាមវិធីខ្សែបន្ទាត់ត្រង់) / Depreciation of Tangible Assets Class 1 (Straight-Line Method)</td>
                                            </tr>
                                            <tr className="border-b border-white/10 h-20 text-[28px]">
                                                <td className="border-r-[2px] border-white text-center font-bold">1</td>
                                                <td className="border-r-[2px] border-white px-6">សំណង់ អគារ ហេដ្ឋារចនាសម្ព័ន្ធ ផ្លូវ នាវា... / Const., Buildings, Infrast., Roads...</td>
                                                {Array(10).fill(0).map((_, j) => (
                                                    <td key={j} className={`border-r-[2px] border-white last:border-0 px-4 ${j === 4 ? 'bg-indigo-500/20 font-black text-center text-[32px]' : ''}`}>
                                                        {j === 4 ? "5%" : <input className="w-full bg-transparent text-right outline-none" placeholder="-" />}
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr className="border-b-[4px] border-white h-20 text-[28px]">
                                                <td className="border-r-[2px] border-white text-center font-bold">2</td>
                                                <td className="border-r-[2px] border-white px-6">អគារ មិនមែនបេតុង / Non-concrete buildings</td>
                                                {Array(10).fill(0).map((_, j) => (
                                                    <td key={j} className={`border-r-[2px] border-white last:border-0 px-4 ${j === 4 ? 'bg-indigo-500/20 font-black text-center text-[32px]' : ''}`}>
                                                        {j === 4 ? "10%" : <input className="w-full bg-transparent text-right outline-none" placeholder="-" />}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* SECTION IV: DECLINING BALANCE */}
                                <div className="w-full flex flex-col gap-8 mt-16">
                                    <div className="flex flex-col">
                                        <h3 className="text-white font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>IV-រំលស់ទ្រព្យរូបីថ្នាក់ ២ ដល់ ថ្នាក់ ៤ (រំលស់តាមវិធីសាយស្រុតថយចុះតាមសមតុល្យ)</h3>
                                        <h4 className="text-white/60 font-black text-[28px] uppercase">IV-Depreciation of Tangible Assets Class 2-4 (Declining Balance Method)</h4>
                                    </div>

                                    <div className="border-[4px] border-white bg-white/5">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-rose-500/10 border-b-[4px] border-white h-32 text-[24px]">
                                                    <th className="border-r-[2px] border-white p-3 w-[4%]">No.</th>
                                                    <th className="border-r-[2px] border-white p-3 w-[18%]">ប្រភេទទ្រព្យសកម្ម<br />Fixed Assets</th>
                                                    <th className="border-r-[2px] border-white p-3 w-[12%]">ថ្លៃដើម/Historical Cost (1)</th>
                                                    <th className="border-r-[2px] border-white p-3 w-[12%]">តម្លៃមិនទាន់រំលស់ដើមគ្រា (2)<br />Undepre. Value at Start</th>
                                                    <th className="border-r-[2px] border-white p-3 w-[12%]">លទ្ធកម្ម/Acquisitions (3)</th>
                                                    <th className="border-r-[2px] border-white p-3 w-[10%]">ការលុបឈ្មោះ ឬលក់ (4)<br />Disposals/Written-off</th>
                                                    <th className="border-r-[2px] border-white p-3 w-[12%]">តម្លៃមូលដ្ឋានរំលស់ (5)<br />(5) = (2)+(3)-(4)</th>
                                                    <th className="border-r-[2px] border-white p-3 w-[6%]">អត្រា (6)<br />Rate</th>
                                                    <th className="border-r-[2px] border-white p-3 w-[12%]">រំលស់ចុងគ្រា (7)<br />(7) = (5)*(6)</th>
                                                    <th className="p-3 w-[12%]">តម្លៃមិនទាន់រំលស់ចុងគ្រា (8)<br />(8) = (5)-(7)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-white">
                                                {[
                                                    { name: "ទ្រព្យរូបីថ្នាក់ ២ / Tangible assets class 2", rate: "50%", key: "c2" },
                                                    { name: "ទ្រព្យរូបីថ្នាក់ ៣ / Tangible assets class 3", rate: "25%", key: "c3" },
                                                    { name: "ទ្រព្យរូបីថ្នាក់ ៤ / Tangible assets class 4", rate: "20%", key: "c4" }
                                                ].map((row, i) => (
                                                    <tr key={i} className="border-b border-white/10 h-24">
                                                        <td className="border-r-[2px] border-white text-center font-bold text-[32px]">{i + 2}</td>
                                                        <td className="border-r-[2px] border-white px-8 font-bold text-[28px]">{row.name}</td>
                                                        {Array(5).fill(0).map((_, j) => (
                                                            <td key={j} className="border-r-[2px] border-white px-6"><input className="w-full bg-transparent text-right outline-none text-[28px]" placeholder="-" /></td>
                                                        ))}
                                                        <td className="border-r-[2px] border-white text-center font-black bg-rose-500/20 text-[36px]">{row.rate}</td>
                                                        <td className="border-r-[2px] border-white px-6 font-black"><input className="w-full bg-transparent text-right outline-none text-emerald-400 text-[32px]" placeholder="0.00" /></td>
                                                        <td className="px-6 font-black"><input className="w-full bg-transparent text-right outline-none text-rose-300 text-[32px]" placeholder="0.00" /></td>
                                                    </tr>
                                                ))}
                                                <tr className="h-28 bg-white/10 font-black text-[32px]">
                                                    <td colSpan="2" className="border-r-[2px] border-white text-center">សរុបថ្នាក់ ២ ដល់ ៤ / TOTAL CLASS 2-4</td>
                                                    <td className="border-r-[2px] border-white"></td>
                                                    <td className="border-r-[2px] border-white"></td>
                                                    <td className="border-r-[2px] border-white text-right px-6">0.00</td>
                                                    <td className="border-r-[2px] border-white text-right px-6">0.00</td>
                                                    <td className="border-r-[2px] border-white text-right px-6">0.00</td>
                                                    <td className="border-r-[2px] border-white"></td>
                                                    <td className="border-r-[2px] border-white text-right px-6 text-emerald-400">0.00</td>
                                                    <td className="text-right px-6">0.00</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 14 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE 14: SPECIAL DEPRECIATION TABLE PER LOT */}
                            <div className="w-[1800px] flex flex-col items-center mb-10 px-10">
                                <div className="w-full flex justify-between items-start mb-16">
                                    <div className="border-[6px] border-white p-10 bg-white/5 shadow-2xl">
                                        <h2 className="text-[54px] font-bold text-white text-center leading-tight mb-4" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                            តារាងគណនារំលស់ពិសេសតាមច្បាប់ស្តីពីវិនិយោគ
                                        </h2>
                                        <h1 className="text-[44px] font-black text-white text-center uppercase tracking-wider">
                                            SPECIAL DEPRECIATION TABLE PER LOT
                                        </h1>
                                    </div>
                                    <div className="flex flex-col gap-8">
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[28px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ / </span>
                                                <span className="text-[22px] font-black text-white/50 uppercase whitespace-nowrap">Tax Year :</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{char}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[28px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[22px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-8 h-[3px] bg-white opacity-40 mx-2 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SPECIAL DEPRECIATION TABLE */}
                                <div className="w-full border-[4px] border-white bg-white/5 overflow-hidden shadow-2xl">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-blue-600/10 border-b-[4px] border-white text-white h-40 text-[20px]">
                                                <th className="border-r-[2px] border-white p-4 w-[25%]">
                                                    <span className="block font-bold mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្នាក់នៃទ្រព្យសកម្មរូបី</span>
                                                    <span className="font-black uppercase tracking-tight">Classification of Tangible Assets</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-4 w-[20%]">
                                                    <span className="block font-bold mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រភេទទ្រព្យសកម្មរូបី</span>
                                                    <span className="font-black uppercase tracking-tight">Types of Tangible Assets</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-4 w-[18%]">
                                                    <span className="block font-bold mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃដើមទ្រព្យសកម្មរូបី</span>
                                                    <span className="font-black uppercase tracking-tight">Acquisition Cost of Tangible Assets (1)</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-4 w-[18%]">
                                                    <span className="block font-bold mb-2 text-blue-300" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រំលស់ពិសេសក្នុងគ្រា</span>
                                                    <span className="block font-bold mb-2 text-blue-400" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បញ្ចុះត្រឹមអត្រា ៤០%</span>
                                                    <span className="font-black uppercase tracking-tight opacity-70">Special Depreciation During the Period at Rate 40% (2)</span>
                                                </th>
                                                <th className="p-4 w-[19%] bg-white/5">
                                                    <span className="block font-bold mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្លៃនៅសល់មិនទាន់រំលស់នៅចុងគ្រា</span>
                                                    <span className="block font-bold mb-2 opacity-60" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការបន្តទៅផ្ទៃឧបសម្ព័ន្ធ(TOI 01/IX)</span>
                                                    <span className="font-black uppercase tracking-tight">Undepreciated Value at the End (3) = (1) - (2)</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-white text-[28px]">
                                            {[
                                                { kh: "១-ទ្រព្យរូបីថ្នាក់១", en: "Tangible Assets Class 1", key: "sd_c1" },
                                                { kh: "២-ទ្រព្យរូបីថ្នាក់២", en: "Tangible Assets Class 2", key: "sd_c2" },
                                                { kh: "៣-ទ្រព្យរូបីថ្នាក់៣", en: "Tangible Assets Class 3", key: "sd_c3" },
                                                { kh: "៤-ទ្រព្យរូបីថ្នាក់៤", en: "Tangible Assets Class 4", key: "sd_c4" }
                                            ].map((row, idx) => (
                                                <React.Fragment key={idx}>
                                                    <tr className="bg-white/10 h-24 border-b-[2px] border-white">
                                                        <td className="border-r-[2px] border-white px-8 font-bold flex flex-col justify-center h-24">
                                                            <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                            <span className="text-[18px] opacity-60">{row.en}</span>
                                                        </td>
                                                        <td className="border-r-[2px] border-white px-4 h-24"></td>
                                                        <td className="border-r-[2px] border-white px-4 h-24"></td>
                                                        <td className="border-r-[2px] border-white px-4 h-24"></td>
                                                        <td className="px-4 h-24 bg-white/5"></td>
                                                    </tr>
                                                    {[1, 2].map(line => (
                                                        <tr key={line} className="h-20 border-b border-white/10 hover:bg-white/5 transition-colors">
                                                            <td className="border-r-[2px] border-white px-8"></td>
                                                            <td className="border-r-[2px] border-white px-6"><input className="w-full bg-transparent outline-none text-[24px]" placeholder="..." /></td>
                                                            <td className="border-r-[2px] border-white px-6"><input className="w-full bg-transparent text-right outline-none font-black" placeholder="0.00" /></td>
                                                            <td className="border-r-[2px] border-white px-6"><input className="w-full bg-transparent text-right outline-none font-black text-blue-400" placeholder="0.00" /></td>
                                                            <td className="px-6 bg-white/5"><input className="w-full bg-transparent text-right outline-none font-black text-emerald-400" placeholder="0.00" /></td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                            {/* GRAND TOTAL ROW */}
                                            <tr className="h-28 bg-blue-600/30 border-t-[4px] border-white font-black">
                                                <td colSpan="2" className="border-r-[2px] border-white px-8 text-center text-[32px]">
                                                    <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុបរួម / </span> GRAND TOTAL
                                                </td>
                                                <td className="border-r-[2px] border-white px-6 text-right text-[32px]">0.00</td>
                                                <td className="border-r-[2px] border-white px-6 text-right text-[32px] text-blue-300">0.00</td>
                                                <td className="px-6 text-right text-[36px] text-emerald-300 bg-white/10 shadow-inner">0.00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* FOOTER NOTICE */}
                                <div className="mt-16 w-full max-w-7xl flex flex-col gap-6 p-10 bg-white/5 border-[3px] border-white/10 rounded-3xl text-[20px] italic text-white/50 leading-relaxed shadow-xl">
                                    <p>• បំណុលពិសេសនៃទ្រព្យរូបី នឹងត្រូវបានកាត់បន្ថយទឹកប្រាក់ចំណេញជាប់ពន្ធសម្រាប់ឆ្នាំជាប់ពន្ធប្រសិនបើវិនិយោគិនដែលជាកម្មសិទ្ធិគ្រប់គ្រាន់សម្រាប់ឆ្នាំជាប់ពន្ធ ប្រសិនបើបង្កើនវិនិយោគដែលច្បាប់មិនបានអនុញ្ញាតឱ្យប្រើប្រាស់សិទ្ធិទទួលបានរយៈពេលលើកលែងដូចមានចែងក្នុងកថាខណ្ឌ ៤ នៃមាត្រា ២០ថ្មី នៃច្បាប់ស្តីពីវិនិយោគនៃព្រះរាជាណាចក្រកម្ពុជា ។</p>
                                    <p>* A special depreciation of tangible assets shall be deducted in determining a QIP's taxable income for a taxation year if the investor elected not to use the entitlement under paragraph 4 of Article 20 (new) of the Law on the Amendment of the LOT (tax exempt period) as prescribed by paragraph 6 of Article 20 (new) of the Law on the Amendment of the LOT.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 15 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* LANDSCAPE CONTAINER FOR WIDE TABLE */}
                            <div className="w-[2400px] flex flex-col items-center">
                                {/* STANDARDIZED HEADER FOR PAGE 15 */}
                                <div className="w-full flex justify-between items-start mb-12 px-10">
                                    <div className="border-[6px] border-white p-10 bg-white/5 shadow-2xl max-w-4xl">
                                        <h2 className="text-[42px] font-bold text-white text-center leading-tight mb-4" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                            តារាងតម្លៃលើសឬចុះពីការលក់ចេញ ឬលក់ទ្រព្យសកម្មរយៈពេលវែងតាមច្បាប់ស្តីពីសារពើពន្ធ
                                        </h2>
                                        <h1 className="text-[32px] font-black text-white text-center uppercase tracking-wider">
                                            TABLE OF GAIN/(LOSS) ON DISPOSAL OR SALES OF FIXED ASSETS AS PER LAW ON TAXATION
                                        </h1>
                                    </div>
                                    <div className="flex flex-col gap-6">
                                        {/* TIN & YEAR BOXES */}
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[24px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ / </span>
                                                <span className="text-[18px] font-black text-white/50 uppercase whitespace-nowrap">Tax Year :</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{char}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[24px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[18px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-6 h-[2px] bg-white opacity-40 mx-1 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* DISPOSAL TABLE */}
                                <div className="w-full border-[4px] border-white bg-white/5 overflow-hidden shadow-2xl">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-800 border-b-[4px] border-white text-white h-48 text-[20px]">
                                                <th className="border-r-[2px] border-white p-3 w-[8%]">
                                                    <span className="block font-bold mb-2">ថ្ងៃ ខែ ឆ្នាំ ទិញ</span>
                                                    <span className="font-black uppercase text-[16px] opacity-60">Date of Acquisition</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-3 w-[8%]">
                                                    <span className="block font-bold mb-2">ថ្ងៃ ខែ ឆ្នាំ លក់</span>
                                                    <span className="font-black uppercase text-[16px] opacity-60">Date of Disposal/Sales</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-3 w-[15%]">
                                                    <span className="block font-bold mb-2">ប្រភេទនៃទ្រព្យសកម្មរយៈពេលវែង</span>
                                                    <span className="font-black uppercase text-[16px] opacity-60">Types of Fixed Assets</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-4 w-[12%]">
                                                    <span className="block font-bold mb-2">ឈ្មោះនៃទ្រព្យសកម្មរយៈពេលវែង</span>
                                                    <span className="font-black uppercase text-[16px] opacity-60">Name of Fixed Assets</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-3 w-[10%]">
                                                    <span className="block font-bold mb-1">ថ្លៃដើមមូលដ្ឋានរូបី</span>
                                                    <span className="font-black uppercase text-[16px] opacity-60">Historical Cost</span>
                                                    <span className="block mt-2 font-black text-indigo-400">(1)</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-3 w-[10%]">
                                                    <span className="block font-bold mb-1">រំលស់បង្គរ</span>
                                                    <span className="font-black uppercase text-[16px] opacity-60">Accumulated Depreciation</span>
                                                    <span className="block mt-2 font-black text-indigo-400">(2)</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-3 w-[11%] bg-white/5">
                                                    <span className="block font-bold mb-1">តម្លៃនៅសល់</span>
                                                    <span className="font-black uppercase text-[14px] opacity-60">Undepreciated Value (Net Book Value)</span>
                                                    <span className="block mt-2 font-black text-indigo-400">(3) = (1) - (2)</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-3 w-[10%]">
                                                    <span className="block font-bold mb-1">ផលពីការលក់ចេញ ឬលក់</span>
                                                    <span className="font-black uppercase text-[16px] opacity-60">Proceeds of Disposal / Sales</span>
                                                    <span className="block mt-2 font-black text-indigo-400">(4)</span>
                                                </th>
                                                <th className="p-3 w-[18%] bg-rose-500/10">
                                                    <span className="block font-bold mb-1">កម្រៃលើសឬចុះ</span>
                                                    <span className="font-black uppercase text-[16px] opacity-60">Gain / (Loss)</span>
                                                    <span className="block mt-2 font-black text-rose-400">(5) = (4) - (3)</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-white text-[24px]">
                                            {[
                                                { id: "១", kh: "ដីធ្លី", en: "Land", key: "disp_land", grayCols: [5] }, // 5th data col (Accumulated Depre) is (2) which is Col 6 in display
                                                { id: "២", kh: "ទ្រព្យអរូបី", en: "Intangible assets", key: "disp_intangible", grayCols: [] },
                                                { id: "៣", kh: "កសិកម្ម ធនធានធម្មជាតិ", en: "Agriculture, natural resources", key: "disp_agri", grayCols: [] },
                                                { id: "៤", kh: "ទ្រព្យរូបីថ្នាក់១រំលស់តាមវិធីសាស្ត្រខ្សែបន្ទាត់ត្រង់", en: "Straight-line depreciation assets (class 1)", key: "disp_c1", grayCols: [] },
                                                { id: "៥", kh: "ទ្រព្យរូបីថ្នាក់២រំលស់តាមវិធីសាស្ត្រថយចុះតាមសមតុល្យ", en: "Declining balance depreciation assets (class 2)", key: "disp_c2", grayCols: [5, 6] },
                                                { id: "៦", kh: "ទ្រព្យរូបីថ្នាក់៣រំលស់តាមវិធីសាស្ត្រថយចុះតាមសមតុល្យ", en: "Declining balance depreciation assets (class 3)", key: "disp_c3", grayCols: [5, 6] },
                                                { id: "៧", kh: "ទ្រព្យរូបីថ្នាក់៤រំលស់តាមវិធីសាស្ត្រថយចុះតាមសមតុល្យ", en: "Declining balance depreciation assets (class 4)", key: "disp_c4", grayCols: [5, 6] }
                                            ].map((row, idx) => (
                                                <React.Fragment key={idx}>
                                                    <tr className="bg-white/5 h-20 border-b border-white/20">
                                                        <td className="border-r-[2px] border-white"></td>
                                                        <td className="border-r-[2px] border-white"></td>
                                                        <td className="border-r-[2px] border-white px-6 font-bold flex flex-col justify-center h-20">
                                                            <div className="flex gap-2">
                                                                <span className="text-indigo-400">{row.id}-</span>
                                                                <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                            </div>
                                                            <span className="text-[14px] opacity-50 uppercase font-black ml-6">{row.en}</span>
                                                        </td>
                                                        <td className="border-r-[2px] border-white"></td>
                                                        <td className="border-r-[2px] border-white text-right px-4 opacity-40"></td>
                                                        <td className={`border-r-[2px] border-white text-right px-4 ${row.grayCols.includes(5) ? 'bg-white/10' : 'opacity-40'}`}></td>
                                                        <td className={`border-r-[2px] border-white text-right px-4 ${row.grayCols.includes(6) ? 'bg-white/10' : 'opacity-40'}`}></td>
                                                        <td className="border-r-[2px] border-white text-right px-4 opacity-40"></td>
                                                        <td className="text-right px-4 bg-rose-500/5 opacity-40"></td>
                                                    </tr>
                                                    {[1].map(line => (
                                                        <tr key={line} className="h-16 border-b border-white/10 hover:bg-white/5 transition-colors group">
                                                            <td className="border-r-[2px] border-white px-4 text-center">
                                                                <input className="w-full bg-transparent text-center outline-none text-[20px] opacity-60" placeholder="DD/MM/YY" />
                                                            </td>
                                                            <td className="border-r-[2px] border-white px-4 text-center">
                                                                <input className="w-full bg-transparent text-center outline-none text-[20px] opacity-60" placeholder="DD/MM/YY" />
                                                            </td>
                                                            <td className="border-r-[2px] border-white px-6"></td>
                                                            <td className="border-r-[2px] border-white px-6">
                                                                <input className="w-full bg-transparent outline-none text-[20px]" placeholder="..." />
                                                            </td>
                                                            <td className="border-r-[2px] border-white px-6">
                                                                <input className="w-full bg-transparent text-right outline-none font-black" placeholder="0.00" />
                                                            </td>
                                                            <td className={`border-r-[2px] border-white px-6 ${row.grayCols.includes(5) ? 'bg-white/20 select-none' : ''}`}>
                                                                {!row.grayCols.includes(5) && <input className="w-full bg-transparent text-right outline-none font-black text-indigo-300" placeholder="0.00" />}
                                                            </td>
                                                            <td className={`border-r-[2px] border-white px-6 ${row.grayCols.includes(6) ? 'bg-white/20 select-none' : 'bg-white/5 font-black text-right text-[22px]'}`}>
                                                                {!row.grayCols.includes(6) && "0.00"}
                                                            </td>
                                                            <td className="border-r-[2px] border-white px-6">
                                                                <input className="w-full bg-transparent text-right outline-none font-black text-emerald-400" placeholder="0.00" />
                                                            </td>
                                                            <td className="px-6 bg-rose-500/10 text-right font-black text-rose-300 text-[28px]">0.00</td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                            {/* GRAND TOTAL ROW */}
                                            <tr className="h-32 bg-slate-900 border-t-[4px] border-white font-black text-[32px]">
                                                <td colSpan="4" className="border-r-[2px] border-white px-8 text-center uppercase tracking-tighter">
                                                    <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុបរួម / </span> GRAND TOTAL
                                                </td>
                                                <td className="border-r-[2px] border-white px-6 text-right">0.00</td>
                                                <td className="border-r-[2px] border-white px-6 text-right text-indigo-300">0.00</td>
                                                <td className="border-r-[2px] border-white px-6 text-right opacity-60 bg-white/5">0.00</td>
                                                <td className="border-r-[2px] border-white px-6 text-right text-emerald-400">0.00</td>
                                                <td className="px-6 text-right text-rose-400 bg-rose-500/20 shadow-inner">0.00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* FOOTER PAGE INDICATOR */}
                                <div className="mt-10 self-end flex items-center gap-4 text-white/40 font-black italic">
                                    <div className="w-12 h-[2px] bg-white/20"></div>
                                    <span className="text-[24px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទំព័រទី ១៥/១៦</span>
                                    <span className="text-[18px] uppercase">Page 15/16</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 16 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* LANDSCAPE CONTAINER */}
                            <div className="w-[2000px] flex flex-col items-center">
                                {/* PAGE HEADER */}
                                <div className="w-full flex justify-between items-start mb-12 px-10">
                                    <div className="border-[6px] border-white p-10 bg-white/5 shadow-2xl max-w-4xl mx-auto flex flex-col items-center">
                                        <h2 className="text-[48px] font-bold text-white text-center leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                            ការគណនាបម្រុងទុក
                                        </h2>
                                        <h1 className="text-[36px] font-black text-white text-center uppercase tracking-[0.2em]">
                                            PROVISION CALCULATION TABLE
                                        </h1>
                                    </div>
                                    <div className="flex flex-col gap-6 absolute right-10 top-16">
                                        {/* TIN & YEAR BOXES */}
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[24px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ / </span>
                                                <span className="text-[18px] font-black text-white/50 uppercase whitespace-nowrap">Tax Year :</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{char}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[24px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-[18px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-6 h-[2px] bg-white opacity-40 mx-1 self-center" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[32px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PROVISION TABLE */}
                                <div className="w-full border-[4px] border-white bg-white/5 overflow-hidden shadow-2xl mt-10">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-800/80 border-b-[4px] border-white text-white h-44 text-[18px]">
                                                <th className="border-r-[2px] border-white p-3 w-[5%]">
                                                    <span className="block font-bold mb-2">ល.រ</span>
                                                    <span className="font-black uppercase text-[14px] opacity-60">No.</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-3 w-[25%]">
                                                    <span className="block font-bold mb-2">ប្រភេទបម្រុង (បញ្ជាក់ប្រភេទបម្រុងនីមួយៗ)</span>
                                                    <span className="font-black uppercase text-[14px] opacity-60">Type of Provisions (Describe Each Provision)</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-3 w-[15%]">
                                                    <span className="block font-bold mb-1">បម្រុងនៅដើមការិយបរិច្ឆេទ</span>
                                                    <span className="font-black uppercase text-[14px] opacity-60 leading-tight">Provision Amount at the<br />Beginning of the Period</span>
                                                    <span className="block mt-2 font-black text-blue-400">(1)</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-3 w-[15%]">
                                                    <span className="block font-bold mb-1">ការកើនឡើងនៃបម្រុងក្នុងអំឡុងការិយបរិច្ឆេទ</span>
                                                    <span className="font-black uppercase text-[14px] opacity-60 leading-tight">Increase in Provision<br />During the Period</span>
                                                    <span className="block mt-2 font-black text-blue-400">(2)</span>
                                                </th>
                                                <th className="border-r-[2px] border-white p-3 w-[15%]">
                                                    <span className="block font-bold mb-1">ការថយចុះនៃបម្រុងក្នុងអំឡុងការិយបរិច្ឆេទ</span>
                                                    <span className="font-black uppercase text-[14px] opacity-60 leading-tight">Decrease in Provision<br />During the Period</span>
                                                    <span className="block mt-2 font-black text-blue-400">(3)</span>
                                                </th>
                                                <th className="p-3 w-[20%] bg-white/5">
                                                    <span className="block font-bold mb-1">សមតុល្យបម្រុងនៅចុងការិយបរិច្ឆេទ</span>
                                                    <span className="font-black uppercase text-[14px] opacity-60 leading-tight">Balance of Provision at the<br />End of the Period</span>
                                                    <span className="block mt-2 font-black text-emerald-400">(4) = (1) + (2) - (3)</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-white text-[24px]">
                                            {[...Array(15)].map((_, idx) => (
                                                <tr key={idx} className="h-16 border-b border-white/10 hover:bg-white/5 transition-colors group">
                                                    <td className="border-r-[2px] border-white text-center text-white/40 font-bold">{idx + 1}</td>
                                                    <td className="border-r-[2px] border-white px-6">
                                                        <input className="w-full bg-transparent outline-none text-[22px]" placeholder="..." />
                                                    </td>
                                                    <td className="border-r-[2px] border-white px-6">
                                                        <input className="w-full bg-transparent text-right outline-none font-black text-blue-300" placeholder="0.00" />
                                                    </td>
                                                    <td className="border-r-[2px] border-white px-6 text-right">
                                                        <input className="w-full bg-transparent text-right outline-none font-black text-blue-300" placeholder="0.00" />
                                                    </td>
                                                    <td className="border-r-[2px] border-white px-6 text-right">
                                                        <input className="w-full bg-transparent text-right outline-none font-black text-blue-300" placeholder="0.00" />
                                                    </td>
                                                    <td className="px-6 bg-white/5 text-right font-black text-emerald-400 text-[26px]">
                                                        0.00
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* TOTAL ROW */}
                                            <tr className="h-28 bg-blue-600/30 border-t-[4px] border-white font-black text-[28px]">
                                                <td colSpan="2" className="border-r-[2px] border-white px-8 text-center uppercase tracking-widest">
                                                    <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប / </span> TOTAL
                                                </td>
                                                <td className="border-r-[2px] border-white px-6 text-right">0.00</td>
                                                <td className="border-r-[2px] border-white px-6 text-right">0.00</td>
                                                <td className="border-r-[2px] border-white px-6 text-right">0.00</td>
                                                <td className="px-6 text-right text-emerald-300 bg-white/10 shadow-inner text-[34px]">0.00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* FOOTER NOTICE */}
                                <div className="mt-12 w-full flex flex-col gap-4 p-8 bg-black/40 border-[3px] border-white/10 rounded-2xl shadow-xl">
                                    <p className="text-[20px] text-white/80 leading-relaxed font-bold italic" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                        សម្គាល់៖ ធនាគារក្នុងស្រុក ត្រូវភ្ជាប់មកជាមួយនូវតារាងលំអិតនៃបម្រុងទុក។ បម្រុងទុកលើហានិភ័យជាក់លាក់របស់ធនាគារក្នុងស្រុក ជាចំណាយកាត់កងបាន (ប្រកាសស្តីពីពន្ធលើប្រាក់ចំណូល ប្រការ ១៥)
                                    </p>
                                    <p className="text-[18px] text-white/50 uppercase font-black italic">
                                        NOTE: Domestic banks are required to attach detailed provision table. Specific provisions of these banks are deductible expenses (Praka 15 of Prakas Tax on Income).
                                    </p>
                                </div>

                                {/* FOOTER PAGE INDICATOR */}
                                <div className="mt-10 self-end flex items-center gap-4 text-white/40 font-black italic">
                                    <div className="w-12 h-[2px] bg-white/20"></div>
                                    <span className="text-[24px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទំព័រទី ១៦/១៦</span>
                                    <span className="text-[18px] uppercase">Page 16/16</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 17 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* LUXURY CONTAINER */}
                            <div className="w-[2200px] flex flex-col items-center">
                                {/* PAGE HEADER */}
                                <div className="w-full bg-slate-900 border-[6px] border-white p-12 shadow-2xl mb-12 flex flex-col items-center relative">
                                    <h2 className="text-[54px] font-bold text-white text-center leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                        ការបញ្ជាក់ប្រតិបត្តិការជាមួយភាគីពាក់ព័ន្ធ
                                    </h2>
                                    <h1 className="text-[38px] font-black text-white text-center uppercase tracking-[0.25em]">
                                        LIST OF RELATED-PARTY TRANSACTIONS
                                    </h1>

                                    {/* YEAR BOXES TOP RIGHT */}
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-6 bg-black/40 p-6 border-[3px] border-white/20">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[20px] font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ / </span>
                                            <span className="text-[16px] font-black text-white/40 uppercase">Tax Year :</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[32px] font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ENTERPRISE DETAILS STRIP */}
                                <div className="w-full grid grid-cols-2 gap-10 mb-12">
                                    <div className="bg-white/5 border-[3px] border-white/20 p-8 flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-white font-bold text-[24px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះសហគ្រាស :</span>
                                            <input className="flex-1 bg-transparent border-b-2 border-white/40 text-[28px] text-white font-bold outline-none px-2" defaultValue={formData.companyName} />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-white/60 font-black text-[18px] uppercase">Name of Enterprise :</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border-[3px] border-white/20 p-8 flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-white font-bold text-[24px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះជាអក្សរឡាតាំង :</span>
                                            <input className="flex-1 bg-transparent border-b-2 border-white/40 text-[28px] text-indigo-300 font-black outline-none px-2 uppercase" defaultValue={formData.companyNameLatin} />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-white/60 font-black text-[18px] uppercase">Name in Latin :</span>
                                        </div>
                                    </div>
                                </div>

                                {/* TIN SECTION */}
                                <div className="w-full bg-slate-950 p-8 border-[3px] border-white mb-16 flex items-center gap-8 shadow-xl">
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-[28px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                        <span className="text-white/40 font-black text-[18px] uppercase">Tax Identification Number (TIN):</span>
                                    </div>
                                    <div className="flex gap-2 ml-auto">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="w-14 h-20 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                <span className="text-[40px] font-black text-white">{(formData.tin || "")[i]}</span>
                                            </div>
                                        ))}
                                        <div className="w-8 h-[3px] bg-white opacity-40 mx-2 self-center" />
                                        {Array.from({ length: 9 }).map((_, i) => (
                                            <div key={i + 3} className="w-14 h-20 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                <span className="text-[40px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTION A & B: REVENUES AND EXPENSES */}
                                <div className="w-full flex flex-col gap-16">
                                    {[
                                        { id: "ក", kh: "ប្រតិបត្តិការចំណូលលក់ (ទៅឱ្យភាគីពាក់ព័ន្ធ)", en: "REVENUES/SALES (TO RELATED PARTIES)", ref: "A" },
                                        { id: "ខ", kh: "ប្រតិបត្តិការចំណាយទិញ (ពីភាគីពាក់ព័ន្ធ)", en: "EXPENSES/PURCHASES (FROM RELATED PARTIES)", ref: "B" }
                                    ].map((section, sIdx) => (
                                        <div key={sIdx} className="w-full">
                                            <div className="bg-slate-800 border-l-[12px] border-white p-6 mb-6">
                                                <h3 className="text-[32px] font-bold text-white mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{section.id}. {section.kh}</h3>
                                                <h4 className="text-[24px] font-black text-white/50 uppercase">{section.ref}. {section.en}</h4>
                                            </div>
                                            <div className="border-[4px] border-white overflow-hidden shadow-2xl">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-white/10 h-28 border-b-[4px] border-white text-[18px]">
                                                            <th className="border-r-[2px] border-white w-[5%]">No.</th>
                                                            <th className="border-r-[2px] border-white w-[25%] px-4">
                                                                <span className="block" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះភាគីពាក់ព័ន្ធ</span>
                                                                <span className="text-[14px] opacity-60">Name of Related Party</span>
                                                            </th>
                                                            <th className="border-r-[2px] border-white w-[20%] px-4">
                                                                <span className="block" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រទេសដែលភាគីពាក់ព័ន្ធចុះបញ្ជី</span>
                                                                <span className="text-[14px] opacity-60">Country Where Registered</span>
                                                            </th>
                                                            <th className="border-r-[2px] border-white w-[30%] px-4">
                                                                <span className="block" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយពីលក្ខណៈ និងប្រភេទប្រតិបត្តិការ</span>
                                                                <span className="text-[14px] opacity-60">Description of Transactions</span>
                                                            </th>
                                                            <th className="w-[20%] px-4">
                                                                <span className="block" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួនទឹកប្រាក់ (រៀល)</span>
                                                                <span className="text-[14px] opacity-60">Amounts (Riels)</span>
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-white text-[22px]">
                                                        {[1, 2, 3].map(rowIdx => (
                                                            <tr key={rowIdx} className="h-16 border-b border-white/10 hover:bg-white/5">
                                                                <td className="border-r-[2px] border-white text-center opacity-40">{rowIdx}</td>
                                                                <td className="border-r-[2px] border-white px-4"><input className="w-full bg-transparent outline-none" placeholder="..." /></td>
                                                                <td className="border-r-[2px] border-white px-4">
                                                                    <select className="w-full bg-slate-900 border-none outline-none appearance-none">
                                                                        <option>Cambodia</option>
                                                                        <option>Vietnam</option>
                                                                        <option>Thailand</option>
                                                                        <option>China</option>
                                                                        <option>Others...</option>
                                                                    </select>
                                                                </td>
                                                                <td className="border-r-[2px] border-white px-4"><input className="w-full bg-transparent outline-none" placeholder="..." /></td>
                                                                <td className="px-4"><input className="w-full bg-transparent text-right outline-none font-black text-amber-400" placeholder="0" /></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <p className="mt-4 text-white/40 italic text-[18px]">
                                                * Note: Enterprise must also record other revenues/expenses received/paid with related parties.
                                            </p>
                                        </div>
                                    ))}

                                    {/* SECTION C & D: LOANS */}
                                    <div className="grid grid-cols-1 gap-16">
                                        {[
                                            { id: "គ", kh: "កម្ចីផ្តល់ឱ្យភាគីពាក់ព័ន្ធ", en: "LOANS TO RELATED PARTIES", ref: "C" },
                                            { id: "ឃ", kh: "កម្ចីទទួលបានពីភាគីពាក់ព័ន្ធ", en: "LOANS FROM RELATED PARTIES", ref: "D" }
                                        ].map((section, sIdx) => (
                                            <div key={sIdx} className="w-full">
                                                <div className="bg-slate-800 border-l-[12px] border-indigo-500 p-6 mb-6">
                                                    <h3 className="text-[32px] font-bold text-white mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{section.id}. {section.kh}</h3>
                                                    <h4 className="text-[24px] font-black text-indigo-400/50 uppercase">{section.ref}. {section.en}</h4>
                                                </div>
                                                <div className="border-[4px] border-indigo-500/50 overflow-hidden shadow-2xl">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-indigo-500/10 h-28 border-b-[4px] border-indigo-500/50 text-[18px] text-white">
                                                                <th className="border-r-[2px] border-indigo-500/30 w-[5%]">No.</th>
                                                                <th className="border-r-[2px] border-indigo-500/30 w-[30%] px-4">Name of Related Party</th>
                                                                <th className="border-r-[2px] border-indigo-500/30 w-[20%] px-4">Country Registered</th>
                                                                <th className="border-r-[2px] border-indigo-500/30 w-[25%] px-4">Amount (Riels)</th>
                                                                <th className="w-[20%] px-4">Interest Rate (%)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="text-white text-[22px]">
                                                            {[1, 2].map(rowIdx => (
                                                                <tr key={rowIdx} className="h-16 border-b border-indigo-500/10 hover:bg-white/5">
                                                                    <td className="border-r-[2px] border-indigo-500/30 text-center opacity-40">{rowIdx}</td>
                                                                    <td className="border-r-[2px] border-indigo-500/30 px-4"><input className="w-full bg-transparent outline-none font-bold" placeholder="..." /></td>
                                                                    <td className="border-r-[2px] border-indigo-500/30 px-4"><input className="w-full bg-transparent outline-none" placeholder="Country" /></td>
                                                                    <td className="border-r-[2px] border-indigo-500/30 px-4"><input className="w-full bg-transparent text-right outline-none font-black text-blue-400" placeholder="0" /></td>
                                                                    <td className="px-4"><input className="w-full bg-transparent text-center outline-none font-black text-emerald-400" placeholder="0.00 %" /></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* SECTION E: TRANSFER PRICING */}
                                    <div className="w-full mt-8">
                                        <div className="bg-slate-900 border-[4px] border-white p-10 shadow-2xl flex items-center gap-12 group hover:bg-slate-800 transition-all cursor-pointer">
                                            <div className="w-20 h-20 border-[4px] border-white flex items-center justify-center bg-white/5 group-hover:bg-white transition-all">
                                                <div className="w-10 h-10 bg-white group-hover:bg-slate-900" />
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="text-[36px] font-bold text-white mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ង. ឯកសារស្តីពីការផ្ទេរថ្លៃ</h3>
                                                <h4 className="text-[28px] font-black text-white/50 uppercase">E. DOCUMENT OF TRANSFER PRICING</h4>
                                            </div>
                                            <div className="ml-auto px-8 py-4 bg-white/10 border-[2px] border-white/20 text-white/60 font-black italic uppercase">
                                                Compliance Required
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER PAGE INDICATOR */}
                                <div className="mt-24 self-end flex items-center gap-4 text-white/40 font-black italic">
                                    <div className="w-12 h-[2px] bg-white/20"></div>
                                    <span className="text-[24px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទំព័រទី ១៧/១៧</span>
                                    <span className="text-[18px] uppercase">Page 17/17</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 18 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* LUXURY WIDE CONTAINER */}
                            <div className="w-[2000px] flex flex-col items-center">
                                {/* HEADER BLOCK */}
                                <div className="w-full flex justify-between items-end mb-10 pb-6 border-b-[4px] border-white/20">
                                    <div className="flex flex-col gap-6 w-full max-w-4xl">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-[22px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-white/40 font-black text-[14px] uppercase tracking-tighter">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-1.5 h-14 items-center">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-10 h-14 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[28px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-6 h-[2.5px] bg-white opacity-40 mx-1" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-10 h-14 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[28px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-[22px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះសហគ្រាស :</span>
                                                <span className="text-white/40 font-black text-[14px] uppercase tracking-tighter">Name of Enterprise :</span>
                                            </div>
                                            <div className="flex-1 max-w-2xl border-b-[3px] border-white/40 pb-1">
                                                <span className="text-[28px] font-black text-white uppercase">{formData.companyNameLatin || "...................................................................."}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-6">
                                        <div className="bg-white text-slate-950 px-10 py-4 font-black text-[32px] skew-x-[-12deg] shadow-xl">
                                            ឧបសម្ព័ន្ធ ២ / <span className="text-[24px]">Annex 2</span>
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white shadow-2xl">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[20px] font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                                                <span className="text-[16px] font-black text-white/50 uppercase whitespace-nowrap">Tax Year</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                    <div key={i} className="w-10 h-14 border-[3px] border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <span className="text-[28px] font-black text-white">{char}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ANNEX 2 TABLE */}
                                <div className="w-full border-[4px] border-white bg-white/5 overflow-hidden shadow-2xl">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-800 border-b-[4px] border-white text-white text-center h-48">
                                                <th className="border-r-[2px] border-white px-3 w-[10%]">
                                                    <span className="block font-bold mb-2 text-[18px]">ថ្ងៃ ខែ ឆ្នាំ ទិញ</span>
                                                    <span className="text-[13px] font-black uppercase opacity-60">Date of Acquisition</span>
                                                </th>
                                                <th className="border-r-[2px] border-white px-4 w-[20%]">
                                                    <span className="block font-bold mb-2 text-[18px]">ប្រភេទនៃទ្រព្យសកម្មរយៈពេលវែង</span>
                                                    <span className="text-[13px] font-black uppercase opacity-60">Types of Fixed Assets</span>
                                                </th>
                                                <th className="border-r-[2px] border-white px-3 w-[16%]">
                                                    <span className="block font-bold mb-2 text-[18px]">ថ្លៃដើមមូលដ្ឋាននៅដើមគ្រា</span>
                                                    <span className="text-[13px] font-black uppercase opacity-60">Historical Cost at Start</span>
                                                    <span className="block mt-2 font-black text-blue-400">(1)</span>
                                                </th>
                                                <th className="border-r-[2px] border-white px-3 w-[18%]">
                                                    <span className="block font-bold mb-2 text-[18px]">ទិញបន្ថែមក្នុងគ្រា</span>
                                                    <span className="text-[13px] font-black uppercase opacity-60 leading-tight">Acquisition, Transfer-in during the Period</span>
                                                    <span className="block mt-2 font-black text-blue-400">(2)</span>
                                                </th>
                                                <th className="border-r-[2px] border-white px-3 w-[16%]">
                                                    <span className="block font-bold mb-2 text-[18px]">លក់ចេញក្នុងគ្រា</span>
                                                    <span className="text-[13px] font-black uppercase opacity-60 leading-tight">Cost of Fixed Asset Disposal</span>
                                                    <span className="block mt-2 font-black text-blue-400">(3)</span>
                                                </th>
                                                <th className="px-3 w-[20%] bg-white/5">
                                                    <span className="block font-bold mb-2 text-[18px] text-emerald-300">តម្លៃមូលដ្ឋានគណនារំលស់</span>
                                                    <span className="text-[13px] font-black uppercase opacity-60">Depreciation Base Value</span>
                                                    <span className="block mt-2 font-black text-emerald-400">(4) = (1) + (2) - (3)</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-white text-[22px]">
                                            {[
                                                { title: "I. ទីស្នាក់ការកណ្តាល", sub: "I. Head Office", rows: 10, key: "ho" },
                                                { title: "II. សាខាសហគ្រាសទី១", sub: "II. Branch 1", rows: 4, key: "b1" },
                                                { title: "III. សាខាសហគ្រាសទី ...", sub: "III. Branch ...", rows: 8, key: "bn" }
                                            ].map((section, sIdx) => (
                                                <React.Fragment key={sIdx}>
                                                    <tr className="bg-white/10 h-16 border-y-[2px] border-white">
                                                        <td colSpan="6" className="px-8 font-black flex items-center h-16 gap-4">
                                                            <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }} className="text-[28px]">{section.title}</span>
                                                            <span className="text-[20px] opacity-40 uppercase tracking-widest">{section.sub}</span>
                                                        </td>
                                                    </tr>
                                                    {[...Array(section.rows)].map((_, rIdx) => (
                                                        <tr key={rIdx} className="h-14 border-b border-white/10 hover:bg-white/5 transition-colors group">
                                                            <td className="border-r-[2px] border-white px-4 text-center">
                                                                <input className="w-full bg-transparent text-center outline-none text-[18px] opacity-40" placeholder="DD/MM/YY" />
                                                            </td>
                                                            <td className="border-r-[2px] border-white px-6">
                                                                <input className="w-full bg-transparent outline-none text-[18px]" placeholder="..." />
                                                            </td>
                                                            <td className="border-r-[2px] border-white px-4">
                                                                <input className="w-full bg-transparent text-right outline-none font-black text-blue-400/60" placeholder="0" />
                                                            </td>
                                                            <td className="border-r-[2px] border-white px-4 text-right">
                                                                <input className="w-full bg-transparent text-right outline-none font-black text-blue-400/60" placeholder="0" />
                                                            </td>
                                                            <td className="border-r-[2px] border-white px-4 text-right">
                                                                <input className="w-full bg-transparent text-right outline-none font-black text-blue-400/60" placeholder="0" />
                                                            </td>
                                                            <td className="px-4 bg-white/5 text-right font-black text-emerald-400/70">
                                                                0
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr className="h-16 bg-slate-900 border-b-[2px] border-white font-black text-[24px]">
                                                        <td colSpan="2" className="border-r-[2px] border-white px-8 uppercase tracking-tighter text-center italic text-white/60">
                                                            <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុប / </span> Sub-Total
                                                        </td>
                                                        <td className="border-r-[2px] border-white px-4 text-right">0</td>
                                                        <td className="border-r-[2px] border-white px-4 text-right">0</td>
                                                        <td className="border-r-[2px] border-white px-4 text-right">0</td>
                                                        <td className="px-4 bg-emerald-500/10 text-right text-emerald-300">0</td>
                                                    </tr>
                                                </React.Fragment>
                                            ))}
                                            {/* GRAND TOTAL */}
                                            <tr className="h-28 bg-white text-slate-950 font-black text-[32px] border-t-[4px] border-slate-950">
                                                <td colSpan="2" className="px-8 text-center uppercase tracking-[0.2em]">
                                                    <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុបរួម / </span> GRAND TOTAL
                                                </td>
                                                <td className="border-x-[2px] border-slate-950 px-4 text-right">0</td>
                                                <td className="border-r-[2px] border-slate-950 px-4 text-right">0</td>
                                                <td className="border-r-[2px] border-slate-950 px-4 text-right">0</td>
                                                <td className="px-4 text-right bg-emerald-100/50">0</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* FOOTER NOTICE */}
                                <div className="mt-10 w-full flex flex-col gap-4 p-8 bg-white/5 border-[3px] border-white/10 rounded-3xl shadow-2xl">
                                    <p className="text-[20px] text-white/80 italic leading-relaxed" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                        ក្នុងករណី ទ្រព្យសកម្មរយៈពេលវែងមានចំនួនច្រើន អ្នកជាប់ពន្ធអាចភ្ជាប់បញ្ជីឈ្មោះទ្រព្យសកម្មរយៈពេលវែងដោយមិនចាំបាច់បំពេញតារាងខាងលើ ។
                                    </p>
                                    <p className="text-[16px] text-white/40 uppercase font-black italic tracking-tight">
                                        In case there are too many fixed assets, taxpayers can attach lists of fixed assets without completing the above table.
                                    </p>
                                </div>

                                {/* FOOTER PAGE INDICATOR */}
                                <div className="mt-20 self-end flex items-center gap-4 text-white/40 font-black italic">
                                    <div className="w-12 h-[2px] bg-white/20"></div>
                                    <span className="text-[24px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទំព័រទី ១៨/១៨</span>
                                    <span className="text-[18px] uppercase">Page 18/18</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 19 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* LUXURY WIDE CONTAINER */}
                            <div className="w-[1800px] flex flex-col items-center">
                                {/* PAGE TITLE */}
                                <div className="w-full flex flex-col items-center mb-10">
                                    <h2 className="text-[36px] font-bold text-white text-center mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                        ឧបសម្ព័ន្ធភ្ជាប់ជាមួយលិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ (សាខាសហគ្រាសក្នុងស្រុក)
                                    </h2>
                                    <h1 className="text-[28px] font-black text-white text-center uppercase tracking-tight">
                                        ANNEX TO THE ANNUAL INCOME TAX RETURN (FOR LOCAL BRANCH)
                                    </h1>
                                </div>

                                {/* TAX PERIOD SECTION */}
                                <div className="w-full bg-white/5 border-[3px] border-white p-8 mb-10 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទសារពើពន្ធ ( ចំនួនខែ ) :</span>
                                            <span className="text-white/40 font-black text-[14px] uppercase">Tax Period (Number of Month) :</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2].map((_, i) => (
                                                <div key={i} className="w-10 h-12 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-white font-black text-[24px]">12</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-white border-b-[10px] border-b-transparent" />
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចាប់ពី</span>
                                                <span className="text-white/40 font-black text-[14px] uppercase">From</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {[...Array(8)].map((_, i) => (
                                                    <div key={i} className="w-8 h-10 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                        <span className="text-white font-black text-[18px]">0</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដល់</span>
                                                <span className="text-white/40 font-black text-[14px] uppercase">Until</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {[...Array(8)].map((_, i) => (
                                                    <div key={i} className="w-8 h-10 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                        <span className="text-white font-black text-[18px]">0</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* MAIN INFORMATION FORM */}
                                <div className="w-full flex flex-col gap-6">
                                    {/* 1. TIN */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-[350px] flex flex-col">
                                            <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                            <span className="text-white/40 font-black text-[14px] uppercase">Tax Identification Number (TIN):</span>
                                        </div>
                                        <div className="flex gap-1.5 items-center">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="w-10 h-14 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[28px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                </div>
                                            ))}
                                            <div className="w-6 h-[3px] bg-white opacity-40 mx-1" />
                                            {Array.from({ length: 9 }).map((_, i) => (
                                                <div key={i + 3} className="w-10 h-14 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[28px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. Barcode */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-[350px] flex flex-col">
                                            <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>២. លេខបារកូដសម្គាល់សាខា ៖</span>
                                            <span className="text-white/40 font-black text-[14px] uppercase">2. Tax Barcode Branch :</span>
                                        </div>
                                        <div className="flex gap-1.5 items-center">
                                            {[...Array(8)].map((_, i) => (
                                                <div key={i} className="w-10 h-14 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[28px] font-black text-white/20">0</span>
                                                </div>
                                            ))}
                                            <div className="w-6 h-[3px] bg-white opacity-40 mx-1" />
                                            {[...Array(4)].map((_, i) => (
                                                <div key={i} className="w-10 h-14 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[28px] font-black text-white/20">0</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 3. Name of Branch */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-[350px] flex flex-col">
                                            <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៣. ឈ្មោះសាខាសហគ្រាស ៖</span>
                                            <span className="text-white/40 font-black text-[14px] uppercase">3. Name of Enterprise's Branch :</span>
                                        </div>
                                        <input className="flex-1 bg-white/5 border-b-[3px] border-white px-6 h-14 text-white font-black text-[24px] outline-none" placeholder="..." />
                                    </div>

                                    {/* 4. Name of Enterprise */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-[350px] flex flex-col">
                                            <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៤. ឈ្មោះសហគ្រាស ( ការិយាល័យកណ្តាល ) :</span>
                                            <span className="text-white/40 font-black text-[14px] uppercase">4. Name of Enterprise (Head Office) :</span>
                                        </div>
                                        <input className="flex-1 bg-white/5 border-b-[3px] border-white px-6 h-14 text-white font-black text-[24px] outline-none" defaultValue={formData.companyNameLatin} />
                                    </div>

                                    {/* 5. Reg Dates */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-[350px] flex flex-col">
                                            <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៥. ថ្ងៃ ខែ ឆ្នាំចុះបញ្ជីជាមួយរដ្ឋបាលសារពើពន្ធជាសាខា ៖</span>
                                            <span className="text-white/40 font-black text-[14px] uppercase">5. Registered Date with Tax Administration as Branch :</span>
                                        </div>
                                        <div className="w-[200px] h-14 border-[3px] border-white bg-white/5 flex items-center justify-center">
                                            <input className="w-full bg-transparent text-center outline-none text-white font-black text-[22px]" placeholder="DD/MM/YYYY" />
                                        </div>
                                        <div className="flex flex-col ml-10">
                                            <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ថ្ងៃ ខែ ឆ្នាំ សុពលភាព លិខិតបញ្ជាក់សាខា ៖</span>
                                            <span className="text-white/40 font-black text-[14px] uppercase">Valid Date of Branch Registration :</span>
                                        </div>
                                        <div className="w-[200px] h-14 border-[3px] border-white bg-white/5 flex items-center justify-center">
                                            <input className="w-full bg-transparent text-center outline-none text-white font-black text-[22px]" placeholder="DD/MM/YYYY" />
                                        </div>
                                    </div>

                                    {/* 6. Branch Director */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-[350px] flex flex-col">
                                            <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៦. ឈ្មោះនាយកសាខាសហគ្រាស ៖</span>
                                            <span className="text-white/40 font-black text-[14px] uppercase">6. Name of Branch Director :</span>
                                        </div>
                                        <input className="flex-1 bg-white/5 border-b-[3px] border-white px-6 h-14 text-white font-black text-[24px] outline-none" placeholder="..." />
                                    </div>

                                    {/* 7. Activities */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-[350px] flex flex-col">
                                            <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៧. សកម្មភាពអាជីវកម្មចម្បងរបស់សាខា ៖</span>
                                            <span className="text-white/40 font-black text-[14px] uppercase">7. Main Business Activities of the Branch :</span>
                                        </div>
                                        <input className="flex-1 bg-white/5 border-b-[3px] border-white px-6 h-14 text-white font-black text-[24px] outline-none" placeholder="..." />
                                    </div>

                                    {/* 8. Address */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-6">
                                            <div className="w-[350px] flex flex-col">
                                                <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៨. អាសយដ្ឋានសាកលបច្ចុប្បន្ន ៖</span>
                                                <span className="text-white/40 font-black text-[14px] uppercase">8. Current Registered Address of the Branch :</span>
                                            </div>
                                            <input className="flex-1 bg-white/5 border-b-[3px] border-white px-6 h-14 text-white font-black text-[20px] outline-none" placeholder="..." />
                                        </div>
                                    </div>

                                    {/* 9. Warehouse Address */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start gap-6">
                                            <div className="w-[350px] flex flex-col">
                                                <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>៩. អាសយដ្ឋានឃ្លាំងបច្ចុប្បន្នរបស់សាខា ៖</span>
                                                <span className="text-white/40 font-black text-[14px] uppercase">9. Current Warehouse Address of the Branch :</span>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-2">
                                                {["ក / A", "ខ / B", "គ / C"].map((label, i) => (
                                                    <div key={i} className="flex items-center gap-4">
                                                        <div className="w-20 font-black text-white text-[18px] text-center border-[2px] border-white/40 p-1">{label} :</div>
                                                        <input className="flex-1 bg-white/5 border-b-[2px] border-white/40 px-4 h-10 text-white outline-none" placeholder="..." />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 10. Accounting Records */}
                                    <div className="flex items-start gap-6 mt-4">
                                        <div className="w-[350px] flex flex-col">
                                            <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>១០. ការកត់ត្រាបញ្ជីការគណនេយ្យ ៖</span>
                                            <span className="text-white/40 font-black text-[14px] uppercase">10. Accounting Records :</span>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-4">
                                            <div className="flex items-center gap-6">
                                                <div className="w-10 h-10 border-[4px] border-white bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20">
                                                    <div className="w-5 h-5 bg-white opacity-0" /> {/* Checkmark placeholder */}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ ( ឈ្មោះកម្មវិធី ) ៖</span>
                                                    <span className="text-white/40 font-black text-[12px] uppercase">Using Accounting Software (Software's name) :</span>
                                                </div>
                                                <input className="flex-1 bg-white/5 border-b-[2px] border-white/40 px-4 h-10 text-white outline-none" placeholder="..." />
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="w-10 h-10 border-[4px] border-white bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20">
                                                    <div className="w-5 h-5 bg-white opacity-0" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ</span>
                                                    <span className="text-white/40 font-black text-[12px] uppercase">Not Using Accounting Software</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* EMPLOYEE TABLE */}
                                <div className="w-full mt-16 border-[4px] border-white bg-white/5 overflow-hidden shadow-2xl">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-800 border-b-[4px] border-white text-white text-center h-28">
                                                <th className="border-r-[2px] border-white w-[50%] p-4">
                                                    <span className="block font-bold mb-2 text-[20px]">បរិយាយ</span>
                                                    <span className="text-[14px] font-black uppercase opacity-60">Description</span>
                                                </th>
                                                <th className="border-r-[2px] border-white w-[12.5%] p-4">
                                                    <span className="block font-bold mb-2 text-[18px]">តួនាទី</span>
                                                    <span className="text-[14px] font-black uppercase opacity-60">Position</span>
                                                </th>
                                                <th className="border-r-[2px] border-white w-[10%] p-4">
                                                    <span className="block font-bold mb-2 text-[18px]">ចំនួន</span>
                                                    <span className="text-[14px] font-black uppercase opacity-60">Number</span>
                                                </th>
                                                <th className="border-r-[2px] border-white w-[15%] p-4">
                                                    <span className="block font-bold mb-2 text-[18px]">ប្រាក់បៀវត្ស ក្រៅពីអត្ថប្រយោជន៍បន្ថែម</span>
                                                    <span className="text-[12px] font-black uppercase opacity-60">Salary Excluded Fringe Benefits</span>
                                                </th>
                                                <th className="w-[12.5%] p-4">
                                                    <span className="block font-bold mb-2 text-[18px]">អត្ថប្រយោជន៍បន្ថែម</span>
                                                    <span className="text-[14px] font-black uppercase opacity-60">Fringe Benefits</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-white text-[20px]">
                                            <tr className="h-20 border-b border-white/10">
                                                <td className="border-r-[2px] border-white px-8 font-black">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 border-[2px] border-white/40 flex items-center justify-center text-[18px]">១</div>
                                                        <div className="flex flex-col">
                                                            <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះអ្នកគ្រប់គ្រង / ថ្នាក់ដឹកនាំសាខា</span>
                                                            <span className="text-[14px] opacity-40 uppercase">Name of Branch Management</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="border-r-[2px] border-white px-4 text-center">...</td>
                                                <td className="border-r-[2px] border-white px-4 text-center">...</td>
                                                <td className="border-r-[2px] border-white px-4 text-right">...</td>
                                                <td className="px-4 text-right">...</td>
                                            </tr>
                                            {[
                                                { id: "២", kh: "សរុបបុគ្គលិក-កម្មករ", en: "Total of Employees and Workers" },
                                                { id: "៣", kh: "បុគ្គលិក-កម្មករដែលជាប់ពន្ធលើប្រាក់បៀវត្ស", en: "Employees and Workers Taxable Salary" }
                                            ].map((row, i) => (
                                                <tr key={i} className="h-20 border-b border-white/10 last:border-0 hover:bg-white/5">
                                                    <td className="border-r-[2px] border-white px-8 font-black">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 border-[2px] border-white/40 flex items-center justify-center text-[18px]">{row.id}</div>
                                                            <div className="flex flex-col">
                                                                <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                                <span className="text-[14px] opacity-40 uppercase">{row.en}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="border-r-[2px] border-white bg-slate-400 opacity-20" colSpan="2" />
                                                    <td className="border-r-[2px] border-white px-4 text-right">0.00</td>
                                                    <td className="px-4 text-right">0.00</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* FOOTER NOTICE */}
                                <div className="mt-8 w-full flex flex-col gap-2 p-6 bg-white/5 border-[3px] border-white/10 rounded-2xl">
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col min-w-[100px]">
                                            <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សម្គាល់ ៖</span>
                                            <span className="text-white/40 font-black text-[14px] uppercase">NOTE :</span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <p className="text-white/70 italic text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                                ឧបសម្ព័ន្ធនេះត្រូវភ្ជាប់ជាមួយលិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ។ / <span className="text-[14px] uppercase font-black opacity-40">The annex has to be attached with the Annual Income Tax Return.</span>
                                            </p>
                                            <p className="text-white/70 italic text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                                សាខាសហគ្រាសនីមួយៗ ត្រូវបំពេញឧបសម្ព័ន្ធនេះដាច់ដោយឡែកពីគ្នា។ / <span className="text-[14px] uppercase font-black opacity-40">Each local branch must complete this annex individually.</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER PAGE INDICATOR */}
                                <div className="mt-16 self-end flex items-center gap-4 text-white/40 font-black italic">
                                    <div className="w-12 h-[2px] bg-white/20"></div>
                                    <span className="text-[24px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទំព័រទី ១៩/១៩</span>
                                    <span className="text-[18px] uppercase">Page 19/19</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 20 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* LUXURY WIDE CONTAINER */}
                            <div className="w-[1600px] flex flex-col items-center">
                                {/* HEADER SECTION */}
                                <div className="w-full flex justify-between items-start mb-10 pb-6 border-b-[4px] border-white/20">
                                    <div className="flex flex-col gap-6 w-full max-w-3xl">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-[20px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                                <span className="text-white/40 font-black text-[14px] uppercase tracking-tighter">Tax Identification Number (TIN):</span>
                                            </div>
                                            <div className="flex gap-1.5 h-12 items-center">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="w-9 h-12 border-[2px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[24px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                    </div>
                                                ))}
                                                <div className="w-5 h-[2px] bg-white opacity-40 mx-1" />
                                                {Array.from({ length: 9 }).map((_, i) => (
                                                    <div key={i + 3} className="w-9 h-12 border-[2px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[24px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col min-w-[200px]">
                                                <span className="text-white font-bold text-[20px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះសាខាសហគ្រាស ៖</span>
                                                <span className="text-white/40 font-black text-[14px] uppercase tracking-tighter">Name of Enterprise's Branch :</span>
                                            </div>
                                            <input className="flex-1 bg-white/5 border-b-[2px] border-white/40 px-6 h-12 text-white font-black text-[22px] outline-none" placeholder="..." />
                                        </div>
                                    </div>

                                    <div className="bg-white/10 p-6 border-[4px] border-white shadow-2xl skew-x-[-10deg]">
                                        <div className="skew-x-[10deg] flex flex-col items-center">
                                            <span className="text-white font-bold text-[28px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឧបសម្ព័ន្ធ ៣ (ត)</span>
                                            <span className="text-white/60 font-black text-[22px] uppercase">Annex 3 (Con't)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ANNEX 3 TABLE */}
                                <div className="w-full border-[4px] border-white bg-white/5 overflow-hidden shadow-2xl">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-800 border-b-[4px] border-white text-white text-center h-28">
                                                <th className="border-r-[2px] border-white w-[50%] px-8">
                                                    <span className="block font-bold text-[22px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                                                    <span className="text-[14px] font-black uppercase opacity-60">Description</span>
                                                </th>
                                                <th className="border-r-[2px] border-white w-[10%]">
                                                    <span className="block font-bold text-[20px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោង</span>
                                                    <span className="text-[14px] font-black uppercase opacity-60">Ref.</span>
                                                </th>
                                                <th className="border-r-[2px] border-white w-[20%]">
                                                    <span className="block font-bold text-[20px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទនេះ (N)</span>
                                                    <span className="text-[14px] font-black uppercase opacity-60">Current Year (N)</span>
                                                </th>
                                                <th className="w-[20%]">
                                                    <span className="block font-bold text-[20px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទមុន (N-1)</span>
                                                    <span className="text-[14px] font-black uppercase opacity-60">Last Year (N-1)</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-white text-[20px]">
                                            {/* OPERATING REVENUES */}
                                            <tr className="bg-white/10 h-16 font-black border-b border-white/20">
                                                <td className="border-r-[2px] border-white px-8">
                                                    <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលប្រតិបត្តិការ</span> / Operating Revenues
                                                </td>
                                                <td className="border-r-[2px] border-white text-center text-indigo-300">H 0</td>
                                                <td className="border-r-[2px] border-white bg-white/5"></td>
                                                <td></td>
                                            </tr>
                                            {[
                                                { kh: "ការលក់ផលិតផល", en: "Sales of products", ref: "H 1" },
                                                { kh: "ការលក់ទំនិញ", en: "Sales of goods", ref: "H 2" },
                                                { kh: "ការផ្តល់សេវា", en: "Supplies of services", ref: "H 3" },
                                                { kh: "ចំណូលផ្សេងទៀត", en: "Other revenues", ref: "H 4" },
                                            ].map((row, i) => (
                                                <tr key={i} className="h-14 border-b border-white/10 hover:bg-white/5 group">
                                                    <td className="border-r-[2px] border-white px-12">
                                                        <span className="font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="block text-[14px] opacity-40 uppercase leading-none mt-1">{row.en}</span>
                                                    </td>
                                                    <td className="border-r-[2px] border-white text-center opacity-40 font-black">{row.ref}</td>
                                                    <td className="border-r-[2px] border-white px-6">
                                                        <input className="w-full bg-transparent text-right outline-none font-black text-emerald-400" placeholder="-" />
                                                    </td>
                                                    <td className="px-6">
                                                        <input className="w-full bg-transparent text-right outline-none font-black text-white/30" placeholder="-" />
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* OPERATING EXPENSES */}
                                            <tr className="bg-white/10 h-16 font-black border-y border-white/20">
                                                <td className="border-r-[2px] border-white px-8">
                                                    <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយប្រតិបត្តិការ</span> / Operating Expenses
                                                </td>
                                                <td className="border-r-[2px] border-white text-center text-rose-300">H 5</td>
                                                <td className="border-r-[2px] border-white bg-white/5"></td>
                                                <td></td>
                                            </tr>
                                            {[
                                                { kh: "ចំណាយបៀវត្ស", en: "Salary expenses", ref: "H 6" },
                                                { kh: "ចំណាយប្រេង ឧស្ម័ន អគ្គិសនី និងទឹក", en: "Fuel, gas, electricity and water expenses", ref: "H 7" },
                                                { kh: "ចំណាយធ្វើដំណើរ និងចំណាយស្នាក់នៅ", en: "Travelling and accommodation expenses", ref: "H 8" },
                                                { kh: "ចំណាយដឹកជញ្ជូន", en: "Transportation expenses", ref: "H 9" },
                                                { kh: "ចំណាយលើការជួល", en: "Rental expenses", ref: "H 10" },
                                                { kh: "ចំណាយលើការថែទាំ និងជួសជុល", en: "Repair and maintenance expenses", ref: "H 11" },
                                                { kh: "ចំណាយលើការកម្សាន្តសប្បាយ", en: "Entertainment expenses", ref: "H 12" },
                                                { kh: "ចំណាយកម្រៃជើងសា ផ្សាយពាណិជ្ជកម្ម និងចំណាយការលក់", en: "Commission, advertising, and selling expenses", ref: "H 13" },
                                                { kh: "ចំណាយសេវាគ្រប់គ្រង ពិគ្រោះយោបល់ បច្ចេកទេស និងសេវាប្រហាក់ប្រហែល", en: "Management, consulting, technical, and other similar service expenses", ref: "H 14" },
                                                { kh: "ចំណាយលើបំណុលអាក្រក់បានបោះបង់", en: "Written-off bad debt expenses", ref: "H 15" },
                                                { kh: "ចំណាយផ្សេងៗ", en: "Other expenses", ref: "H 16" },
                                            ].map((row, i) => (
                                                <tr key={i} className="h-14 border-b border-white/10 hover:bg-white/5 group last:border-0">
                                                    <td className="border-r-[2px] border-white px-12">
                                                        <span className="font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="block text-[14px] opacity-40 uppercase leading-none mt-1">{row.en}</span>
                                                    </td>
                                                    <td className="border-r-[2px] border-white text-center opacity-40 font-black">{row.ref}</td>
                                                    <td className="border-r-[2px] border-white px-6">
                                                        <input className="w-full bg-transparent text-right outline-none font-black text-rose-400/80" placeholder="-" />
                                                    </td>
                                                    <td className="px-6">
                                                        <input className="w-full bg-transparent text-right outline-none font-black text-white/30" placeholder="-" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* FOOTER PAGE INDICATOR */}
                                <div className="mt-20 self-end flex items-center gap-4 text-white/40 font-black italic">
                                    <div className="w-12 h-[2px] bg-white/20"></div>
                                    <span className="text-[24px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទំព័រទី ២០/២០</span>
                                    <span className="text-[18px] uppercase">Page 20/20</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 21 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* LUXURY WIDE CONTAINER */}
                            <div className="w-[1400px] flex flex-col items-center">
                                {/* TOP ANNEX BADGE */}
                                <div className="self-end mb-8">
                                    <div className="bg-white/10 px-8 py-3 border-[3px] border-white shadow-xl skew-x-[-12deg]">
                                        <span className="text-white font-black text-[22px] skew-x-[12deg] block uppercase">Annex 4</span>
                                    </div>
                                </div>

                                {/* MAIN TITLES */}
                                <div className="w-full flex flex-col items-center mb-12">
                                    <h2 className="text-[34px] font-bold text-white text-center leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                        ពន្ធលើប្រាក់ចំណូលលើសកម្រិតលើប្រតិបត្តិការធនធានរ៉ែ / ប្រេងកាត
                                    </h2>
                                    <h1 className="text-[28px] font-black text-white text-center uppercase tracking-[0.15em]">
                                        EXCESS INCOME TAX ON MINING / OIL AND GAS OPERATIONS
                                    </h1>
                                </div>

                                {/* TIN & YEAR BLOCK */}
                                <div className="w-full flex justify-between items-center mb-12">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[18px] font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                            <span className="text-[13px] font-black text-white/40 uppercase">Tax Identification Number (TIN):</span>
                                        </div>
                                        <div className="flex gap-1.5 h-12">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="w-9 h-12 border-[2px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[24px] font-black text-white">{(formData.tin || "")[i]}</span>
                                                </div>
                                            ))}
                                            <div className="w-6 h-[2px] bg-white opacity-40 mx-1 self-center" />
                                            {Array.from({ length: 9 }).map((_, i) => (
                                                <div key={i + 3} className="w-9 h-12 border-[2px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[24px] font-black text-white">{(formData.tin || "")[i + 3]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 bg-slate-950 p-4 border-[2px] border-white shadow-xl">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[16px] font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                                            <span className="text-[12px] font-black text-white/40 uppercase">Tax Year</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-8 h-10 border-[2px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[22px] font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* TABLE HEADER TITLE */}
                                <div className="w-full mb-6">
                                    <h3 className="text-[22px] font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការគណនាពន្ធលើប្រាក់ចំណូលលើសកម្រិត</h3>
                                    <h4 className="text-[16px] font-black text-white/50 uppercase">Excess Income Tax Calculation</h4>
                                </div>

                                {/* CALCULATION TABLE */}
                                <div className="w-full border-[3px] border-white bg-white/5 overflow-hidden shadow-2xl mb-12">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-800 border-b-[3px] border-white text-white text-center h-20">
                                                <th className="border-r-[2px] border-white px-8 w-[60%]">
                                                    <span className="block font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                                                    <span className="text-[12px] font-black uppercase opacity-60">Description</span>
                                                </th>
                                                <th className="border-r-[2px] border-white w-[10%] px-4">
                                                    <span className="block font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>យោង</span>
                                                    <span className="text-[12px] font-black uppercase opacity-60">Ref.</span>
                                                </th>
                                                <th className="px-8 w-[30%]">
                                                    <span className="block font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំនួនទឹកប្រាក់</span>
                                                    <span className="text-[12px] font-black uppercase opacity-60">Amount</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-white text-[18px]">
                                            {[
                                                { kh: "ប្រាក់ចំណូលជាប់ពន្ធ (E42)", en: "Taxable income (E42)", ref: "X 1" },
                                                { kh: "ចំណូលបង្គរ ( ចំណូលបូកបន្ត )", en: "Accumulated income", ref: "X 2" },
                                                { kh: "ចំណាយបង្គរ ( ចំណាយបូកបន្ត )", en: "Accumulated expenses", ref: "X 3" },
                                                { kh: "សមាមាត្រនៃប្រាក់ចំណូលលើសកម្រិត (X4 = X2 / X3)", en: "Proportion of excess income (X4 = X2 / X3)", ref: "X 4" },
                                                { kh: "ពន្ធលើប្រាក់ចំណូលលើសកម្រិត *", en: "Excess income tax *", ref: "X 5", isHighlight: true }
                                            ].map((row, i) => (
                                                <tr key={i} className={`h-16 border-b border-white/10 hover:bg-white/5 group ${row.isHighlight ? 'bg-white/10 h-20' : ''}`}>
                                                    <td className="border-r-[2px] border-white px-10">
                                                        <span className="font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="block text-[14px] opacity-40 uppercase leading-none mt-1">{row.en}</span>
                                                    </td>
                                                    <td className="border-r-[2px] border-white text-center opacity-40 font-black text-indigo-300">{row.ref}</td>
                                                    <td className={`px-10 text-right font-black ${row.isHighlight ? 'text-[28px] text-emerald-400' : 'text-white/80'}`}>
                                                        0.00
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* LOGIC DESCRIPTION BLOCK */}
                                <div className="w-full border-[3px] border-white bg-slate-900 p-10 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 skew-x-[-45deg] translate-x-12 -translate-y-12" />

                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-[22px] font-black text-white uppercase tracking-wider" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                            * ពន្ធលើប្រាក់ចំណូលលើសកម្រិត ៖
                                        </h3>
                                    </div>

                                    <div className="flex flex-col gap-6 text-[16px] text-white/80 leading-relaxed italic">
                                        <div className="flex flex-col gap-1 border-l-[3px] border-white/20 pl-6">
                                            <p style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>- បើ X4 នៅចន្លោះពី ០ ដល់ ១,៣ អត្រាពន្ធគឺ ០%, X5=0</p>
                                            <p className="text-white/40 uppercase text-[12px] font-black tracking-tight">- If X4 is between 0 to 1.3, tax rate is 0%, X5=0</p>
                                        </div>

                                        <div className="flex flex-col gap-1 border-l-[3px] border-white/20 pl-6">
                                            <p style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>- បើ X4 លើសពី ១,៣ ដល់ ១,៦ អត្រាពន្ធគឺ ១០%, X5=X1 * ( ( X4-1.3 ) / X4 ) * 10%</p>
                                            <p className="text-white/40 uppercase text-[12px] font-black tracking-tight">- If X4 is between over 1.3 to 1.6, tax rate is 10%, X5=X1 * ((X4-1.3)/X4) * 10%</p>
                                        </div>

                                        <div className="flex flex-col gap-1 border-l-[3px] border-white/20 pl-6">
                                            <p style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>- បើ X4 លើសពី ១,៦ ដល់ ២ អត្រាពន្ធគឺ ២០%, X5=( X1 * ( ( 1.6-1.3 ) / 1.6 ) ) * 10% + ( X1 * ( ( X4-1.6 ) / X4 ) ) * 20%</p>
                                            <p className="text-white/40 uppercase text-[12px] font-black tracking-tight">- If X4 is between over 1.6 to 2, tax rate is 20%, X5=(X1*((1.6-1.3)/1.6))*10%+(X1*((X4-1.6)/X4))*20%</p>
                                        </div>

                                        <div className="flex flex-col gap-1 border-l-[3px] border-white/20 pl-6">
                                            <p style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>- បើ X4 លើសពី ២ អត្រាពន្ធគឺ ៣០%, X5=( X1 * ( ( 1.6-1.3 ) / 1.6 ) ) * 10% + ( X1 * ( ( 2-1.6 ) / 2 ) ) * 20% + ( X1 * ( ( X4-2 ) / X4 ) ) * 30%</p>
                                            <p className="text-white/40 uppercase text-[12px] font-black tracking-tight">- If X4 is between over 2, tax rate is 30%, X5=(X1*((1.6-1.3)/1.6))*10%+(X1*((2-1.6)/2))*20%+(X1*((X4-2)/X4))*30%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER PAGE INDICATOR */}
                                <div className="mt-20 self-end flex items-center gap-4 text-white/40 font-black italic">
                                    <div className="w-12 h-[2px] bg-white/20"></div>
                                    <span className="text-[24px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទំព័រទី ២១/២១</span>
                                    <span className="text-[18px] uppercase">Page 21/21</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage > 21 && (
                        <div className="flex flex-col items-center justify-center py-40 opacity-20">
                            <h3 className="text-white font-black uppercase text-[40px] tracking-widest">Page {activePage}</h3>
                            <p className="text-white text-[24px] mt-2 italic">Schedule Content Pending Sync</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default LiveTaxWorkspace;
