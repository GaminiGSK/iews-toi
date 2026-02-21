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
                                className={`px-3 py-1.5 rounded-lg text-[20px] font-bold border transition-all shrink-0 ${activePage === i + 1
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
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[20px] font-bold uppercase tracking-widest transition"
                        >
                            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Sync AI</span>
                        </button>
                        <button
                            onClick={() => socket?.emit('workspace:perform_action', { action: 'fill_company', packageId, params: { companyCode: 'GK_SMART_AI' } })}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[20px] font-bold uppercase tracking-widest transition"
                        >
                            <CheckCircle2 size={12} />
                            Pull Profile
                        </button>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[20px] font-bold border uppercase tracking-tighter transition-colors ${socket?.connected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
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
            <div className="flex-1 bg-[#0f172a] overflow-y-auto px-10 py-10 flex justify-start no-scrollbar">
                <div className="w-full">
                    {/* PAGE 1 CONTENT */}
                    {activePage === 1 && (
                        <div className="animate-fade-in relative px-10 py-16 grid grid-cols-2 gap-20">
                            {/* LEFT COLUMN */}
                            <div className="flex flex-col">
                                <div className="flex justify-between items-center border-b-[1px] border-white pb-10">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-white font-bold text-[96px] mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លិខិតប្រកាសពន្ធលើចំណូលប្រចាំឆ្នាំចំពោះសហគ្រាសជាប់ពន្ធលើចំណូលតាមរបបស្វ័យប្រកាស</h2>
                                        <h1 className="text-white font-black text-[86px] uppercase tracking-tighter">Annual Income Tax Return <span className="text-white font-bold uppercase ml-2">For the Year Ended</span></h1>
                                    </div>
                                    <div className="flex gap-2">
                                        {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                            <div key={i} className="w-12 h-14 border-[1px] border-white flex items-center justify-center bg-white/5">
                                                <input
                                                    type="text"
                                                    maxLength="1"
                                                    className="w-full h-full text-center text-2xl font-black outline-none bg-transparent text-white"
                                                    value={char}
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

                                {/* TAX PERIOD & DATE RANGE */}
                                <div className="mt-16 flex flex-col gap-12 border-b-[1px] border-white/20 pb-12">
                                    <div className="flex items-center gap-20">
                                        {/* TAX PERIOD */}
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white font-bold text-[62px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទជាប់ពន្ធ (ចំនួនខែ)</span>
                                                <span className="text-white text-[52px] font-black uppercase tracking-widest leading-none">Tax Period (Number of Month)</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {(formData.taxMonths || "12").split('').map((char, i) => (
                                                    <div key={i} className="w-12 h-14 border border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                        <input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" value={char} onChange={(e) => handleFormChange('taxMonths', (formData.taxMonths || "12").substring(0, i) + e.target.value + (formData.taxMonths || "12").substring(i + 1))} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-white opacity-40 text-2xl">&#9654;</div>
                                        {/* START DATE */}
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white font-bold text-[62px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ពីថ្ងៃ</span>
                                                <span className="text-white text-[52px] font-black uppercase tracking-widest leading-none">From</span>
                                            </div>
                                            <div className="flex gap-4">
                                                {[
                                                    { start: 0, len: 2 }, // Day
                                                    { start: 2, len: 2 }, // Month
                                                    { start: 4, len: 4 }  // Year
                                                ].map((section, sIdx) => (
                                                    <div key={sIdx} className="flex gap-1">
                                                        {Array.from({ length: section.len }).map((_, i) => {
                                                            const charIdx = section.start + i;
                                                            return (
                                                                <div key={i} className="w-12 h-14 border border-white flex items-center justify-center bg-white/5">
                                                                    <input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" value={formData.fromDate?.[charIdx] || ''} onChange={(e) => {
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
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-white font-bold text-[62px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដល់ថ្ងៃ</span>
                                            <span className="text-white text-[52px] font-black uppercase tracking-widest leading-none">Until</span>
                                        </div>
                                        <div className="flex gap-4">
                                            {[
                                                { start: 0, len: 2 }, // Day
                                                { start: 2, len: 2 }, // Month
                                                { start: 4, len: 4 }  // Year
                                            ].map((section, sIdx) => (
                                                <div key={sIdx} className="flex gap-1">
                                                    {Array.from({ length: section.len }).map((_, i) => {
                                                        const charIdx = section.start + i;
                                                        return (
                                                            <div key={i} className="w-12 h-14 border border-white flex items-center justify-center bg-white/5">
                                                                <input type="text" maxLength="1" className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl" value={formData.untilDate?.[charIdx] || ''} onChange={(e) => {
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
                                                <span className="text-white font-bold text-[62px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-white text-[52px] font-black uppercase tracking-widest leading-none">{row.en}</span>
                                            </div>
                                            <div className="flex-1 p-6 flex items-center">
                                                <input type="text" value={formData[row.key] || ""} onChange={(e) => handleFormChange(row.key, e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold px-4" placeholder="..." />
                                            </div>
                                        </div>
                                    ))}
                                    {/* SPECIAL ROW: ACCOUNTANT / TAX AGENT */}
                                    <div className="flex h-24">
                                        <div className="w-[30%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[52px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះភ្នាក់ងារសេវាកម្មពន្ធដារ ឬ គណនេយ្យករដែលរៀបចំលិខិតប្រកាស ៖</span>
                                            <span className="text-white text-[44px] font-black uppercase tracking-widest leading-none">Name of Accountant/ Tax Service Agent:</span>
                                        </div>
                                        <div className="w-[20%] border-r-[2px] border-white p-6 flex items-center">
                                            <input type="text" value={formData.accountantName || ""} onChange={(e) => handleFormChange('accountantName', e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold px-2" placeholder="..." />
                                        </div>
                                        <div className="w-[25%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[52px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអាជ្ញាប័ណ្ណភ្នាក់ងារសេវាកម្មពន្ធដារ...</span>
                                            <span className="text-white text-[38px] font-black uppercase tracking-tight leading-none">Tax Service Agent License Number:</span>
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
                                                <span className="text-white font-bold text-[62px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className="text-white text-[52px] font-black uppercase tracking-widest leading-none">{row.en}</span>
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
                                            <span className="text-white font-bold text-[62px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការរក្សាទុកបញ្ជីគណនេយ្យ ៖</span>
                                            <span className="text-white text-[52px] font-black uppercase tracking-widest leading-none">Accounting Records:</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-4 gap-6 flex-wrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-[44px] leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រើប្រាស់កម្មវិធីគណនេយ្យ (ឈ្មោះ) ៖</span>
                                                    <span className="text-white text-[38px] font-black uppercase leading-none">Using Accounting Software:</span>
                                                </div>
                                                <input type="text" value={formData.accountingSoftware || ""} onChange={(e) => handleFormChange('accountingSoftware', e.target.value)} className="w-24 border-b border-white/20 bg-transparent outline-none text-white text-xl font-bold px-2" placeholder="..." />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-[44px] leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនបានប្រើប្រាស់កម្មវិធីគណនេយ្យ</span>
                                                    <span className="text-white text-[38px] font-black uppercase leading-none">Not Using Accounting Software</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION: TAX COMPLIANCE */}
                                    <div className="flex border-b-[2px] border-white h-24">
                                        <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[62px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ស្ថានភាពអនុលោមភាពសារពើពន្ធ (បើមាន)</span>
                                            <span className="text-white text-[52px] font-black uppercase tracking-widest leading-none">Status of Tax Compliance (if any):</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-4 gap-8">
                                            {['មាស GOLD', 'ប្រាក់ SILVER', 'សំរឹទ្ធ BRONZE'].map((level, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                    <span className="text-white font-bold text-[44px] uppercase tracking-wider">{level}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SECTION: STATUTORY AUDIT */}
                                    <div className="flex h-24">
                                        <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[62px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្រូវឱ្យមានការធ្វើសវនកម្មឯករាជ្យឬទេ?</span>
                                            <span className="text-white text-[52px] font-black uppercase tracking-tight leading-none">Statutory Audit Requirement:</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-4 gap-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-[44px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្រូវឱ្យមាន (ភ្ជាប់របាយការណ៍សវនកម្ម)</span>
                                                    <span className="text-white text-[38px] font-black uppercase mt-1">Required (Submit audit report)</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-[44px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនតម្រូវឱ្យមាន</span>
                                                    <span className="text-white text-[38px] font-black uppercase mt-1">Not Required</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: LEGAL FORM / BUSINESS OPERATIONS */}
                                <div className="mt-8 border-[2px] border-white overflow-hidden">
                                    <div className="border-b-[2px] border-white h-16 flex items-center px-6 bg-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-[58px] tracking-tight leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រូបភាពគតិយុត្ត ឬ ទម្រង់នៃការធ្វើអាជីវកម្ម ឬ សកម្មភាពផ្សេងៗ ៖</span>
                                            <span className="text-white text-[48px] font-black uppercase tracking-widest mt-1">Legal Form or Form of Business Operations:</span>
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
                                                    <span className="text-white font-bold text-[38px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{type.kh}</span>
                                                    <span className="text-white text-[34px] font-black uppercase mt-0.5">{type.en}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 border border-white flex items-center justify-center bg-white/5 shrink-0 mt-1">
                                                <input type="checkbox" className="w-5 h-5 accent-white" />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-white font-bold text-[38px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សហគ្រាសផ្សេងៗ</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-white text-[34px] font-black uppercase whitespace-nowrap">Others:</span>
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
                                            <span className="text-white font-bold text-[62px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការលើកលែងពន្ធលើចំណូល</span>
                                            <span className="text-white text-[52px] font-black uppercase tracking-tight leading-none">Income Tax Exemption:</span>
                                        </div>
                                        <div className="flex-1 flex">
                                            <div className="w-[30%] border-r-[2px] border-white p-3 flex flex-col justify-center">
                                                <span className="text-white font-bold text-[38px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំដែលបានចំណូលដំបូង</span>
                                                <span className="text-white text-[34px] font-black uppercase leading-none">Year of First Revenue:</span>
                                                <input type="text" value={formData.firstRevenueYear || ""} onChange={(e) => handleFormChange('firstRevenueYear', e.target.value)} className="mt-1 w-full bg-transparent border-none outline-none text-white text-xl font-bold" placeholder="..." />
                                            </div>
                                            <div className="w-[30%] border-r-[2px] border-white p-3 flex flex-col justify-center">
                                                <span className="text-white font-bold text-[38px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំដែលបានចំណេញដំបូង</span>
                                                <span className="text-white text-[34px] font-black uppercase leading-none">Year of First Profit:</span>
                                                <input type="text" value={formData.firstProfitYear || ""} onChange={(e) => handleFormChange('firstProfitYear', e.target.value)} className="mt-1 w-full bg-transparent border-none outline-none text-white text-xl font-bold" placeholder="..." />
                                            </div>
                                            <div className="flex-1 p-3 flex flex-col justify-center">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-white font-bold text-[38px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រយៈពេលអនុគ្រោះ</span>
                                                        <p className="text-white text-[34px] font-black uppercase leading-none mt-0.5">Priority Period:</p>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-white font-bold text-[38px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំ</span>
                                                        <span className="text-white text-[34px] font-black uppercase">Year</span>
                                                    </div>
                                                </div>
                                                <input type="text" value={formData.priorityPeriod || ""} onChange={(e) => handleFormChange('priorityPeriod', e.target.value)} className="mt-1 w-full bg-transparent border-none outline-none text-white text-xl font-bold" placeholder="..." />
                                            </div>
                                        </div>
                                    </div>

                                    {/* TAX RATE SELECTION */}
                                    <div className="flex border-b-[2px] border-white h-24">
                                        <div className="w-[40%] border-r-[2px] border-white p-4 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[62px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រាពន្ធលើចំណូល</span>
                                            <span className="text-white text-[52px] font-black uppercase tracking-tight leading-none">Income Tax Rate:</span>
                                        </div>
                                        <div className="flex-1 flex items-center px-4 justify-between">
                                            {["30%", "20%", "5%", "0%", "0-20%"].map((rate, i) => (
                                                <div key={i} className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                                    <span className="text-white font-bold text-[44px]">{rate}</span>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-3 border-l border-white/20 pl-4">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-white font-bold text-[38px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រាតាមថ្នាក់គិតជាភាគរយ</span>
                                                    <span className="text-white text-[34px] font-black uppercase mt-1">Progressive Rate</span>
                                                </div>
                                                <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5"><input type="checkbox" className="w-6 h-6 accent-white" /></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TAX DUE & BOX 18 */}
                                    <div className="flex h-24">
                                        <div className="w-[40%] border-r-[2px] border-white p-4 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[62px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទឹកប្រាក់ពន្ធលើចំណូលត្រូវបង់</span>
                                            <span className="text-white text-[52px] font-black uppercase tracking-tight leading-none">Income Tax Due:</span>
                                        </div>
                                        <div className="w-[16%] border-r-[2px] border-white p-4 flex items-center">
                                            <input type="text" value={formData.incomeTaxDue || ""} onChange={(e) => handleFormChange('incomeTaxDue', e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold" placeholder="..." />
                                        </div>
                                        <div className="w-[8%] border-r-[2px] border-white flex flex-col items-center justify-center bg-white/10">
                                            <span className="text-white text-[34px] font-black uppercase mb-1">Box</span>
                                            <span className="text-white font-bold text-2xl">18</span>
                                        </div>
                                        <div className="w-[18%] border-r-[2px] border-white p-3 flex flex-col justify-center bg-white/5">
                                            <span className="text-white font-bold text-[38px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឥណទានពន្ធរុញទៅមុខ</span>
                                            <span className="text-white text-[34px] font-black uppercase mt-0.5">Tax Credit Carried Forward:</span>
                                        </div>
                                        <div className="flex-1 p-4 flex items-center">
                                            <input type="text" value={formData.taxCreditCarriedForward || ""} onChange={(e) => handleFormChange('taxCreditCarriedForward', e.target.value)} className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold" placeholder="..." />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-20 flex flex-col items-center opacity-10">
                                    <div className="w-[1px] bg-white h-10" />
                                    <p className="text-white font-mono text-[26px] uppercase tracking-[0.5em] mt-4">Enterprise Blueprint Complete</p>
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
                                        <h2 className="text-white font-bold text-[116px] tracking-tight leading-none" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ការចូលរួមមូលធនគិតត្រឹមការិយបរិច្ឆេទ</h2>
                                        <h1 className="text-white font-black text-[96px] uppercase tracking-tighter">Capital Contributions as at</h1>
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
                                        <span className="text-white font-bold text-[72px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                        <span className="text-white text-[56px] font-black uppercase tracking-tight leading-none">Tax Identification Number (TIN) :</span>
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
                                            <span className="text-white font-bold text-[56px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះអ្នកចូលហ៊ុន</span>
                                            <span className="text-white font-bold text-[48px] leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>(ឈ្មោះរូបវន្តបុគ្គល/នីតិបុគ្គល)</span>
                                            <div className="flex flex-col text-[38px] font-black uppercase text-white leading-none">
                                                <span>Shareholder's Name</span>
                                                <span className="text-[32px] mt-0.5">(Name of Individual/Legal Entity)</span>
                                            </div>
                                        </div>
                                        <div className="w-[18%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[56px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អាសយដ្ឋានបច្ចុប្បន្ន</span>
                                            <span className="text-white font-bold text-[48px] leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របស់អ្នកចូលហ៊ុន</span>
                                            <span className="text-white text-[38px] font-black uppercase leading-tight">Current Address<br />of Shareholder</span>
                                        </div>
                                        <div className="w-[12%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[56px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មុខងារ</span>
                                            <span className="text-white font-bold text-[48px] leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក្នុងសហគ្រាស</span>
                                            <span className="text-white text-[38px] font-black uppercase leading-tight">Position in<br />the Enterprise</span>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <div className="h-[40%] border-b-[2px] border-white flex flex-col items-center justify-center py-1 bg-white/5">
                                                <span className="text-white font-bold text-[56px] leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ភាគហ៊ុន ឬចំណែកដែលមាន</span>
                                                <span className="text-white text-[44px] font-black uppercase tracking-widest">Shares Held</span>
                                            </div>
                                            <div className="flex-1 flex">
                                                <div className="w-1/2 border-r-[2px] border-white flex flex-col">
                                                    <div className="h-1/2 border-b-[2px] border-white flex flex-col items-center justify-center py-2">
                                                        <span className="text-white font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដើមការិយបរិច្ឆេទ</span>
                                                        <span className="text-white text-[28px] font-black uppercase">Beginning of the Period</span>
                                                    </div>
                                                    <div className="flex-1 flex italic text-[32px] font-bold text-white">
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
                                                        <span className="text-white font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចុងការិយបរិច្ឆេទ</span>
                                                        <span className="text-white text-[28px] font-black uppercase">End of the Period</span>
                                                    </div>
                                                    <div className="flex-1 flex italic text-[32px] font-bold text-white">
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

                                    <div className="bg-white/10 border-b-[2px] border-white px-4 py-4 font-bold text-[60px] uppercase text-white flex flex-col">
                                        <span style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ក. មូលធន/មូលធនភាគហ៊ុនចុះបញ្ជី</span>
                                        <span className="text-white text-[44px] font-black tracking-tight">A. Registered Capital / Share Capital</span>
                                    </div>
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <div key={r} className="flex border-b border-white/10 h-12 hover:bg-white/5 transition-colors group">
                                            <div className="w-[20%] border-r border-white/10 p-2 relative">
                                                <span className="absolute left-1 top-1 text-white text-[26px] font-mono">{r <= 3 ? r : ''}{r === 3 ? '...' : ''}</span>
                                                <input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] font-bold ml-2" />
                                            </div>
                                            <div className="w-[18%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px]" /></div>
                                            <div className="w-[12%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-center" /></div>
                                            <div className="flex-1 flex">
                                                <div className="w-1/2 flex border-r border-white/10">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[38px] text-center" /></div>
                                                    <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-right" /></div>
                                                </div>
                                                <div className="flex-1 flex">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[38px] text-center" /></div>
                                                    <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-right" /></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex h-12 bg-white/10 border-b-[2px] border-white">
                                        <div className="w-[50%] border-r-[2px] border-white flex flex-col items-center justify-center">
                                            <span className="text-white font-bold text-[56px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>សរុប</span>
                                            <span className="text-white text-[38px] font-black uppercase">Total</span>
                                        </div>
                                        <div className="flex-1 flex">
                                            <div className="w-1/2 flex border-r-[2px] border-white">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[36px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[36px]">-</div>
                                            </div>
                                            <div className="flex-1 flex">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[36px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[36px]">-</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/10 border-y-[2px] border-white px-4 py-4 font-bold text-[60px] uppercase text-white flex flex-col">
                                        <span style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ខ. មូលធន/មូលធនភាគហ៊ុន (បានបង់)</span>
                                        <span className="text-white text-[44px] font-black tracking-tight">B. Paid up Capital / Share Capital</span>
                                    </div>
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <div key={r} className="flex border-b border-white/10 h-12 hover:bg-white/5 transition-colors group">
                                            <div className="w-[20%] border-r border-white/10 p-2 relative">
                                                <span className="absolute left-1 top-1 text-white text-[26px] font-mono">{r <= 3 ? r : ''}{r === 3 ? '...' : ''}</span>
                                                <input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] font-bold ml-2" />
                                            </div>
                                            <div className="w-[18%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px]" /></div>
                                            <div className="w-[12%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-center" /></div>
                                            <div className="flex-1 flex">
                                                <div className="w-1/2 flex border-r border-white/10">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[38px] text-center" /></div>
                                                    <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-right" /></div>
                                                </div>
                                                <div className="flex-1 flex">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[38px] text-center" /></div>
                                                    <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-right" /></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex h-12 bg-white/10">
                                        <div className="w-[50%] border-r-[2px] border-white flex flex-col items-center justify-center">
                                            <span className="text-white font-bold text-[56px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>សរុប</span>
                                            <span className="text-white text-[38px] font-black uppercase">Total</span>
                                        </div>
                                        <div className="flex-1 flex">
                                            <div className="w-1/2 flex border-r-[1px] border-white/30">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[36px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[36px]">-</div>
                                            </div>
                                            <div className="flex-1 flex">
                                                <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[36px]">0%</div>
                                                <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[36px]">-</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: EMPLOYEE INFORMATION */}
                            <div className="flex flex-col">
                                {/* EMPLOYEE INFO BOXED HEADER */}
                                <div className="w-full border-[2px] border-white p-6 flex flex-col items-center bg-white/5 relative group">
                                    <h2 className="text-white font-bold text-[116px] tracking-tight leading-none mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ព័ត៌មានអំពីនិយោជិតសហគ្រាសនៅក្នុងការិយបរិច្ឆេទ</h2>
                                    <h1 className="text-white font-black text-[84px] uppercase tracking-tighter">Information About Employees During the Period</h1>
                                </div>

                                {/* EMPLOYEE TABLE */}
                                <div className="w-full mt-10 border-[2px] border-white overflow-hidden bg-white/5 backdrop-blur-sm shadow-2xl">
                                    <div className="flex border-b-[2px] border-white h-[120px] bg-white/10">
                                        <div className="w-[30%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[56px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>បរិយាយ</span>
                                            <span className="text-white text-[44px] font-black uppercase tracking-tight">Description</span>
                                        </div>
                                        <div className="w-[18%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[56px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>តួនាទី</span>
                                            <span className="text-white text-[44px] font-black uppercase tracking-tight">Position</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[56px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ចំនួន</span>
                                            <span className="text-white text-[44px] font-black uppercase tracking-tight">Number</span>
                                        </div>
                                        <div className="w-[22%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center bg-white/5">
                                            <span className="text-white font-bold text-[46px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ប្រាក់បៀវត្សក្រៅពីអត្ថប្រយោជន៍បន្ថែម</span>
                                            <span className="text-white text-[34px] font-black uppercase leading-tight">Salary Excluding<br />Fringe Benefits</span>
                                        </div>
                                        <div className="flex-1 p-3 flex flex-col items-center justify-center text-center">
                                            <span className="text-white font-bold text-[46px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>អត្ថប្រយោជន៍បន្ថែម</span>
                                            <span className="text-white text-[34px] font-black uppercase leading-tight">Fringe Benefits</span>
                                        </div>
                                    </div>

                                    {/* SECTION 1: SHAREHOLDING MANAGERS */}
                                    <div className="flex border-b border-white/10 h-16 hover:bg-white/5 transition-colors">
                                        <div className="w-[30%] border-r border-white/10 px-4 flex flex-col justify-center">
                                            <span className="text-white font-bold text-[56px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>១- អ្នកគ្រប់គ្រងជាម្ចាស់ភាគហ៊ុន</span>
                                            <span className="text-white text-[38px] font-black uppercase">1- Shareholding Managers</span>
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
                                            <div className="w-[30%] border-r border-white/10 px-4 flex items-center italic text-[22px] text-white">-</div>
                                            <div className="w-[18%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-center" /></div>
                                            <div className="w-[10%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-center" placeholder="-" /></div>
                                            <div className="w-[22%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-right" placeholder="-" /></div>
                                            <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-right" placeholder="-" /></div>
                                        </div>
                                    ))}

                                    {/* SECTION 2: NON-SHAREHOLDING MANAGERS */}
                                    <div className="flex border-b border-white/10 h-16 hover:bg-white/5 transition-colors">
                                        <div className="w-[30%] border-r border-white/10 px-4 flex flex-col justify-center">
                                            <span className="text-white font-bold text-[56px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>២- អ្នកគ្រប់គ្រងមិនមែនជាម្ចាស់ភាគហ៊ុន</span>
                                            <span className="text-white text-[38px] font-black uppercase">2- Non-Shareholding Managers</span>
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
                                            <div className="w-[30%] border-r border-white/10 px-4 flex items-center italic text-[22px] text-white">-</div>
                                            <div className="w-[18%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-center" /></div>
                                            <div className="w-[10%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-center" placeholder="-" /></div>
                                            <div className="w-[22%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-right" placeholder="-" /></div>
                                            <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[38px] text-right" placeholder="-" /></div>
                                        </div>
                                    ))}

                                    {/* SUMMARY ROWS */}
                                    <div className="flex border-b-[2px] border-white h-14 bg-white/10">
                                        <div className="w-[48%] border-r-[1px] border-white/30 px-4 flex flex-col justify-center bg-rose-500/5">
                                            <span className="text-white font-bold text-[48px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>៣- សរុបបុគ្គលិក-កម្មករ</span>
                                            <span className="text-white text-[36px] font-black uppercase">3- Total Employees and Workers</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-rose-400">0</div>
                                        <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white">-</div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black text-white">-</div>
                                    </div>
                                    <div className="flex h-14 bg-white/10">
                                        <div className="w-[48%] border-r-[1px] border-white/30 px-4 flex flex-col justify-center bg-emerald-500/5">
                                            <span className="text-white font-bold text-[48px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>៤- បុគ្គលិក-កម្មករជាប់ពន្ធលើប្រាក់បៀវត្ស</span>
                                            <span className="text-white text-[36px] font-black uppercase">4- Taxable Salary for Employees and Workers</span>
                                        </div>
                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-emerald-400">0</div>
                                        <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white">-</div>
                                        <div className="flex-1 flex items-center justify-end px-4 font-black text-white">-</div>
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
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-7xl bg-white/5 backdrop-blur-md border-[2px] border-white p-8 shadow-2xl mb-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-[136px] font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងតុល្យការគិតត្រឹមការិយបរិច្ឆេទ</h2>
                                        <h1 className="text-[112px] font-black text-white uppercase tracking-tighter">BALANCE SHEET AS AT</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-10 h-12 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-xl font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4 text-white">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[26px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ :</span>
                                                <span className="text-[18px] font-black uppercase tracking-tighter">Tax Identification Number (TIN) :</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {['L', '0', '0', '1', '-', '1', '2', '3', '4', '5', '6', '7', '8'].map((char, i) => (
                                                    <div key={i} className={`w-6 h-8 border-[1px] border-white flex items-center justify-center bg-white/5 ${char === '-' ? 'border-0 w-3' : ''}`}>
                                                        {char === '-' ? <span className="font-black text-white">-</span> : <span className="text-[28px] font-black">{formData[`tin_${i}`] || char}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-[1600px] grid grid-cols-2 gap-10 items-start">
                                {/* LEFT COLUMN: NON-CURRENT ASSETS */}
                                <div className="flex flex-col gap-8">
                                    {/* ASSETS TOTAL (A0) - HEADER-LIKE */}
                                    <div className="border-[3px] border-white h-24 bg-rose-500/20 flex items-center font-black text-white shadow-2xl">
                                        <div className="w-[60%] border-r-[2px] border-white px-8">
                                            <span className="text-[48px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>I- ទ្រព្យសម្បត្តិ (A0 = A1 + A13)</span>
                                            <span className="text-[32px] block opacity-80 uppercase">Total Assets</span>
                                        </div>
                                        <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-6 text-[48px] text-rose-400">
                                            {formData.a0_n || '-'}
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-6 text-[48px] text-rose-400">
                                            {formData.a0_n1 || '-'}
                                        </div>
                                    </div>

                                    {/* NON-CURRENT ASSETS (A1-A12) */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                        <div className="flex bg-white/15 border-b-[2px] border-white h-16 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យសម្បត្តិមិនចរន្ត [A1 = សរុប(A2:A12)]</span>
                                                <span className="text-[22px] block font-black uppercase tracking-tight">Non-Current Assets (Fixed Assets)</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">A 1</div>
                                            <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[24px] font-bold">YEAR N</div>
                                            <div className="flex-1 flex items-center justify-center text-[24px] font-bold">YEAR N-1</div>
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
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[32px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[22px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[32px]">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[32px]">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: CURRENT ASSETS */}
                                <div className="flex flex-col gap-8">
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                        <div className="flex bg-indigo-500/20 border-b-[2px] border-white h-16 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យសម្បត្តិចរន្ត [A13 = សរុប(A14:A27)]</span>
                                                <span className="text-[22px] block font-black uppercase">Current Assets</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">A 13</div>
                                            <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[24px] font-bold">YEAR N</div>
                                            <div className="flex-1 flex items-center justify-center text-[24px] font-bold">YEAR N-1</div>
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
                            </div>
                        </div>
                    )}



                    {activePage === 4 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-7xl bg-white/5 backdrop-blur-md border-[2px] border-white p-8 shadow-2xl mb-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-[136px] font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងតុល្យការគិតត្រឹមការិយបរិច្ឆេទ (បន្ត)</h2>
                                        <h1 className="text-[112px] font-black text-white uppercase tracking-tighter">BALANCE SHEET (LIABILITIES & EQUITY)</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-10 h-12 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-xl font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4 text-white">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[26px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ :</span>
                                                <span className="text-[18px] font-black uppercase tracking-tighter">Tax Identification Number (TIN) :</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {['L', '0', '0', '1', '-', '1', '2', '3', '4', '5', '6', '7', '8'].map((char, i) => (
                                                    <div key={i} className={`w-6 h-8 border-[1px] border-white flex items-center justify-center bg-white/5 ${char === '-' ? 'border-0 w-3' : ''}`}>
                                                        {char === '-' ? <span className="font-black text-white">-</span> : <span className="text-[28px] font-black">{formData[`tin_${i}`] || char}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-[1600px] grid grid-cols-2 gap-10 items-start">
                                {/* LEFT COLUMN: EQUITY */}
                                <div className="flex flex-col gap-8">
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 backdrop-blur-sm shadow-xl">
                                        <div className="flex bg-white/15 border-b-[2px] border-white h-16 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មូលនិធិ/ឧបត្ថម្ភទ្រព្យ [A29 = សរុប(A30:A36)]</span>
                                                <span className="text-[22px] block font-black uppercase tracking-tight">Equity (A29)</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">REF</div>
                                            <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[24px] font-bold">YEAR N</div>
                                            <div className="flex-1 flex items-center justify-center text-[24px] font-bold">YEAR N-1</div>
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
                                            <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[32px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[22px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[32px]">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[32px]">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex bg-white/10 h-16 items-center font-black">
                                            <div className="w-[60%] border-r-[2px] border-white px-8 text-[36px]">TOTAL EQUITY (A29)</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 text-emerald-400 text-[36px]">{formData.a29_n || '-'}</div>
                                            <div className="flex-1 flex items-center justify-end px-4 text-emerald-400 text-[36px]">{formData.a29_n1 || '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: LIABILITIES */}
                                <div className="flex flex-col gap-8">
                                    {/* NON-CURRENT LIABILITIES */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-rose-500/10 border-b-[2px] border-white h-14 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[32px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បំណុលមិនចរន្ត [A37 = សរុប(A38:A41)]</span>
                                                <span className="text-[20px] block font-black uppercase">Non-Current Liabilities (A37)</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[24px]">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[20px] font-bold">N</div>
                                            <div className="flex-1 flex items-center justify-center text-[20px] font-bold">N-1</div>
                                        </div>
                                        {[
                                            { ref: "A 38", kh: "បំណុលភាគីពាក់ព័ន្ធ", en: "Related parties", key: "a38" },
                                            { ref: "A 39", kh: "បំណុលធនាគារ/ក្រៅ", en: "Banks/External", key: "a39" },
                                            { ref: "A 40", kh: "សំវិធានធន", en: "Provisions", key: "a40" },
                                            { ref: "A 41", kh: "បំណុលវែងផ្សេងៗ", en: "Other non-current liabilities", key: "a41" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-11 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[26px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[20px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[20px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CURRENT LIABILITIES */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 shadow-xl">
                                        <div className="flex bg-rose-500/20 border-b-[2px] border-white h-14 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[32px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បំណុលចរន្ត [A42 = សរុប(A43:A50)]</span>
                                                <span className="text-[20px] block font-black uppercase">Current Liabilities (A42)</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[24px]">REF</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-center text-[20px] font-bold">N</div>
                                            <div className="flex-1 flex items-center justify-center text-[20px] font-bold">N-1</div>
                                        </div>
                                        {[
                                            { ref: "A 43", kh: "ឥណទានវិបារូប៍ក្នុងស្រុក", en: "Local bank overdraft", key: "a43" },
                                            { ref: "A 44", kh: "បំណុលមានការប្រាក់", en: "Interest bearing debt", key: "a44" },
                                            { ref: "A 45", kh: "ត្រូវសងភាគីពាក់ព័ន្ធ", en: "Payable to related parties", key: "a45" },
                                            { ref: "A 46", kh: "គណនីត្រូវសង / អ្នកផ្គត់ផ្គង់", en: "Accounts payable / suppliers", key: "a46" },
                                            { ref: "A 47", kh: "បំណុលបង់ទុកមុន", en: "Prepaid liabilities", key: "a47" },
                                            { ref: "A 48", kh: "បំណុលពន្ធ-អាករ", en: "Taxes payable", key: "a48" },
                                            { ref: "A 49", kh: "បំណុលចរន្តផ្សេងៗ", en: "Other current liabilities", key: "a49" },
                                            { ref: "A 50", kh: "លទ្ធផល (ចំណេញ/ខាត) ពីបរិវត្តរូបិយប័ណ្ណនៃបំណុល", en: "Gain/(loss) on currency translation of liabilities", key: "a50" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-11 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[26px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[20px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[20px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* GRAND TOTAL LIABILITIES & EQUITY (A28) */}
                                    <div className="border-[3px] border-white h-24 bg-emerald-500/20 flex items-center font-black text-white shadow-2xl">
                                        <div className="w-[60%] border-r-[2px] border-white px-8">
                                            <span className="text-[44px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>II- បំណុល និងបុព្វលាភ (A28 = A29 + A37 + A42)</span>
                                            <span className="text-[28px] block opacity-80 uppercase">Total Liabilities & Equity</span>
                                        </div>
                                        <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-6 text-[48px] text-emerald-400">
                                            {formData.a28_n || '-'}
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-6 text-[48px] text-emerald-400">
                                            {formData.a28_n1 || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAGE 5 CONTENT - PROFIT & LOSS */}
                    {activePage === 5 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-7xl bg-white/5 backdrop-blur-md border-[2px] border-white p-8 shadow-2xl mb-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-[136px] font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍លទ្ធផលសម្រាប់គ្រាជាប់ពន្ធ</h2>
                                        <h1 className="text-[112px] font-black text-white uppercase tracking-tighter">INCOME STATEMENT FOR THE YEAR ENDED</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex gap-1">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-10 h-12 border-[2px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-xl font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4 text-white">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[26px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ :</span>
                                                <span className="text-[18px] font-black uppercase tracking-tighter">Tax Identification Number (TIN) :</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {['L', '0', '0', '1', '-', '1', '2', '3', '4', '5', '6', '7', '8'].map((char, i) => (
                                                    <div key={i} className={`w-6 h-8 border-[1px] border-white flex items-center justify-center bg-white/5 ${char === '-' ? 'border-0 w-3' : ''}`}>
                                                        {char === '-' ? <span className="font-black text-white">-</span> : <span className="text-[28px] font-black">{formData[`tin_${i}`] || char}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-[1600px] grid grid-cols-2 gap-10 items-start">
                                {/* LEFT COLUMN: REVENUES & COGS */}
                                <div className="flex flex-col gap-8">
                                    {/* SECTION III: OPERATING REVENUES */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                        <div className="flex bg-white/15 border-b-[2px] border-white h-16 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[40px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>III- ចំណូលប្រតិបត្តិការ [B0 = សរុប(B1:B3)]</span>
                                                <span className="text-[24px] block font-black uppercase">Operating Revenues [B0 = Sum(B1:B3)]</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">B 0</div>
                                            <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[24px] font-bold">YEAR N</div>
                                            <div className="flex-1 flex items-center justify-center text-[24px] font-bold">YEAR N-1</div>
                                        </div>
                                        {[
                                            { ref: "B 1", kh: "ការលក់ផលិតផល", en: "Sales of products", key: "b1" },
                                            { ref: "B 2", kh: "ការលក់ទំនិញ", en: "Sales of goods", key: "b2" },
                                            { ref: "B 3", kh: "ការផ្គត់ផ្គង់សេវា", en: "Supplies of services", key: "b3" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[32px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[22px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[32px]">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[32px]">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* SECTION IV: COGS & GROSS PROFIT */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                        <div className="flex bg-white/15 border-b-[2px] border-white h-16 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[40px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>IV- ថ្លៃដើមផលិតផល និង Gross Profit</span>
                                                <span className="text-[24px] block font-black uppercase">COGS & Gross Profit (B7)</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">REF</div>
                                            <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[24px] font-bold">YEAR N</div>
                                            <div className="flex-1 flex items-center justify-center text-[24px] font-bold">YEAR N-1</div>
                                        </div>
                                        {[
                                            { ref: "B 4", kh: "ថ្លៃដើមលក់ផលិតផល (សហគ្រាសផលិត)", en: "COPS (Production enterprises)", key: "b4" },
                                            { ref: "B 5", kh: "ថ្លៃដើមលក់ទំនិញ (សហគ្រាសមិនមែនផលិត)", en: "COGS (Non-production enterprises)", key: "b5" },
                                            { ref: "B 6", kh: "ថ្លៃដើមសេវាផ្គត់ផ្គង់", en: "Cost of services supplied", key: "b6" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-14 items-center hover:bg-white/5 transition-colors">
                                                <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                    <span className="font-bold text-[32px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[22px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[24px] font-black">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[32px]">
                                                    {formData[row.key + '_n'] || '-'}
                                                </div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[32px]">
                                                    {formData[row.key + '_n1'] || '-'}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex bg-rose-500/20 border-t-[2px] border-white h-16 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-6">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លទ្ធផលដុល (B7 = B0 - B4 - B5 - B6)</span>
                                                <span className="text-[22px] block font-black uppercase">Gross Profit</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[32px]">B 7</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[36px] text-rose-400">$ 0.00</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-[36px] text-rose-400">$ 0.00</div>
                                        </div>
                                    </div>

                                    {/* SUBSIDIARY REVENUES (B8:B11) */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                        <div className="flex bg-white/15 border-b-[2px] border-white h-14 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលបន្ទាប់បន្សំ [B8 = សរុប(B9:B11)]</span>
                                                <span className="text-[22px] block font-black uppercase">Subsidiary Revenues</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">B 8</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[36px]">$ 0.00</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-[36px]">$ 0.00</div>
                                        </div>
                                        {[
                                            { ref: "B 9", kh: "ចំណូលពីការដូរភតិសន្យា ទទួល ឬត្រូវទទួល", en: "Rental fees received or receivable", key: "b9" },
                                            { ref: "B 10", kh: "ចំណូលពីសិទ្ធិប្រើប្រាស់ ទទួល ឬត្រូវទទួល", en: "Royalties received or receivable", key: "b10" },
                                            { ref: "B 11", kh: "ចំណូលបន្ទាប់បន្សំផ្សេងទៀត", en: "Other subsidiary revenues", key: "b11" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-12 items-center last:border-0 hover:bg-white/5 transition-colors">
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

                                    {/* OTHER REVENUES (B12:B21) */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                        <div className="flex bg-white/15 border-b-[2px] border-white h-14 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលផ្សេងៗ [B12 = សរុប(B13:B21)]</span>
                                                <span className="text-[22px] block font-black uppercase">Other Revenues</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">B 12</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[36px]">$ 0.00</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-[36px]">$ 0.00</div>
                                        </div>
                                        {[
                                            { ref: "B 13", kh: "ជំនួយ/ឧបត្ថម្ភ", en: "Grants/Subsidies", key: "b13" },
                                            { ref: "B 14", kh: "ភាគលាភ ទទួល ឬត្រូវទទួល", en: "Dividends received or receivable", key: "b14" },
                                            { ref: "B 15", kh: "ការប្រាក់ ទទួល ឬត្រូវទទួល", en: "Interests received or receivable", key: "b15" },
                                            { ref: "B 16", kh: "លាភពីការលក់ទ្រព្យសកម្មថេរ", en: "Gain on disposal of fixed assets", key: "b16" },
                                            { ref: "B 17", kh: "លាភពីការលក់មូលបត្រ", en: "Gain on disposal of securities", key: "b17" },
                                            { ref: "B 18", kh: "ចំណែកប្រាក់ចំណេញពីសហគ្រាសចម្រុះ", en: "Share of profits from joint venture", key: "b18" },
                                            { ref: "B 19", kh: "លាភ (ចំណេញ) សម្រេចពីប្តូររូបិយប័ណ្ណ", en: "Gain on realized currency translation", key: "b19" },
                                            { ref: "B 20", kh: "លាភ (ចំណេញ) មិនទាន់សម្រេចពីប្តូររូបិយប័ណ្ណ", en: "Gain on unrealized currency translation", key: "b20" },
                                            { ref: "B 21", kh: "ចំណូលផ្សេងទៀត", en: "Other revenues", key: "b21" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 h-12 items-center last:border-0 hover:bg-white/5 transition-colors">
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

                                {/* RIGHT COLUMN: OPERATING EXPENSES */}
                                <div className="flex flex-col gap-8">
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                        <div className="flex bg-indigo-500/20 border-b-[2px] border-white h-16 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4">
                                                <span className="font-bold text-[40px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>V- ចំណាយប្រតិបត្តិការសរុប [B22 = សរុប(B23:B41)]</span>
                                                <span className="text-[24px] block font-black uppercase">Total Operating Expenses</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[28px]">B 22</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[36px]">$ 0.00</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-[36px]">$ 0.00</div>
                                        </div>
                                        <div className="grid grid-cols-1">
                                            {[
                                                { ref: "B 23", kh: "ចំណាយប្រាក់បៀវត្ស", en: "Salary expenses", key: "b23" },
                                                { ref: "B 24", kh: "ចំណាយប្រេង ហ្គាស អគ្គិសនី និងទឹក", en: "Fuel, gas, electricity and water expenses", key: "b24" }
                                            ].map((row, idx) => (
                                                <div key={idx} className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                    <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                        <span className="font-bold text-[26px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="text-[18px] font-bold opacity-70">{row.en}</span>
                                                    </div>
                                                    <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[18px] font-black">{row.ref}</div>
                                                    <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[26px]">
                                                        {formData[row.key + '_n'] || '-'}
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-end px-4 font-black text-[26px]">
                                                        {formData[row.key + '_n1'] || '-'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SECTION VI: NET RESULT */}
                                    <div className="border-[2px] border-white h-24 bg-emerald-500/20 flex items-center font-black text-white shadow-2xl">
                                        <div className="w-[60%] border-r-[2px] border-white px-8">
                                            <span className="text-[48px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>VI- លទ្ធផលជារួម (ចំណេញ/ខាត) : B42</span>
                                            <span className="text-[32px] block opacity-80 uppercase">Overall Result (Net Profit / Loss)</span>
                                        </div>
                                        <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-6 text-[48px] text-emerald-400">$ 0.00</div>
                                        <div className="flex-1 flex items-center justify-end px-6 text-[48px] text-emerald-400">$ 0.00</div>
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
                                        <div className="flex items-center gap-4 text-white">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[26px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ :</span>
                                                <span className="text-[18px] font-black uppercase tracking-tighter">Tax Identification Number (TIN) :</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {['L', '0', '0', '1', '-', '1', '2', '3', '4', '5', '6', '7', '8'].map((char, i) => (
                                                    <div key={i} className={`w-6 h-8 border-[1px] border-white flex items-center justify-center bg-white/5 ${char === '-' ? 'border-0 w-3' : ''}`}>
                                                        {char === '-' ? <span className="font-black text-white">-</span> : <span className="text-[28px] font-black">{formData[`tin_${i}`] || char}</span>}
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
                                        <div className="flex items-center gap-4 text-white">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[26px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ :</span>
                                                <span className="text-[18px] font-black uppercase tracking-tighter">Tax Identification Number (TIN) :</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {['L', '0', '0', '1', '-', '1', '2', '3', '4', '5', '6', '7', '8'].map((char, i) => (
                                                    <div key={i} className={`w-6 h-8 border-[1px] border-white flex items-center justify-center bg-white/5 ${char === '-' ? 'border-0 w-3' : ''}`}>
                                                        {char === '-' ? <span className="font-black text-white">-</span> : <span className="text-[28px] font-black">{formData[`tin_${i}`] || char}</span>}
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
                                        <div className="flex items-center gap-4 text-white">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[26px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ :</span>
                                                <span className="text-[18px] font-black uppercase tracking-tighter">Tax Identification Number (TIN) :</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {['L', '0', '0', '1', '-', '1', '2', '3', '4', '5', '6', '7', '8'].map((char, i) => (
                                                    <div key={i} className={`w-6 h-8 border-[1px] border-white flex items-center justify-center bg-white/5 ${char === '-' ? 'border-0 w-3' : ''}`}>
                                                        {char === '-' ? <span className="font-black text-white">-</span> : <span className="text-[28px] font-black">{formData[`tin_${i}`] || char}</span>}
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
                                        <div className="flex items-center gap-4 text-white">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[26px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ :</span>
                                                <span className="text-[18px] font-black uppercase tracking-tighter">Tax Identification Number (TIN) :</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {['L', '0', '1', '2', '-', '1', '2', '3', '4', '5', '6', '7', '8'].map((char, i) => (
                                                    <div key={i} className={`w-6 h-8 border-[1px] border-white flex items-center justify-center bg-white/5 ${char === '-' ? 'border-0 w-3' : ''}`}>
                                                        {char === '-' ? <span className="font-black text-white">-</span> : <span className="text-[28px] font-black">{formData[`tin_${i}`] || char}</span>}
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
                                            <div className="flex items-center gap-8 text-white">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[32px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ :</span>
                                                    <span className="text-[22px] font-black uppercase tracking-tight text-white/40">Tax Identification Number (TIN) :</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-2">
                                                        {["1", "2", "3", "4", "5", "6", "7", "8"].map((char, i) => (
                                                            <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                                <span className="text-[32px] font-black">{char}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="w-8 h-[3px] bg-white opacity-40 mx-2" />
                                                    <div className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">9</span>
                                                    </div>
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

                                    {/* TIN BOX IN HEADER AREA */}
                                    <div className="absolute -bottom-10 right-0 flex items-center gap-6 bg-slate-950 px-6 py-2 border-[2px] border-white/20">
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

                                <div className="w-full flex justify-center mt-12 gap-8 items-center">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[20px] font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :</span>
                                        <span className="text-[16px] font-black text-white/40 uppercase">Tax Identification Number (TIN) :</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {["1", "2", "3", "4", "5", "6", "7", "8"].map((char, i) => (
                                                <div key={i} className="w-9 h-12 border-[2px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[22px] font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-6 h-1 bg-white" />
                                        <div className="w-9 h-12 border-[2px] border-white flex items-center justify-center bg-white/5">
                                            <span className="text-[22px] font-black text-white">9</span>
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
                                                {["2", "0", "2", "6"].map((char, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">{char}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-6">
                                                <span className="text-[28px] font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :</span>
                                                <span className="text-[22px] font-black text-white/40 uppercase">Tax Identification Number (TIN) :</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-4">
                                                <div className="flex gap-2">
                                                    {["1", "2", "3", "4", "5", "6", "7", "8"].map((char, i) => (
                                                        <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                            <span className="text-[32px] font-black text-white">{char}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="w-8 h-[3px] bg-white opacity-40 mx-2" />
                                                <div className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[32px] font-black text-white">9</span>
                                                </div>
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
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white/20">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[28px] font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                                                <span className="text-[22px] font-black text-white/50 uppercase">Tax Year</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {["2", "0", "2", "6"].map((char, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/10">
                                                        <span className="text-[32px] font-black text-white">{char}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 bg-slate-950 p-6 border-[3px] border-white/20">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[28px] font-bold text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :</span>
                                                <span className="text-[22px] font-black text-white/50 uppercase whitespace-nowrap">Tax Identification Number (TIN) :</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {["1", "2", "3", "4", "5", "6", "7", "8"].map((char, i) => (
                                                    <div key={i} className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                        <span className="text-[32px] font-black text-white">{char}</span>
                                                    </div>
                                                ))}
                                                <div className="w-8 h-[3px] bg-white opacity-40 mx-2 self-center" />
                                                <div className="w-12 h-16 border-[3px] border-white flex items-center justify-center bg-white/5">
                                                    <span className="text-[32px] font-black text-white">9</span>
                                                </div>
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
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-[2000px] bg-white/5 backdrop-blur-md border-[6px] border-white p-16 shadow-2xl mb-16">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-6">
                                        <h2 className="text-[180px] font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ផលចំណេញ/ខាតប្តូរប្រាក់</h2>
                                        <h1 className="text-[140px] font-black text-white uppercase tracking-tighter">SCHEDULE 7: FOREIGN EXCHANGE RESULT</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-10">
                                        <div className="flex gap-3">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-28 h-32 border-[6px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-[64px] font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-6xl flex flex-col gap-12">
                                <div className="border-[4px] border-white overflow-hidden text-white bg-white/5 shadow-2xl">
                                    <div className="flex bg-amber-500/20 border-b-[4px] border-white h-24 items-center">
                                        <div className="w-[60%] border-r-[4px] border-white px-8">
                                            <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការបូកសរុបផលចំណេញ/ខាតប្តូរប្រាក់</span>
                                            <span className="text-[26px] block font-black uppercase">Foreign Exchange Gain/Loss Summary</span>
                                        </div>
                                        <div className="w-[15%] border-r-[4px] border-white flex items-center justify-center font-black text-[28px]">REF</div>
                                        <div className="flex-1 flex items-center justify-center text-[28px] font-bold">AMOUNT</div>
                                    </div>

                                    {[
                                        { ref: "H 1", kh: "ផលចំណេញសម្រេចពីការប្តូរប្រាក់", en: "Realised Gain on Foreign Exchange", key: "h1" },
                                        { ref: "H 2", kh: "ខាតសម្រេចពីការប្តូរប្រាក់", en: "Realised Loss on Foreign Exchange", key: "h2" },
                                        { ref: "H 3", kh: "ផលចំណេញមិនទាន់សម្រេចពីការប្តូរប្រាក់", en: "Unrealised Gain on Foreign Exchange", key: "h3" },
                                        { ref: "H 4", kh: "ខាតមិនទាន់សម្រេចពីការប្តូរប្រាក់", en: "Unrealised Loss on Foreign Exchange", key: "h4" },
                                        { ref: "H 5", kh: "លទ្ធផលសុទ្ធ (H5 = H1 - H2 + H3 - H4)", en: "Net FX Result", key: "h5", isGrandTotal: true },
                                    ].map((row, idx) => (
                                        <div key={idx} className={`flex border-b border-white/10 h-24 items-center last:border-0 hover:bg-white/5 transition-colors 
                                            ${row.isGrandTotal ? 'bg-amber-500/30 h-32 border-t-[4px] border-white' : ''}`}>
                                            <div className="w-[60%] border-r-[4px] border-white px-10 flex flex-col">
                                                <span className={`${row.isGrandTotal ? 'text-[44px]' : 'text-[32px]'} font-bold leading-tight`} style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className={`${row.isGrandTotal ? 'text-[28px]' : 'text-[22px]'} font-bold opacity-70`}>{row.en}</span>
                                            </div>
                                            <div className="w-[15%] border-r-[4px] border-white flex items-center justify-center opacity-40 text-[26px] font-black">{row.ref}</div>
                                            <div className={`flex-1 flex items-center justify-end px-10 font-black ${row.isGrandTotal ? 'text-[48px] text-amber-300' : 'text-[36px]'}`}>
                                                <input type="text" className="w-full bg-transparent text-right outline-none" value={formData[row.key] || ""} onChange={(e) => handleFormChange(row.key, e.target.value)} placeholder="0.00" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage === 15 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* PAGE HEADER */}
                            <div className="w-full max-w-[2000px] bg-white/5 backdrop-blur-md border-[6px] border-white p-16 shadow-2xl mb-16">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-6">
                                        <h2 className="text-[180px] font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យសកម្មអរូបី</h2>
                                        <h1 className="text-[140px] font-black text-white uppercase tracking-tighter">SCHEDULE 8: INTANGIBLE FIXED ASSETS</h1>
                                    </div>
                                    <div className="flex flex-col items-end gap-10">
                                        <div className="flex gap-3">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-28 h-32 border-[6px] border-white flex items-center justify-center bg-white/10">
                                                    <span className="text-[64px] font-black text-white">{char}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-6xl flex flex-col gap-12">
                                <div className="border-[4px] border-white overflow-hidden text-white bg-white/5 shadow-2xl">
                                    <div className="flex bg-indigo-500/20 border-b-[4px] border-white h-24 items-center">
                                        <div className="w-[60%] border-r-[4px] border-white px-8">
                                            <span className="font-bold text-[36px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យសកម្មអរូបី និងការរំលស់</span>
                                            <span className="text-[26px] block font-black uppercase">Intangible Assets & Amortisation</span>
                                        </div>
                                        <div className="w-[15%] border-r-[4px] border-white flex items-center justify-center font-black text-[28px]">RATE</div>
                                        <div className="flex-1 flex items-center justify-center text-[28px] font-bold">AMOUNT</div>
                                    </div>

                                    {[
                                        { kh: "កម្មសិទ្ធិបញ្ញា (Patents, Copyrights)", en: "Intellectual Property", rate: "10%", key: "ia1" },
                                        { kh: "សិទ្ធិប្រើប្រាស់ទិន្នន័យ (Data rights)", en: "Software / Data Usage", rate: "25%", key: "ia2" },
                                        { kh: "កេរ្តិ៍ឈ្មោះ (Goodwill)", en: "Goodwill", rate: "10%", key: "ia3" },
                                        { kh: "ទ្រព្យសកម្មអរូបីផ្សេងទៀត", en: "Other Intangible Assets", rate: "Life", key: "ia4" },
                                        { kh: "សរុបរំលស់អរូបី (IA5)", en: "Total Amortisation", key: "ia5", isGrandTotal: true },
                                    ].map((row, idx) => (
                                        <div key={idx} className={`flex border-b border-white/10 h-24 items-center last:border-0 hover:bg-white/5 transition-colors 
                                            ${row.isGrandTotal ? 'bg-indigo-500/30 h-32 border-t-[4px] border-white' : ''}`}>
                                            <div className="w-[60%] border-r-[4px] border-white px-10 flex flex-col">
                                                <span className={`${row.isGrandTotal ? 'text-[44px]' : 'text-[32px]'} font-bold leading-tight`} style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                <span className={`${row.isGrandTotal ? 'text-[28px]' : 'text-[22px]'} font-bold opacity-70`}>{row.en}</span>
                                            </div>
                                            <div className="w-[15%] border-r-[4px] border-white flex items-center justify-center opacity-40 text-[32px] font-black text-indigo-300">{row.rate}</div>
                                            <div className={`flex-1 flex items-center justify-end px-10 font-black ${row.isGrandTotal ? 'text-[48px] text-emerald-400' : 'text-[36px]'}`}>
                                                <input type="text" className="w-full bg-transparent text-right outline-none" value={formData[row.key] || ""} onChange={(e) => handleFormChange(row.key, e.target.value)} placeholder="0.00" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activePage > 15 && (
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
