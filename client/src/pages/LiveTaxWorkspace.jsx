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
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Header / Navigation */}
            {!embedded ? (
                <div className="bg-[#1e293b] border-b border-white/10 px-8 py-3 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-white/5 rounded-lg text-white transition"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="hidden lg:flex items-center gap-2">
                            <Radio size={16} className="text-rose-500" />
                            <h1 className="text-sm font-bold text-white uppercase tracking-tight">Live Workspace</h1>
                        </div>
                    </div>

                    {/* 27 PAGE SELECTION - WORKBENCH STYLE */}
                    <div className="flex-1 flex overflow-x-auto mx-8 py-1 no-scrollbar gap-1.5 justify-center">
                        {Array.from({ length: 27 }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setActivePage(i + 1)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${activePage === i + 1
                                    ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-900/40'
                                    : 'bg-slate-800/50 border-white/5 text-white hover:text-white hover:border-white/10'
                                    }`}
                            >
                                P.{i + 1}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => socket?.emit('workspace:perform_action', { action: 'fill_year', packageId, params: { year: 2026 } })}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition"
                        >
                            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Sync AI</span>
                        </button>
                        <button
                            onClick={() => socket?.emit('workspace:perform_action', { action: 'fill_company', packageId, params: { companyCode: 'GK_SMART_AI' } })}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition"
                        >
                            <CheckCircle2 size={12} />
                            Pull Profile
                        </button>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-tighter transition-colors ${socket?.connected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            <Radio size={12} className={socket?.connected ? "animate-pulse" : ""} />
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
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all shrink-0 ${activePage === i + 1
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
            <div className="flex-1 bg-[#0f172a] overflow-y-auto px-10 py-10 flex justify-start no-scrollbar">
                <div className="w-full">
                    {/* PAGE 1 CONTENT */}
                    {activePage === 1 && (
                        <div className="animate-fade-in relative px-10 py-16 grid grid-cols-2 gap-20">
                            {/* LEFT COLUMN */}
                            <div className="flex flex-col">
                                <div className="flex justify-between items-center border-b-[1px] border-white pb-10">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-white font-bold text-[48px] mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លិខិតប្រកាសពន្ធលើចំណូលប្រចាំឆ្នាំចំពោះសហគ្រាសជាប់ពន្ធលើចំណូលតាមរបបស្វ័យប្រកាស</h2>
                                        <h1 className="text-white font-black text-[43px] uppercase tracking-tighter">Annual Income Tax Return <span className="text-white font-bold uppercase ml-2">For the Year Ended</span></h1>
                                    </div>
                                    <div className="flex gap-2">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="w-12 h-14 border-[1px] border-white flex items-center justify-center bg-white/5">
                                                <input type="text" maxLength="1" className="w-full h-full text-center text-2xl font-black outline-none bg-transparent text-white" placeholder="0" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* TAX PERIOD & DATE RANGE */}
                                <div className="mt-16 flex flex-col gap-12 border-b-[1px] border-white/20 pb-12">
                                    <div className="flex items-center gap-20">
                                        {/* TAX PERIOD */}
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white font-bold text-[31px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទជាប់ពន្ធ (ចំនួនខែ)</span>
                                                <span className="text-white text-[26px] font-black uppercase tracking-widest leading-none">Tax Period (Number of Month)</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {Array.from({ length: 2 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-14 border border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" placeholder="0" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-white opacity-40 text-2xl">&#9654;</div>
                                        {/* START DATE */}
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white font-bold text-[31px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ពីថ្ងៃ</span>
                                                <span className="text-white text-[26px] font-black uppercase tracking-widest leading-none">From</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex gap-1">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="w-12 h-14 border border-white flex items-center justify-center bg-white/5"><input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" placeholder="0" /></div>)}</div>
                                                <div className="flex gap-1">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="w-12 h-14 border border-white flex items-center justify-center bg-white/5"><input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" placeholder="0" /></div>)}</div>
                                                <div className="flex gap-1">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-12 h-14 border border-white flex items-center justify-center bg-white/5"><input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" placeholder="0" /></div>)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* END DATE ROW */}
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-white font-bold text-[31px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដល់ថ្ងៃ</span>
                                            <span className="text-white text-[26px] font-black uppercase tracking-widest leading-none">Until</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex gap-1">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="w-12 h-14 border border-white flex items-center justify-center bg-white/5"><input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" placeholder="0" /></div>)}</div>
                                            <div className="flex gap-1">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="w-12 h-14 border border-white flex items-center justify-center bg-white/5"><input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" placeholder="0" /></div>)}</div>
                                            <div className="flex gap-1">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-12 h-14 border border-white flex items-center justify-center bg-white/5"><input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" placeholder="0" /></div>)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* ENTERPRISE DETAILS TABLE */}
                                <div className="mt-20 border-[2px] border-white overflow-hidden">
                                    {[
                                        { kh: "ឈ្មោះសហគ្រាស ៖", en: "Name of Enterprise:", key: "enterpriseName" },
                                        { kh: "ចំនួនសាខាក្នុងស្រុក ៖", en: "Number of Local Branch:", key: "branchCount" },
                                        { kh: "កាលបរិច្ឆេទចុះបញ្ជីសារពើពន្ធ ៖", en: "Date of Tax Registration:", key: "registrationDate" },
                                        { kh: "ឈ្មោះអភិបាល/អ្នកគ្រប់គ្រង/ម្ចាស់សហគ្រាស ៖", en: "Name of Director/Manager/Owner:", key: "directorName" },
                                        { kh: "សកម្មភាពអាជីវកម្មចម្បង ៖", en: "Main Business Activities:", key: "mainActivity" }
                                    ].map((row, idx) => (
                                        <div key={idx} className="flex border-b-[2px] border-white last:border-0 h-24">
                                            <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                                <span className="text-white font-bold text-[31px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-white text-[26px] font-black uppercase tracking-widest leading-none">{row.en}</span>
                                            </div>
                                            <div className="flex-1 p-6 flex items-center">
                                                <input type="text" value={formData[row.key] || ""} onChange={(e) => handleFormChange(row.key, e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold px-4" placeholder="..." />
                                            </div>
                                        </div>
                                    ))}
                                    {/* SPECIAL ROW: ACCOUNTANT / TAX AGENT */}
                                    <div className="flex h-24">
                                        <div className="w-[30%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះភ្នាក់ងារសេវាកម្មពន្ធដារ ឬ គណនេយ្យករដែលរៀបចំលិខិតប្រកាស ៖</span>
                                            <span className="text-white text-[22px] font-black uppercase tracking-widest leading-none">Name of Accountant/ Tax Service Agent:</span>
                                        </div>
                                        <div className="w-[20%] border-r-[2px] border-white p-6 flex items-center">
                                            <input type="text" value={formData.accountantName || ""} onChange={(e) => handleFormChange('accountantName', e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold px-2" placeholder="..." />
                                        </div>
                                        <div className="w-[25%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអាជ្ញាប័ណ្ណភ្នាក់ងារសេវាកម្មពន្ធដារ...</span>
                                            <span className="text-white text-[19px] font-black uppercase tracking-tight leading-none">Tax Service Agent License Number:</span>
                                        </div>
                                        <div className="flex-1 p-6 flex items-center">
                                            <input type="text" value={formData.agentLicenseNo || ""} onChange={(e) => handleFormChange('agentLicenseNo', e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-xl font-bold px-2" placeholder="..." />
                                        </div>
                                    </div>
                                </div>

                                {/* ADDRESS DETAILS TABLE */}
                                <div className="mt-8 border-[2px] border-white overflow-hidden">
                                    {[
                                        { kh: "អាសយដ្ឋានបច្ចុប្បន្នរបស់ការិយាល័យចុះបញ្ជី ៖", en: "Current Registered Office Address:", key: "registeredAddress" },
                                        { kh: "អាសយដ្ឋានបច្ចុប្បន្នរបស់កន្លែងប្រកបអាជីវកម្មចម្បង ៖", en: "Current Principal Establishment Address:", key: "principalAddress" },
                                        { kh: "អាសយដ្ឋានឃ្លាំង ៖", en: "Warehouse Address:", key: "warehouseAddress" }
                                    ].map((row, idx) => (
                                        <div key={idx} className="flex border-b-[2px] border-white last:border-0 h-24">
                                            <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                                <span className="text-white font-bold text-[31px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-white text-[26px] font-black uppercase tracking-widest leading-none">{row.en}</span>
                                            </div>
                                            <div className="flex-1 p-6 flex items-center">
                                                <input type="text" value={formData[row.key] || ""} onChange={(e) => handleFormChange(row.key, e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold px-4" placeholder="..." />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="flex flex-col border-l border-white/10">
                                {/* SECTION: ACCOUNTING RECORDS */}
                                <div className="border-[2px] border-white overflow-hidden">
                                    <div className="flex border-b-[2px] border-white h-24">
                                        <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[31px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការរក្សាទុកបញ្ជីគណនេយ្យ ៖</span>
                                            <span className="text-white text-[26px] font-black uppercase tracking-widest leading-none">Accounting Records:</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-4 gap-6 flex-wrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-[22px] leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រើប្រាស់កម្មវិធីគណនេយ្យ (ឈ្មោះ) ៖</span>
                                                    <span className="text-white text-[19px] font-black uppercase leading-none">Using Accounting Software:</span>
                                                </div>
                                                <input type="text" value={formData.accountingSoftware || ""} onChange={(e) => handleFormChange('accountingSoftware', e.target.value)} className="w-24 border-b border-white/20 bg-transparent outline-none text-white text-xl font-bold px-2" placeholder="..." />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-[22px] leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនបានប្រើប្រាស់កម្មវិធីគណនេយ្យ</span>
                                                    <span className="text-white text-[19px] font-black uppercase leading-none">Not Using Accounting Software</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION: TAX COMPLIANCE */}
                                    <div className="flex border-b-[2px] border-white h-24">
                                        <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[31px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ស្ថានភាពអនុលោមភាពសារពើពន្ធ (បើមាន)</span>
                                            <span className="text-white text-[26px] font-black uppercase tracking-widest leading-none">Status of Tax Compliance (if any):</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-4 gap-8">
                                            {['មាស GOLD', 'ប្រាក់ SILVER', 'សំរឹទ្ធ BRONZE'].map((level, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                    <span className="text-white font-bold text-[22px] uppercase tracking-wider">{level}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SECTION: STATUTORY AUDIT */}
                                    <div className="flex h-24">
                                        <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[31px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្រូវឱ្យមានការធ្វើសវនកម្មឯករាជ្យឬទេ?</span>
                                            <span className="text-white text-[26px] font-black uppercase tracking-tight leading-none">Statutory Audit Requirement:</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-4 gap-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-[22px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្រូវឱ្យមាន (ភ្ជាប់របាយការណ៍សវនកម្ម)</span>
                                                    <span className="text-white text-[19px] font-black uppercase mt-1">Required (Submit audit report)</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-[22px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនតម្រូវឱ្យមាន</span>
                                                    <span className="text-white text-[19px] font-black uppercase mt-1">Not Required</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: LEGAL FORM / BUSINESS OPERATIONS */}
                                <div className="mt-8 border-[2px] border-white overflow-hidden">
                                    <div className="border-b-[2px] border-white h-16 flex items-center px-6 bg-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-[29px] tracking-tight leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រូបភាពគតិយុត្ត ឬ ទម្រង់នៃការធ្វើអាជីវកម្ម ឬ សកម្មភាពផ្សេងៗ ៖</span>
                                            <span className="text-white text-[24px] font-black uppercase tracking-widest mt-1">Legal Form or Form of Business Operations:</span>
                                        </div>
                                    </div>
                                    <div className="p-8 grid grid-cols-3 gap-y-8 gap-x-10">
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
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className="w-9 h-9 border border-white flex items-center justify-center bg-white/5 shrink-0 mt-1">
                                                    <input type="checkbox" className="w-5 h-5 accent-white" />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-white font-bold text-[19px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{type.kh}</span>
                                                    <span className="text-white text-[17px] font-black uppercase mt-0.5">{type.en}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 border border-white flex items-center justify-center bg-white/5 shrink-0 mt-1">
                                                <input type="checkbox" className="w-5 h-5 accent-white" />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-white font-bold text-[19px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សហគ្រាសផ្សេងៗ</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-white text-[17px] font-black uppercase whitespace-nowrap">Others:</span>
                                                    <input type="text" value={formData.legalFormOther || ""} onChange={(e) => handleFormChange('legalFormOther', e.target.value)} className="flex-1 bg-transparent border-b border-white/20 outline-none text-white text-xl font-bold px-2 py-0.5" placeholder="..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: INCOME TAX DETAILS */}
                                <div className="mt-8 border-[2px] border-white overflow-hidden">
                                    {/* EXEMPTION DETAILS */}
                                    <div className="flex border-b-[2px] border-white h-24">
                                        <div className="w-[40%] border-r-[2px] border-white p-4 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[31px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការលើកលែងពន្ធលើចំណូល</span>
                                            <span className="text-white text-[26px] font-black uppercase tracking-tight leading-none">Income Tax Exemption:</span>
                                        </div>
                                        <div className="flex-1 flex">
                                            <div className="w-[30%] border-r-[2px] border-white p-3 flex flex-col justify-center">
                                                <span className="text-white font-bold text-[19px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំដែលបានចំណូលដំបូង</span>
                                                <span className="text-white text-[17px] font-black uppercase leading-none">Year of First Revenue:</span>
                                                <input type="text" value={formData.firstRevenueYear || ""} onChange={(e) => handleFormChange('firstRevenueYear', e.target.value)} className="mt-1 w-full bg-transparent border-none outline-none text-white text-xl font-bold" placeholder="..." />
                                            </div>
                                            <div className="w-[30%] border-r-[2px] border-white p-3 flex flex-col justify-center">
                                                <span className="text-white font-bold text-[19px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំដែលបានចំណេញដំបូង</span>
                                                <span className="text-white text-[17px] font-black uppercase leading-none">Year of First Profit:</span>
                                                <input type="text" value={formData.firstProfitYear || ""} onChange={(e) => handleFormChange('firstProfitYear', e.target.value)} className="mt-1 w-full bg-transparent border-none outline-none text-white text-xl font-bold" placeholder="..." />
                                            </div>
                                            <div className="flex-1 p-3 flex flex-col justify-center">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-white font-bold text-[19px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រយៈពេលអនុគ្រោះ</span>
                                                        <p className="text-white text-[17px] font-black uppercase leading-none mt-0.5">Priority Period:</p>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-white font-bold text-[19px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំ</span>
                                                        <span className="text-white text-[17px] font-black uppercase">Year</span>
                                                    </div>
                                                </div>
                                                <input type="text" value={formData.priorityPeriod || ""} onChange={(e) => handleFormChange('priorityPeriod', e.target.value)} className="mt-1 w-full bg-transparent border-none outline-none text-white text-xl font-bold" placeholder="..." />
                                            </div>
                                        </div>
                                    </div>

                                    {/* TAX RATE SELECTION */}
                                    <div className="flex border-b-[2px] border-white h-24">
                                        <div className="w-[40%] border-r-[2px] border-white p-4 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[31px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រាពន្ធលើចំណូល</span>
                                            <span className="text-white text-[26px] font-black uppercase tracking-tight leading-none">Income Tax Rate:</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-4 justify-between">
                                            {["30%", "20%", "5%", "0%", "0-20%"].map((rate, i) => (
                                                <div key={i} className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                    <span className="text-white font-bold text-[22px]">{rate}</span>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-3 border-l border-white/20 pl-4">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-white font-bold text-[19px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រាតាមថ្នាក់គិតជាភាគរយ</span>
                                                    <span className="text-white text-[17px] font-black uppercase mt-1">Progressive Rate</span>
                                                </div>
                                                <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TAX DUE & BOX 18 */}
                                    <div className="flex h-24">
                                        <div className="w-[40%] border-r-[2px] border-white p-4 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[31px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទឹកប្រាក់ពន្ធលើចំណូលត្រូវបង់</span>
                                            <span className="text-white text-[26px] font-black uppercase tracking-tight leading-none">Income Tax Due:</span>
                                        </div>
                                        <div className="w-[16%] border-r-[2px] border-white p-4 flex items-center">
                                            <input type="text" value={formData.incomeTaxDue || ""} onChange={(e) => handleFormChange('incomeTaxDue', e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold" placeholder="..." />
                                        </div>
                                        <div className="w-[8%] border-r-[2px] border-white flex flex-col items-center justify-center bg-white/10">
                                            <span className="text-white text-[17px] font-black uppercase mb-1">Box</span>
                                            <span className="text-white font-bold text-2xl">18</span>
                                        </div>
                                        <div className="w-[18%] border-r-[2px] border-white p-3 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[19px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឥណទានពន្ធរុញទៅមុខ</span>
                                            <span className="text-white text-[17px] font-black uppercase mt-0.5">Tax Credit Carried Forward:</span>
                                        </div>
                                        <div className="flex-1 p-4 flex items-center">
                                            <input type="text" value={formData.taxCreditCarriedForward || ""} onChange={(e) => handleFormChange('taxCreditCarriedForward', e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold" placeholder="..." />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-20 flex flex-col items-center opacity-10">
                                    <div className="w-[1px] bg-white h-10" />
                                    <p className="text-white font-mono text-[13px] uppercase tracking-[0.5em] mt-4">Enterprise Blueprint Complete</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 2 CONTENT - THE MAIN FOCUS */}
                    {activePage === 2 && (
                        <div className="animate-fade-in relative px-6 py-16 grid grid-cols-2 gap-16 items-start">
                            {/* LEFT COLUMN: CAPITAL & SHAREHOLDERS */}
                            <div className="flex flex-col">
                                {/* CAPITAL CONTRIBUTIONS BOXED HEADER */}
                                <div className="w-full border-[2px] border-white p-6 flex justify-between items-center bg-white/5 relative overflow-hidden group">
                                    <div className="flex flex-col gap-2 relative z-10">
                                        <h2 className="text-white font-bold text-[58px] tracking-tight leading-none" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ការចូលរួមមូលធនគិតត្រឹមការិយបរិច្ឆេទ</h2>
                                        <h1 className="text-white font-black text-[48px] uppercase tracking-tighter">Capital Contributions as at</h1>
                                    </div>

                                    {/* 4 DATE BOXES */}
                                    <div className="flex gap-2 relative z-10">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="w-12 h-16 border-[2px] border-white flex items-center justify-center bg-transparent group-hover:bg-white/10 transition-colors">
                                                <input type="text" maxLength="1" className="w-full h-full text-center text-2xl font-black outline-none bg-transparent text-white" placeholder="0" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* TIN INPUT SECTION */}
                                <div className="w-full mt-10 flex items-center gap-6">
                                    <div className="shrink-0 flex items-center justify-center">
                                        <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[24px] border-l-white border-b-[12px] border-b-transparent" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-[36px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                        <span className="text-white text-[28px] font-black uppercase tracking-tight leading-none">Tax Identification Number (TIN) :</span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <div className="flex gap-1.5">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div key={i} className="w-10 h-14 border border-white flex items-center justify-center bg-white/5">
                                                    <input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" placeholder="0" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-6 h-1 bg-white mx-1" />
                                        <div className="flex gap-1.5">
                                            {Array.from({ length: 9 }).map((_, i) => (
                                                <div key={i} className="w-10 h-14 border border-white flex items-center justify-center bg-white/5">
                                                    <input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" placeholder="0" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* SHAREHOLDER TABLE SECTION */}
                                <div className="w-full mt-14 border-[2px] border-white overflow-hidden bg-white/5 backdrop-blur-sm shadow-2xl">
                                    {/* COMPLEX MULTI-LEVEL HEADER */}
                                    <div className="flex border-b-[2px] border-white min-h-[140px] bg-white/10">
                                        <div className="w-[20%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[28px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះអ្នកចូលហ៊ុន</span>
                                            <span className="text-white font-bold text-[24px] leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>(ឈ្មោះរូបវន្តបុគ្គល/នីតិបុគ្គល)</span>
                                            <div className="flex flex-col text-[19px] font-black uppercase text-white leading-none">
                                                <span>Shareholder's Name</span>
                                                <span className="text-[16px] mt-0.5">(Name of Individual/Legal Entity)</span>
                                            </div>
                                        </div>
                                        <div className="w-[18%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[28px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អាសយដ្ឋានបច្ចុប្បន្ន</span>
                                            <span className="text-white font-bold text-[24px] leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របស់អ្នកចូលហ៊ុន</span>
                                            <span className="text-white text-[19px] font-black uppercase leading-tight">Current Address<br />of Shareholder</span>
                                        </div>
                                        <div className="w-[12%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[28px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មុខងារ</span>
                                            <span className="text-white font-bold text-[24px] leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក្នុងសហគ្រាស</span>
                                            <span className="text-white text-[19px] font-black uppercase leading-tight">Position in<br />the Enterprise</span>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <div className="h-[40%] border-b-[2px] border-white flex flex-col items-center justify-center py-1 bg-white/5">
                                                <span className="text-white font-bold text-[28px] leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ភាគហ៊ុន ឬចំណែកដែលមាន</span>
                                                <span className="text-white text-[22px] font-black uppercase tracking-widest">Shares Held</span>
                                            </div>
                                            <div className="flex-1 flex">
                                                <div className="w-1/2 border-r-[2px] border-white flex flex-col">
                                                    <div className="h-1/2 border-b-[2px] border-white flex flex-col items-center justify-center py-2">
                                                        <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដើមការិយបរិច្ឆេទ</span>
                                                        <span className="text-white text-[14px] font-black uppercase">Beginning of the Period</span>
                                                    </div>
                                                    <div className="flex-1 flex italic text-[16px] font-bold text-white">
                                                        <div className="w-[30%] border-r-[2px] border-white flex flex-col items-center justify-center leading-none">
                                                            <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ភាគរយ</span>
                                                            <span className="mt-0.5">%</span>
                                                        </div>
                                                        <div className="flex-1 flex flex-col items-center justify-center leading-none">
                                                            <span style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទឹកប្រាក់</span>
                                                            <span className="mt-0.5 uppercase">Amount</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex flex-col">
                                                    <div className="h-1/2 border-b-[2px] border-white flex flex-col items-center justify-center py-2">
                                                        <span className="text-white font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចុងការិយបរិច្ឆេទ</span>
                                                        <span className="text-white text-[14px] font-black uppercase">End of the Period</span>
                                                    </div>
                                                    <div className="flex-1 flex italic text-[16px] font-bold text-white">
                                                        <div className="w-[30%] border-r-[1px] border-white/40 flex flex-col items-center justify-center leading-none">
                                                            <span style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ភាគរយ</span>
                                                            <span className="mt-0.5">%</span>
                                                        </div>
                                                        <div className="flex-1 flex flex-col items-center justify-center leading-none">
                                                            <span style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ទឹកប្រាក់</span>
                                                            <span className="mt-0.5 uppercase">Amount</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/10 border-b-[2px] border-white px-4 py-4 font-bold text-[30px] uppercase text-white flex flex-col">
                                        <span style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ក. មូលធន/មូលធនភាគហ៊ុនចុះបញ្ជី</span>
                                        <span className="text-white text-[22px] font-black tracking-tight">A. Registered Capital / Share Capital</span>
                                    </div>
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <div key={r} className="flex border-b border-white/10 h-12 hover:bg-white/5 transition-colors group">
                                            <div className="w-[20%] border-r border-white/10 p-2 relative">
                                                <span className="absolute left-1 top-1 text-white text-[13px] font-mono">{r <= 3 ? r : ''}{r === 3 ? '...' : ''}</span>
                                                <input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] font-bold ml-2" />
                                            </div>
                                            <div className="w-[18%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px]" /></div>
                                            <div className="w-[12%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-center" /></div>
                                            <div className="flex-1 flex">
                                                <div className="w-1/2 flex border-r border-white/10">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[19px] text-center" /></div>
                                                    <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-right" /></div>
                                                </div>
                                                <div className="flex-1 flex">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[19px] text-center" /></div>
                                                    <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-right" /></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex h-12 bg-white/10 border-b-[2px] border-white">
                                        <div className="w-[50%] border-r-[2px] border-white flex flex-col items-center justify-center">
                                            <span className="text-white font-bold text-[28px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>សរុប</span>
                                            <span className="text-white text-[19px] font-black uppercase">Total</span>
                                        </div>
                                        <div className="flex-1 flex">
                                            <div className="w-1/2 flex border-r-[2px] border-white">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[18px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[18px]">-</div>
                                            </div>
                                            <div className="flex-1 flex">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[18px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[18px]">-</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/10 border-y-[2px] border-white px-4 py-4 font-bold text-[30px] uppercase text-white flex flex-col">
                                        <span style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ខ. មូលធន/មូលធនភាគហ៊ុន (បានបង់)</span>
                                        <span className="text-white text-[22px] font-black tracking-tight">B. Paid up Capital / Share Capital</span>
                                    </div>
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <div key={r} className="flex border-b border-white/10 h-12 hover:bg-white/5 transition-colors group">
                                            <div className="w-[20%] border-r border-white/10 p-2 relative">
                                                <span className="absolute left-1 top-1 text-white text-[13px] font-mono">{r <= 3 ? r : ''}{r === 3 ? '...' : ''}</span>
                                                <input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] font-bold ml-2" />
                                            </div>
                                            <div className="w-[18%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px]" /></div>
                                            <div className="w-[12%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-center" /></div>
                                            <div className="flex-1 flex">
                                                <div className="w-1/2 flex border-r border-white/10">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[19px] text-center" /></div>
                                                    <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-right" /></div>
                                                </div>
                                                <div className="flex-1 flex">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[19px] text-center" /></div>
                                                    <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-right" /></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex h-12 bg-white/10">
                                        <div className="w-[50%] border-r-[2px] border-white flex flex-col items-center justify-center">
                                            <span className="text-white font-bold text-[28px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>សរុប</span>
                                            <span className="text-white text-[19px] font-black uppercase">Total</span>
                                        </div>
                                        <div className="flex-1 flex">
                                            <div className="w-1/2 flex border-r-[1px] border-white/30">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[18px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[18px]">-</div>
                                            </div>
                                            <div className="flex-1 flex">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[18px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[18px]">-</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: EMPLOYEE INFORMATION */}
                            <div className="flex flex-col">
                                {/* EMPLOYEE INFO BOXED HEADER */}
                                <div className="w-full border-[2px] border-white p-6 flex flex-col items-center bg-white/5 relative group">
                                    <h2 className="text-white font-bold text-[58px] tracking-tight leading-none mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ព័ត៌មានអំពីនិយោជិតសហគ្រាសនៅក្នុងការិយបរិច្ឆេទ</h2>
                                    <h1 className="text-white font-black text-[42px] uppercase tracking-tighter">Information About Employees During the Period</h1>
                                </div>

                                {/* EMPLOYEE TABLE */}
                                <div className="w-full mt-10 border-[2px] border-white overflow-hidden bg-white/5 backdrop-blur-sm shadow-2xl">
                                    <div className="flex border-b-[2px] border-white h-[120px] bg-white/10">
                                        <div className="w-[30%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[28px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>បរិយាយ</span>
                                            <span className="text-white text-[22px] font-black uppercase tracking-tight">Description</span>
                                        </div>
                                        <div className="w-[18%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[28px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>តួនាទី</span>
                                            <span className="text-white text-[22px] font-black uppercase tracking-tight">Position</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[28px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ចំនួន</span>
                                            <span className="text-white text-[22px] font-black uppercase tracking-tight">Number</span>
                                        </div>
                                        <div className="w-[22%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center bg-white/5">
                                            <span className="text-white font-bold text-[23px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ប្រាក់បៀវត្សក្រៅពីអត្ថប្រយោជន៍បន្ថែម</span>
                                            <span className="text-white text-[17px] font-black uppercase leading-tight">Salary Excluding<br />Fringe Benefits</span>
                                        </div>
                                        <div className="flex-1 p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[23px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>អត្ថប្រយោជន៍បន្ថែម</span>
                                            <span className="text-white text-[17px] font-black uppercase leading-tight">Fringe Benefits</span>
                                        </div>
                                    </div>

                                    {/* SECTION 1: SHAREHOLDING MANAGERS */}
                                    <div className="flex border-b border-white/10 h-16 hover:bg-white/5 transition-colors">
                                        <div className="w-[30%] border-r border-white/10 px-4 flex flex-col justify-center">
                                            <span className="text-white font-bold text-[28px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>១- អ្នកគ្រប់គ្រងជាម្ចាស់ភាគហ៊ុន</span>
                                            <span className="text-white text-[19px] font-black uppercase">1- Shareholding Managers</span>
                                        </div>
                                        <div className="flex-1 flex">
                                            <div className="w-[18%] border-r border-white/10"></div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-white">-</div>
                                            <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white">-</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-white">-</div>
                                        </div>
                                    </div>
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <div key={`s1-${r}`} className="flex border-b border-white/10 h-10 hover:bg-white/5 transition-colors">
                                            <div className="w-[30%] border-r border-white/10 px-4 flex items-center italic text-[11px] text-white">-</div>
                                            <div className="w-[18%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-center" /></div>
                                            <div className="w-[10%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-center" placeholder="-" /></div>
                                            <div className="w-[22%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-right" placeholder="-" /></div>
                                            <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-right" placeholder="-" /></div>
                                        </div>
                                    ))}

                                    {/* SECTION 2: NON-SHAREHOLDING MANAGERS */}
                                    <div className="flex border-b border-white/10 h-16 hover:bg-white/5 transition-colors">
                                        <div className="w-[30%] border-r border-white/10 px-4 flex flex-col justify-center">
                                            <span className="text-white font-bold text-[28px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>២- អ្នកគ្រប់គ្រងមិនមែនជាម្ចាស់ភាគហ៊ុន</span>
                                            <span className="text-white text-[19px] font-black uppercase">2- Non-Shareholding Managers</span>
                                        </div>
                                        <div className="flex-1 flex">
                                            <div className="w-[18%] border-r border-white/10"></div>
                                            <div className="w-[10%] border-r border-white/10 flex items-center justify-center font-black text-white">-</div>
                                            <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white">-</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-white">-</div>
                                        </div>
                                    </div>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => (
                                        <div key={`s2-${r}`} className="flex border-b border-white/10 h-10 hover:bg-white/5 transition-colors">
                                            <div className="w-[30%] border-r border-white/10 px-4 flex items-center italic text-[11px] text-white">-</div>
                                            <div className="w-[18%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-center" /></div>
                                            <div className="w-[10%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-center" placeholder="-" /></div>
                                            <div className="w-[22%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-right" placeholder="-" /></div>
                                            <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[19px] text-right" placeholder="-" /></div>
                                        </div>
                                    ))}

                                    {/* SUMMARY ROWS */}
                                    <div className="flex border-b-[2px] border-white h-14 bg-white/10">
                                        <div className="w-[48%] border-r-[1px] border-white/30 px-4 flex flex-col justify-center bg-rose-500/5">
                                            <span className="text-white font-bold text-[24px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>៣- សរុបបុគ្គលិក-កម្មករ</span>
                                            <span className="text-white text-[18px] font-black uppercase">3- Total Employees and Workers</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-rose-400">0</div>
                                        <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white">-</div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black text-white">-</div>
                                    </div>
                                    <div className="flex h-14 bg-white/10">
                                        <div className="w-[48%] border-r-[1px] border-white/30 px-4 flex flex-col justify-center bg-emerald-500/5">
                                            <span className="text-white font-bold text-[24px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>៤- បុគ្គលិក-កម្មករជាប់ពន្ធលើប្រាក់បៀវត្ស</span>
                                            <span className="text-white text-[18px] font-black uppercase">4- Taxable Salary for Employees and Workers</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-emerald-400">0</div>
                                        <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white">-</div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black text-white">-</div>
                                    </div>
                                </div>

                                {/* BOTTOM DECORATION */}
                                <div className="mt-20 flex flex-col items-center opacity-10">
                                    <div className="w-[1px] bg-white h-20" />
                                    <p className="text-white font-mono text-[11px] uppercase tracking-[1em] mt-8">Employee Census Schedule Locked</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 3 CONTENT - BALANCE SHEET ASSETS */}
                    {activePage === 3 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-5xl bg-white/5 backdrop-blur-md border-[2px] border-white p-10 shadow-2xl">
                                <div className="flex justify-between items-center border-b-[2px] border-white pb-6 mb-6">
                                    <div className="flex flex-col text-white">
                                        <h2 className="font-bold text-[28px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងតុល្យការគិតត្រឹមការិយបរិច្ឆេទ</h2>
                                        <h1 className="font-black text-[24px] uppercase tracking-tighter">BALANCE SHEET AS AT</h1>
                                    </div>
                                    <div className="flex gap-2">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="w-10 h-12 border-[1px] border-white flex items-center justify-center bg-white/10">
                                                <span className="text-white text-xl font-black">0</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* TIN ROW */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-white border-b-[10px] border-b-transparent"></div>
                                        <div className="flex flex-col">
                                            <span className="text-white text-[14px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :</span>
                                            <span className="text-white text-[10px] font-black uppercase tracking-tighter">Tax Identification Number (TIN)</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {['L', '-', '0', '0', '0', '0', '0', '0', '0', '0', '0'].map((char, i) => (
                                            <div key={i} className={`w-8 h-10 border-[1px] border-white flex items-center justify-center bg-white/5 ${i === 1 ? 'border-0 w-4' : ''}`}>
                                                <span className="text-white font-black">{char}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* MAIN TABLE */}
                                <div className="w-full border-[2px] border-white overflow-hidden text-white">
                                    {/* HEADER */}
                                    <div className="flex bg-white/10 border-b-[2px] border-white h-16">
                                        <div className="w-[50%] border-r-[2px] border-white p-3 flex flex-col justify-center items-center text-center">
                                            <span className="font-bold text-[18px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                                            <span className="text-[12px] font-black uppercase">Description</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white p-3 flex flex-col justify-center items-center text-center">
                                            <span className="font-bold text-[18px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខ</span>
                                            <span className="text-[12px] font-black uppercase">Ref.</span>
                                        </div>
                                        <div className="w-[20%] border-r-[2px] border-white p-3 flex flex-col justify-center items-center text-center">
                                            <span className="font-bold text-[16px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទ (N)</span>
                                            <span className="text-[11px] font-black uppercase">Current year (N)</span>
                                        </div>
                                        <div className="flex-1 p-3 flex flex-col justify-center items-center text-center">
                                            <span className="font-bold text-[16px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទ (N-1)</span>
                                            <span className="text-[11px] font-black uppercase">Last year (N-1)</span>
                                        </div>
                                    </div>

                                    {/* ASSETS TOTAL ROW */}
                                    <div className="flex border-b-[2px] border-white h-14 bg-white/5 items-center">
                                        <div className="w-[50%] border-r-[2px] border-white px-4 flex flex-col">
                                            <span className="font-bold text-[20px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>I- ទ្រព្យសម្បត្តិ (A0 = A1 + A13)</span>
                                            <span className="text-[13px] font-black uppercase tracking-wide">Assets (A0 = A1 + A13)</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[18px]">A 0</div>
                                        <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-4 font-black">
                                            <span>{formData.a0_n || '-'}</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black">
                                            <span>{formData.a0_n1 || '-'}</span>
                                        </div>
                                    </div>

                                    {/* NON-CURRENT ASSETS HEADER */}
                                    <div className="flex border-b-[1px] border-white/30 h-14 bg-white/5 items-center">
                                        <div className="w-[50%] border-r-[2px] border-white px-8 flex flex-col italic">
                                            <span className="font-bold text-[17px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យសម្បត្តិមិនចរន្ត / ទ្រព្យសកម្មថេរ [A1 = សរុប(A2:A12)]</span>
                                            <span className="text-[12px] font-bold">Non-Current Assets / Fixed Assets [A1 = Sum(A2:A12)]</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-white/50 text-[14px]">A 1</div>
                                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white">
                                            <span>{formData.a1_n || '-'}</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black text-white">
                                            <span>{formData.a1_n1 || '-'}</span>
                                        </div>
                                    </div>

                                    {[
                                        { ref: "A 2", kh: "ដីធ្លីរបស់សហគ្រាស", en: "Freehold land", key: "a2" },
                                        { ref: "A 3", kh: "ការរៀបចំនិងការកែលម្អដីធ្លីរបស់សហគ្រាស", en: "Improvements and preparation of land", key: "a3" },
                                        { ref: "A 4", kh: "សំណង់អាគាររបស់សហគ្រាស", en: "Freehold buildings", key: "a4" },
                                        { ref: "A 5", kh: "សំណង់សាងសង់លើដីជួលរបស់សហគ្រាស", en: "Freehold buildings on leasehold land", key: "a5" },
                                        { ref: "A 6", kh: "ទ្រព្យសកម្មរូបវន្តមានសមិទ្ធផលកំពុងដំណើការ", en: "Non-current assets in progress", key: "a6" },
                                        { ref: "A 7", kh: "រោងចក្រ (គ្រឹះស្ថាន) និងសម្ភារៈ", en: "Plant and machinery", key: "a7" },
                                        { ref: "A 8", kh: "កេរ្តិ៍ឈ្មោះអាជីវកម្ម និងពាណិជ្ជកម្ម", en: "Goodwill", key: "a8" },
                                        { ref: "A 9", kh: "ចំណាយបង្កើតសហគ្រាសដំបូង", en: "Preliminary business formation expenses", key: "a9" },
                                        { ref: "A 10", kh: "ទ្រព្យសកម្មរូបវន្តមានអាយុកកាលនៃកិច្ចសន្យាជួល ឬបុព្វលាភនៃកិច្ចសន្យាជួល", en: "Leasehold assets and lease premiums", key: "a10" },
                                        { ref: "A 11", kh: "វិនិយោគក្នុងសហគ្រាសដទៃទៀត", en: "Investment in other enterprises", key: "a11" },
                                        { ref: "A 12", kh: "ទ្រព្យសកម្មមិនចរន្តផ្សេងៗ", en: "Other non-current assets", key: "a12" }
                                    ].map((row, idx) => (
                                        <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                            <div className="w-[50%] border-r-[2px] border-white px-10 flex flex-col">
                                                <span className="font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-[12px] font-bold opacity-80">{row.en}</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-white/40 text-[13px]">{row.ref}</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                                <span>{formData[row.key + '_n'] || '-'}</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                <span>{formData[row.key + '_n1'] || '-'}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* CURRENT ASSETS HEADER */}
                                    <div className="flex border-y-[2px] border-white h-14 bg-white/10 items-center">
                                        <div className="w-[50%] border-r-[2px] border-white px-8 flex flex-col italic">
                                            <span className="font-bold text-[17px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យសម្បត្តិចរន្ត [A13 = សរុប(A14:A27)]</span>
                                            <span className="text-[12px] font-bold">Current Assets [A13 = Sum(A14:A27)]</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[15px]">A 13</div>
                                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                            <span>{formData.a13_n || '-'}</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black">
                                            <span>{formData.a13_n1 || '-'}</span>
                                        </div>
                                    </div>

                                    {[
                                        { ref: "A 14", kh: "ស្តុកវត្ថុធាតុដើម និងសម្ភារៈផ្គត់ផ្គង់", en: "Stock of raw materials and supplies", key: "a14" },
                                        { ref: "A 15", kh: "ស្តុកទំនិញ", en: "Stocks of goods", key: "a15" },
                                        { ref: "A 16", kh: "ស្តុកផលិតផលសម្រេច", en: "Stocks of finished products", key: "a16" },
                                        { ref: "A 17", kh: "ផលិតផលកំពុងផលិត", en: "Products in progress", key: "a17" },
                                        { ref: "A 18", kh: "គណនីត្រូវទទួល / អតិថិជន", en: "Accounts receivable / trade debtors", key: "a18" },
                                        { ref: "A 19", kh: "គណនីត្រូវទទួលផ្សេងទៀត", en: "Other accounts receivable", key: "a19" },
                                        { ref: "A 20", kh: "ចំណាយបង់ទុកមុន", en: "Prepaid expenses", key: "a20" },
                                        { ref: "A 21", kh: "សាច់ប្រាក់នៅក្នុងបេឡា", en: "Cash on hand", key: "a21" },
                                        { ref: "A 22", kh: "សាច់ប្រាក់នៅធនាគារ", en: "Cash in banks", key: "a22" },
                                        { ref: "A 23", kh: "ឥណទានពីការបង់ប្រាក់រំលស់នៃពន្ធលើប្រាក់ចំណូល", en: "Credit on Prepayment on income tax", key: "a23" },
                                        { ref: "A 24", kh: "ឥណទានអាករលើតម្លៃបន្ថែម", en: "Value added tax credit", key: "a24" },
                                        { ref: "A 25", kh: "ឥណទានពន្ធ-អាករដទៃទៀត", en: "Other taxes credit", key: "a25" },
                                        { ref: "A 26", kh: "ទ្រព្យសកម្មចរន្តផ្សេងៗ", en: "Other current assets", key: "a26" },
                                        { ref: "A 27", kh: "លទ្ធផល (ចំណេញ/ខាត) ពីបរិវត្តរូបិយប័ណ្ណនៃទ្រព្យសកម្ម", en: "Gain/(loss) on currency translation of assets", key: "a27" }
                                    ].map((row, idx) => (
                                        <div key={idx} className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/5 transition-colors">
                                            <div className="w-[50%] border-r-[2px] border-white px-10 flex flex-col">
                                                <span className="font-bold text-[15px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-[11px] font-bold opacity-80">{row.en}</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-white/40 text-[11px]">{row.ref}</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                                <span className="text-[13px]">{formData[row.key] || '-'}</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                <span className="text-[13px]">{formData[row.key + '_prev'] || '-'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}



                    {/* PAGE 4 CONTENT - LIABILITIES & EQUITY */}
                    {activePage === 4 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-5xl bg-white/5 backdrop-blur-md border-[2px] border-white p-10 shadow-2xl">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-col gap-4">
                                        {/* TIN ROW */}
                                        <div className="flex items-center gap-4 text-white">
                                            <div className="flex items-center gap-2">
                                                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-white border-b-[10px] border-b-transparent"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ :</span>
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">Tax Identification Number (TIN) :</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {['', '', '', '', '', '-', '', '', '', '', '', '', ''].map((char, i) => (
                                                    <div key={i} className={`w-8 h-10 border-[1px] border-white flex items-center justify-center bg-white/5 ${char === '-' ? 'border-0 w-4' : ''}`}>
                                                        {char === '-' ? <span className="font-black">-</span> : <span className="text-lg font-black">{formData[`tin_${i}`] || ''}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 text-white">
                                        <div className="flex items-center gap-2">
                                            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-white border-b-[10px] border-b-transparent"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                                                <span className="text-[10px] font-black uppercase tracking-tighter">Tax Year</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 4 }).map((_, i) => (
                                                    <div key={i} className="w-10 h-12 border-[1px] border-white flex items-center justify-center bg-white/10">
                                                        <span className="text-xl font-black">{formData[`tax_year_${i}`] || '0'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* MAIN TABLE */}
                                <div className="w-full border-[2px] border-white overflow-hidden text-white">
                                    {/* HEADER */}
                                    <div className="flex bg-white/10 border-b-[2px] border-white h-16">
                                        <div className="w-[50%] border-r-[2px] border-white p-3 flex flex-col justify-center items-center text-center">
                                            <span className="font-bold text-[18px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                                            <span className="text-[12px] font-black uppercase">Description</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white p-3 flex flex-col justify-center items-center text-center">
                                            <span className="font-bold text-[18px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខ</span>
                                            <span className="text-[12px] font-black uppercase">Ref.</span>
                                        </div>
                                        <div className="w-[20%] border-r-[2px] border-white p-3 flex flex-col justify-center items-center text-center">
                                            <div className="w-full border-b border-white/30 mb-1 pb-1">
                                                <span className="font-black text-[14px]">ឆ្នាំជាប់ពន្ធ (N)</span>
                                            </div>
                                            <span className="font-black text-[12px]">Current Year (N)</span>
                                        </div>
                                        <div className="flex-1 p-3 flex flex-col justify-center items-center text-center">
                                            <div className="w-full border-b border-white/30 mb-1 pb-1">
                                                <span className="font-black text-[14px]">ឆ្នាំមុន (N-1)</span>
                                            </div>
                                            <span className="font-black text-[12px]">Last Year (N-1)</span>
                                        </div>
                                    </div>

                                    {/* SECTION II HEADING */}
                                    <div className="flex border-b-[2px] border-white h-16 bg-white/10 items-center">
                                        <div className="w-[50%] border-r-[2px] border-white px-4 flex flex-col">
                                            <span className="font-bold text-[18px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>II- មូលនិធិ/ឧបត្ថម្ភទ្រព្យ និងបំណុល [A28 = សរុប(A29 + A37 + A42)]</span>
                                            <span className="text-[12px] font-black uppercase tracking-tight">Equity and Liabilities [A28 = Sum(A29 + A37 + A42)]</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[18px]">A 28</div>
                                        <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-4 font-black">
                                            <span>{formData.a28_n || '-'}</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black">
                                            <span>{formData.a28_n1 || '-'}</span>
                                        </div>
                                    </div>

                                    {/* EQUITY SUBSECTION */}
                                    <div className="flex border-b-[1px] border-white/30 h-14 bg-white/5 items-center">
                                        <div className="w-[50%] border-r-[2px] border-white px-8 flex flex-col italic">
                                            <span className="font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មូលនិធិ/ឧបត្ថម្ភទ្រព្យ [A29 = សរុប(A30:A36)]</span>
                                            <span className="text-[11px] font-bold">Equity [A29 = Sum(A30:A36)]</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black opacity-50 text-[14px]">A 29</div>
                                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                            <span>{formData.a29_n || '-'}</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black">
                                            <span>{formData.a29_n1 || '-'}</span>
                                        </div>
                                    </div>

                                    {[
                                        { ref: "A 30", kh: "មូលធន/មូលធនភាគហ៊ុន/ មូលនិធិសាខាក្រុមហ៊ុនបរទេស ឬការិយាល័យតំណាង", en: "Capital / Share capital / Fund of Foreign Branch or Representative Office", key: "a30" },
                                        { ref: "A 31", kh: "តម្លៃលើសនៃការលក់ភាគហ៊ុន", en: "Share premium", key: "a31" },
                                        { ref: "A 32", kh: "មូលធនបម្រុងតាមច្បាប់", en: "Legal reserve capital", key: "a32" },
                                        { ref: "A 33", kh: "លាភលើសនៃការវាយតម្លៃឡើងវិញទ្រព្យសកម្ម", en: "Gain on revaluation of assets", key: "a33" },
                                        { ref: "A 34", kh: "មូលធនបម្រុងផ្សេងៗ", en: "Other reserve capital", key: "a34" },
                                        { ref: "A 35", kh: "លទ្ធផលចំណេញ / (ខាត) យកមកពីមុន (+ ឬ -)", en: "Profit / (loss) brought forward (+ or -)", key: "a35" },
                                        { ref: "A 36", kh: "លទ្ធផលចំណេញ / (ខាត) នៃការិយបរិច្ឆេទនេះ (+ ឬ -)", en: "Profit / (loss) for the period (+ or -)", key: "a36" }
                                    ].map((row, idx) => (
                                        <div key={idx} className="flex border-b border-white/10 h-16 items-center last:border-0 hover:bg-white/5 transition-colors">
                                            <div className="w-[50%] border-r-[2px] border-white px-10 flex flex-col">
                                                <span className="font-bold text-[14px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-[11px] font-bold opacity-80">{row.en}</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black opacity-40 text-[13px]">{row.ref}</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                                <span>{formData[row.key + '_n'] || '-'}</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                <span>{formData[row.key + '_n1'] || '-'}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* NON-CURRENT LIABILITIES SUBSECTION */}
                                    <div className="flex border-y-[2px] border-white h-14 bg-white/10 items-center">
                                        <div className="w-[50%] border-r-[2px] border-white px-8 flex flex-col italic">
                                            <span className="font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បំណុលរយៈពេលវែង [A37 = សរុប(A38:A41)]</span>
                                            <span className="text-[11px] font-bold">Non-Current Liabilities [A37 = Sum(A38:A41)]</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[14px]">A 37</div>
                                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                            <span>{formData.a37_n || '-'}</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black">
                                            <span>{formData.a37_n1 || '-'}</span>
                                        </div>
                                    </div>

                                    {[
                                        { ref: "A 38", kh: "បំណុលភាគីជាប់ទាក់ទង", en: "Loan from related parties", key: "a38" },
                                        { ref: "A 39", kh: "បំណុលធនាគារ និងបំណុលភាគីមិនជាប់ទាក់ទងផ្សេងៗ", en: "Loan from banks and other external parties", key: "a39" },
                                        { ref: "A 40", kh: "សំវិធានធន", en: "Provisions", key: "a40" },
                                        { ref: "A 41", kh: "បំណុលរយៈពេលវែងផ្សេងៗ", en: "Other non-current liabilities", key: "a41" }
                                    ].map((row, idx) => (
                                        <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                            <div className="w-[50%] border-r-[2px] border-white px-10 flex flex-col">
                                                <span className="font-bold text-[15px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-[11px] font-bold opacity-80">{row.en}</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black opacity-40 text-[13px]">{row.ref}</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                                <span>{formData[row.key + '_n'] || '-'}</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                <span>{formData[row.key + '_n1'] || '-'}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* CURRENT LIABILITIES SUBSECTION */}
                                    <div className="flex border-y-[2px] border-white h-14 bg-white/10 items-center">
                                        <div className="w-[50%] border-r-[2px] border-white px-8 flex flex-col italic">
                                            <span className="font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បំណុលរយៈពេលខ្លី [A42 = សរុប(A43:A52)]</span>
                                            <span className="text-[11px] font-bold">Current Liabilities [A42 = Sum(A43:A52)]</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[14px]">A 42</div>
                                        <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                            <span>{formData.a42_n || '-'}</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black">
                                            <span>{formData.a42_n1 || '-'}</span>
                                        </div>
                                    </div>

                                    {[
                                        { ref: "A 43", kh: "សាច់ប្រាក់ក្នុងធនាគារលើសប្រាក់បញ្ញើ (ឥណទានវិបារូប៍)", en: "Bank overdraft", key: "a43" },
                                        { ref: "A 44", kh: "ចំណែកបច្ចុប្បន្ននៃបំណុលមានការប្រាក់", en: "Short-term borrowing-current portion of interest bearing borrowing", key: "a44" },
                                        { ref: "A 45", kh: "គណនីត្រូវសងបុគ្គលជាប់ទាក់ទង (ភាគីសម្ព័ន្ធភាព)", en: "Accounts payable to related parties", key: "a45" },
                                        { ref: "A 46", kh: "គណនីត្រូវសងផ្សេងៗ", en: "Other accounts payable", key: "a46" },
                                        { ref: "A 47", kh: "ចំណូលកក់មុន", en: "Unearned revenues", key: "a47" },
                                        { ref: "A 48", kh: "គណនីចំណាយបង្គរ និងបំណុលរយៈពេលខ្លីផ្សេងៗ", en: "Accrual expenses and other current liabilities", key: "a48" },
                                        { ref: "A 49", kh: "សំវិធានធន", en: "Provisions", key: "a49" },
                                        { ref: "A 50", kh: "ពន្ធលើប្រាក់ចំណូលត្រូវបង់", en: "Income tax payable", key: "a50" },
                                        { ref: "A 51", kh: "ពន្ធ-អាករផ្សេងៗត្រូវបង់", en: "Other taxes payable", key: "a51" },
                                        { ref: "A 52", kh: "លទ្ធផល (ចំណេញ/ខាត) ពីបរិវត្តរូបិយប័ណ្ណនៃបំណុល", en: "Gain/(Loss) on currency translation of liabilities", key: "a52" }
                                    ].map((row, idx) => (
                                        <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                            <div className="w-[50%] border-r-[2px] border-white px-10 flex flex-col">
                                                <span className="font-bold text-[14px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-[11px] font-bold opacity-80">{row.en}</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black opacity-40 text-[13px]">{row.ref}</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                                <span>{formData[row.key + '_n'] || '-'}</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                <span>{formData[row.key + '_n1'] || '-'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 5 CONTENT - PROFIT & LOSS */}
                    {activePage === 5 && (
                        <div className="animate-fade-in relative px-10 py-16 grid grid-cols-2 gap-20">
                            <div className="flex flex-col">
                                <div className="flex justify-between items-center border-b-[1px] border-white pb-10 text-white">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-[36px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍លទ្ធផល</h2>
                                        <h1 className="text-[32px] font-black uppercase tracking-tighter">Profit and Loss Statement</h1>
                                    </div>
                                </div>

                                <div className="mt-8 border-[2px] border-white overflow-hidden text-white">
                                    <div className="flex border-b-[2px] border-white h-14 bg-emerald-500/10 items-center">
                                        <div className="w-[48%] border-r-[2px] border-white px-4 flex flex-col">
                                            <span className="font-bold text-[22px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>III- ចំណូល (B1 - B2)</span>
                                            <span className="text-[14px] font-black uppercase tracking-wide">Revenue</span>
                                        </div>
                                        <div className="w-[12%] border-r-[2px] border-white flex items-center justify-center font-black text-emerald-400 text-[18px]">B 3</div>
                                        <div className="w-[40%] flex items-center justify-end px-4 font-black text-emerald-400 text-[18px]">$ 0.00</div>
                                    </div>

                                    {[
                                        { ref: "B 1", kh: "លក់សរុប", en: "Gross sales" },
                                        { ref: "B 2", kh: "បង្វិលសង", en: "Sales returns" }
                                    ].map((row, idx) => (
                                        <div key={idx} className="flex border-b border-white/10 h-14 items-center">
                                            <div className="w-[48%] border-r-[2px] border-white px-6 flex flex-col">
                                                <span className="font-bold text-[19px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-[14px] font-bold">{row.en}</span>
                                            </div>
                                            <div className="w-[12%] border-r-[2px] border-white flex items-center justify-center font-black text-white/50 text-[14px]">{row.ref}</div>
                                            <div className="w-[40%] flex items-center justify-end px-4 font-black text-white">$ 0.00</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage > 5 && (
                        <div className="flex flex-col items-center justify-center py-40 opacity-20">
                            <h3 className="text-white font-black uppercase tracking-widest">Page {activePage}</h3>
                            <p className="text-white text-xs mt-2 italic">Schedule Content Pending Sync</p>
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
};


export default LiveTaxWorkspace;
