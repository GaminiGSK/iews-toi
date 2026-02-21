import React, { useState } from 'react';
import DynamicForm from '../components/DynamicForm';
import { ArrowLeft, Layout, Save, Eye, Code, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * TAX FORM WORKBENCH
 * This is an isolated development environment for building the tax form body part by part.
 * It does not connect to any backend or sockets, allowing for pure UI/UX iteration.
 */

const WORKBENCH_SCHEMA = {
    title: "Annual Income Tax Return (Workbench)",
    titleKh: "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED",
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

const TaxFormWorkbench = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        taxMonths: "12",
        fromDate: "01012026",
        untilDate: "31122026",
        enterpriseName: "GK SMART TESTING LTD",
        tin: "L001-123456789",
        directorName: "DR. GK SMART"
    });
    const [previewMode, setPreviewMode] = useState('editor'); // 'editor' | 'preview'
    const [activePage, setActivePage] = useState(1);

    const handleFormChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        console.log(`[Workbench] Updated ${key}:`, value);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col font-sans">
            {/* Workbench Header */}
            <div className="bg-[#1e293b] border-b border-white/10 px-8 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 hover:bg-white/5 rounded-lg text-white transition"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="hidden lg:block">
                        <div className="flex items-center gap-2">
                            <Layout size={16} className="text-rose-500" />
                            <h1 className="text-sm font-bold text-white uppercase tracking-tight">Workbench</h1>
                        </div>
                    </div>
                </div>

                {/* 27 PAGE SELECTION - SYNCED FROM LIVE WORKSPACE */}
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
                    <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                        <button
                            onClick={() => setPreviewMode('editor')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-2 transition ${previewMode === 'editor' ? 'bg-rose-500 text-white' : 'text-white hover:text-white'}`}
                        >
                            <Code size={12} /> Designer
                        </button>
                        <button
                            onClick={() => setPreviewMode('preview')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-2 transition ${previewMode === 'preview' ? 'bg-rose-500 text-white' : 'text-white hover:text-white'}`}
                        >
                            <Eye size={12} /> Live Preview
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebars removed for clean experimental surface */}

                {/* Main Canvas: Digital Slate */}
                <div className="flex-1 bg-[#0f172a] overflow-y-auto px-10 py-10 flex justify-start no-scrollbar">
                    <div className="w-full">
                        {activePage === 1 && (
                            <div className="animate-fade-in relative px-10 py-16 grid grid-cols-2 gap-20">
                                {/* LEFT COLUMN - EXISTING CONTENT */}
                                <div className="flex flex-col">
                                    {/* DOCUMENT HEADER PART 1 - PURE WHITE */}
                                    <div className="flex justify-between items-center border-b-[1px] border-white pb-10">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-white font-bold text-[40px] mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លិខិតប្រកាសពន្ធលើចំណូលប្រចាំឆ្នាំចំពោះសហគ្រាសជាប់ពន្ធលើចំណូលតាមរបបស្វ័យប្រកាស</h2>
                                            <h1 className="text-white font-black text-[36px] uppercase tracking-tighter">Annual Income Tax Return <span className="text-white font-bold uppercase ml-2">For the Year Ended</span></h1>
                                        </div>

                                        {/* 4 SQUARE BOXES - PURE WHITE */}
                                        <div className="flex gap-2">
                                            {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                <div key={i} className="w-12 h-14 border-[1px] border-white flex items-center justify-center transition shadow-inner">
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

                                    {/* TAX PERIOD & DATE RANGE - ENHANCED SPACING & SIZE */}
                                    <div className="mt-16 flex flex-col gap-12 border-b-[1px] border-white/20 pb-12">
                                        <div className="flex items-center gap-20">
                                            {/* TAX PERIOD */}
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទជាប់ពន្ធ (ចំនួនខែ)</span>
                                                    <span className="text-white text-[22px] font-black uppercase tracking-widest leading-none">Tax Period (Number of Month)</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {(formData.taxMonths || "12").split('').map((char, i) => (
                                                        <div key={i} className="w-12 h-14 border border-white flex items-center justify-center bg-white/5 shadow-inner">
                                                            <input
                                                                type="text"
                                                                maxLength="1"
                                                                className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl"
                                                                value={char}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    const newMonths = (formData.taxMonths || "12").split('');
                                                                    newMonths[i] = val;
                                                                    handleFormChange('taxMonths', newMonths.join(''));
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ARROW */}
                                            <div className="text-white opacity-40">
                                                <Play size={24} fill="white" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                                            </div>

                                            {/* START DATE */}
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ពីថ្ងៃ</span>
                                                    <span className="text-white text-[22px] font-black uppercase tracking-widest leading-none">From</span>
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
                                                                        <input
                                                                            type="text"
                                                                            maxLength="1"
                                                                            className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl"
                                                                            value={formData.fromDate?.[charIdx] || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                const newDate = (formData.fromDate || "01012026").split('');
                                                                                newDate[charIdx] = val;
                                                                                handleFormChange('fromDate', newDate.join(''));
                                                                            }}
                                                                        />
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
                                                <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដល់ថ្ងៃ</span>
                                                <span className="text-white text-[22px] font-black uppercase tracking-widest leading-none">Until</span>
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
                                                                    <input
                                                                        type="text"
                                                                        maxLength="1"
                                                                        className="w-full h-full text-center text-white bg-transparent outline-none font-black text-2xl"
                                                                        value={formData.untilDate?.[charIdx] || ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            const newDate = (formData.untilDate || "31122026").split('');
                                                                            newDate[charIdx] = val;
                                                                            handleFormChange('untilDate', newDate.join(''));
                                                                        }}
                                                                    />
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
                                            { kh: "ឈ្មោះសហគ្រាស ៖", en: "Name of Enterprise:" },
                                            { kh: "ចំនួនសាខាក្នុងស្រុក ៖", en: "Number of Local Branch:" },
                                            { kh: "កាលបរិច្ឆេទចុះបញ្ជីសារពើពន្ធ ៖", en: "Date of Tax Registration:" },
                                            { kh: "ឈ្មោះអភិបាល/អ្នកគ្រប់គ្រង/ម្ចាស់សហគ្រាស ៖", en: "Name of Director/Manager/Owner:" },
                                            { kh: "សកម្មភាពអាជីវកម្មចម្បង ៖", en: "Main Business Activities:" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b-[2px] border-white last:border-0 h-24">
                                                {/* LABEL COLUMN */}
                                                <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                                    <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-white text-[22px] font-black uppercase tracking-widest leading-none">{row.en}</span>
                                                </div>
                                                {/* INPUT COLUMN */}
                                                <div className="flex-1 p-6 flex items-center">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold px-4"
                                                        placeholder="..."
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        {/* SPECIAL ROW: ACCOUNTANT / TAX AGENT */}
                                        <div className="flex h-24">
                                            {/* AGENT NAME */}
                                            <div className="w-[30%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                                <span className="text-white font-bold text-[24px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះភ្នាក់ងារសេវាកម្មពន្ធដារ ឬ គណនេយ្យករដែលរៀបចំលិខិតប្រកាស ៖</span>
                                                <span className="text-white text-[20px] font-black uppercase tracking-widest leading-none">Name of Accountant/ Tax Service Agent:</span>
                                            </div>
                                            <div className="w-[20%] border-r-[2px] border-white p-6 items-center">
                                                <input type="text" className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold px-2" placeholder="..." />
                                            </div>
                                            {/* LICENSE NUMBER */}
                                            <div className="w-[25%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                                <span className="text-white font-bold text-[24px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអាជ្ញាប័ណ្ណភ្នាក់ងារសេវាកម្មពន្ធដារ...</span>
                                                <span className="text-white text-[18px] font-black uppercase tracking-tight leading-none">Tax Service Agent License Number:</span>
                                            </div>
                                            <div className="flex-1 p-6 flex items-center">
                                                <input type="text" className="w-full bg-transparent border-none outline-none text-white text-xl font-bold px-2" placeholder="..." />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ADDRESS DETAILS TABLE */}
                                    <div className="mt-8 border-[2px] border-white overflow-hidden">
                                        {[
                                            { kh: "អាសយដ្ឋានបច្ចុប្បន្នរបស់ការិយាល័យចុះបញ្ជី ៖", en: "Current Registered Office Address:" },
                                            { kh: "អាសយដ្ឋានបច្ចុប្បន្នរបស់កន្លែងប្រកបអាជីវកម្មចម្បង ៖", en: "Current Principal Establishment Address:" },
                                            { kh: "អាសយដ្ឋានឃ្លាំង ៖", en: "Warehouse Address:" }
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b-[2px] border-white last:border-0 h-24">
                                                {/* LABEL COLUMN */}
                                                <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                                    <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-white text-[22px] font-black uppercase tracking-widest leading-none">{row.en}</span>
                                                </div>
                                                {/* INPUT COLUMN */}
                                                <div className="flex-1 p-6 flex items-center">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold px-4"
                                                        placeholder="..."
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                </div>

                                {/* RIGHT COLUMN - NEW CONTENT */}
                                <div className="flex flex-col border-l border-white/10">
                                    {/* SECTION: ACCOUNTING RECORDS */}
                                    <div className="border-[2px] border-white overflow-hidden">
                                        <div className="flex border-b-[2px] border-white h-24">
                                            <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                                <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការរក្សាទុកបញ្ជីគណនេយ្យ ៖</span>
                                                <span className="text-white text-[22px] font-black uppercase tracking-widest leading-none">Accounting Records:</span>
                                            </div>
                                            <div className="flex-1 flex items-center px-4 gap-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 border-[1px] border-white flex items-center justify-center bg-white/5 cursor-pointer">
                                                        <input type="checkbox" className="w-6 h-6 bg-transparent border-white cursor-pointer accent-white" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold text-[20px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រើប្រាស់កម្មវិធីគណនេយ្យ (ឈ្មោះកម្មវិធី) ៖</span>
                                                        <span className="text-white text-[18px] font-black uppercase leading-none">Using Accounting Software (Software's Name):</span>
                                                    </div>
                                                    <input type="text" className="flex-1 border-b border-white/20 bg-transparent outline-none text-white text-2xl font-bold min-w-[100px] px-4" placeholder="..." />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 border-[1px] border-white flex items-center justify-center bg-white/5 cursor-pointer">
                                                        <input type="checkbox" className="w-6 h-6 bg-transparent border-white cursor-pointer accent-white" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold text-[20px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនបានប្រើប្រាស់កម្មវិធីគណនេយ្យ</span>
                                                        <span className="text-white text-[18px] font-black uppercase leading-none">Not Using Accounting Software</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION: TAX COMPLIANCE */}
                                        <div className="flex border-b-[2px] border-white h-24">
                                            <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                                <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ស្ថានភាពអនុលោមភាពសារពើពន្ធ (បើមាន)</span>
                                                <span className="text-white text-[22px] font-black uppercase tracking-widest leading-none">Status of Tax Compliance (if any):</span>
                                            </div>
                                            <div className="flex-1 flex items-center px-4 gap-12">
                                                {['មាស GOLD', 'ប្រាក់ SILVER', 'សំរឹទ្ធ BRONZE'].map((level, i) => (
                                                    <div key={i} className="flex items-center gap-4">
                                                        <div className="w-10 h-10 border-[1px] border-white flex items-center justify-center bg-white/5">
                                                            <input type="checkbox" className="w-6 h-6 bg-transparent accent-white" />
                                                        </div>
                                                        <span className="text-white font-bold text-[18px] uppercase tracking-wider">{level}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* SECTION: STATUTORY AUDIT */}
                                        <div className="flex h-24">
                                            <div className="w-[40%] border-r-[2px] border-white p-6 flex flex-col justify-center bg-white/5">
                                                <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្រូវឱ្យមានការធ្វើសវនកម្មឯករាជ្យឬទេ?</span>
                                                <span className="text-white text-[22px] font-black uppercase tracking-tight leading-none">Statutory Audit Requirement:</span>
                                            </div>
                                            <div className="flex-1 flex items-center px-4 gap-12">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 border-[1px] border-white flex items-center justify-center bg-white/5">
                                                        <input type="checkbox" className="w-6 h-6 bg-transparent accent-white" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold text-[20px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្រូវឱ្យមាន (តម្រូវឱ្យភ្ជាប់របាយការណ៍សវនកម្ម)</span>
                                                        <span className="text-white text-[18px] font-black uppercase mt-1">Required (Subject to submit audit report)</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 border-[1px] border-white flex items-center justify-center bg-white/5">
                                                        <input type="checkbox" className="w-6 h-6 bg-transparent accent-white" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold text-[20px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនតម្រូវឱ្យមាន</span>
                                                        <span className="text-white text-[18px] font-black uppercase mt-1">Not Required</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION: LEGAL FORM / BUSINESS OPERATIONS */}
                                    <div className="mt-8 border-[2px] border-white overflow-hidden">
                                        <div className="border-b-[2px] border-white h-16 flex items-center px-6 bg-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-[26px] tracking-tight leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រូបភាពគតិយុត្ត ឬ ទម្រង់នៃការធ្វើអាជីវកម្ម ឬ សកម្មភាពផ្សេងៗ ៖</span>
                                                <span className="text-white text-[22px] font-black uppercase tracking-widest mt-1">Legal Form or Form of Business Operations:</span>
                                            </div>
                                        </div>
                                        <div className="p-8 grid grid-cols-3 gap-y-10 gap-x-12">
                                            {[
                                                { kh: "សហគ្រាសឯកបុគ្គល/រូបវន្តបុគ្គល", en: "Sole Proprietorship / Physical Person" },
                                                { kh: "ក្រុមហ៊ុនសហកម្មសិទ្ធិទូទៅ", en: "General Partnership" },
                                                { kh: "ក្រុមហ៊ុនសហកម្មសិទ្ធិមានកម្រិត", en: "Limited Partnership" },
                                                { kh: "ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិតមានសមាជិកតែម្នាក់", en: "Single Member Private Limited Company" },
                                                { kh: "ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិត", en: "Private Limited Company" },
                                                { kh: "ក្រុមហ៊ុនមហាជនទទួលខុសត្រូវមានកម្រិត", en: "Public Limited Company" },
                                                { kh: "ចំណែកក្នុងសហគ្រាសចម្រុះ", en: "Interest in Joint Venture" },
                                                { kh: "សហគ្រាសសាធារណៈ", en: "Public Enterprise" },
                                                { kh: "សហគ្រាសរដ្ឋ", en: "State Enterprise" },
                                                { kh: "ក្រុមហ៊ុនរដ្ឋចម្រុះ", en: "State Joint Venture" },
                                                { kh: "សាខាក្រុមហ៊ុនបរទេស", en: "Foreign Company's Branch" },
                                                { kh: "ការិយាល័យតំណាង", en: "Representative Office" },
                                                { kh: "អង្គការសហគមន៍ក្រៅរដ្ឋាភិបាល / សមាគម", en: "Non-Government Organization / Association" },
                                            ].map((type, idx) => (
                                                <div key={idx} className="flex items-start gap-4 h-12">
                                                    <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5 shrink-0 mt-1">
                                                        <input type="checkbox" className="w-6 h-6 bg-transparent accent-white" />
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <span className="text-white font-bold text-[18px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{type.kh}</span>
                                                        <span className="text-white text-[16px] font-black uppercase mt-1">{type.en}</span>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* OTHERS OPTION */}
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5 shrink-0 mt-1">
                                                    <input type="checkbox" className="w-6 h-6 bg-transparent accent-white" />
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-white font-bold text-[18px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សហគ្រាសផ្សេងៗ</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-white text-[16px] font-black uppercase whitespace-nowrap">Others</span>
                                                        <input type="text" className="flex-1 bg-transparent border-b border-white/20 outline-none text-white text-2xl font-bold px-4 py-0.5" placeholder="..." />
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
                                                <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការលើកលែងពន្ធលើចំណូល</span>
                                                <span className="text-white text-[22px] font-black uppercase tracking-tight leading-none">Income Tax Exemption:</span>
                                            </div>
                                            <div className="flex-1 flex">
                                                <div className="w-[25%] border-r-[2px] border-white p-3 flex flex-col justify-center">
                                                    <span className="text-white font-bold text-[18px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំដែលបានចំណូលដំបូង</span>
                                                    <span className="text-white text-[16px] font-black uppercase leading-none">Year of First Revenue:</span>
                                                    <input type="text" className="mt-2 w-full bg-transparent border-none outline-none text-white text-2xl font-bold px-4" placeholder="..." />
                                                </div>
                                                <div className="w-[25%] border-r-[2px] border-white p-3 flex flex-col justify-center">
                                                    <span className="text-white font-bold text-[18px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំដែលបានចំណេញដំបូង</span>
                                                    <span className="text-white text-[16px] font-black uppercase leading-none">Year of First Profit:</span>
                                                    <input type="text" className="mt-2 w-full bg-transparent border-none outline-none text-white text-2xl font-bold px-4" placeholder="..." />
                                                </div>
                                                <div className="flex-1 p-3 flex flex-col justify-center relative">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="text-white font-bold text-[18px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>រយៈពេលអនុគ្រោះ</span>
                                                            <p className="text-white text-[16px] font-black uppercase leading-none mt-0.5">Priority Period:</p>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-white font-bold text-[18px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំ</span>
                                                            <span className="text-white text-[16px] font-black uppercase">Year</span>
                                                        </div>
                                                    </div>
                                                    <input type="text" className="mt-2 w-full bg-transparent border-none outline-none text-white text-2xl font-bold px-4" placeholder="..." />
                                                </div>
                                            </div>
                                        </div>

                                        {/* TAX RATE SELECTION */}
                                        <div className="flex border-b-[2px] border-white h-24">
                                            <div className="w-[40%] border-r-[2px] border-white p-4 flex flex-col justify-center bg-white/5">
                                                <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រាពន្ធលើចំណូល</span>
                                                <span className="text-white text-[22px] font-black uppercase tracking-tight leading-none">Income Tax Rate:</span>
                                            </div>
                                            <div className="flex-1 flex items-center px-4 justify-between">
                                                {[
                                                    { label: "30%", kh: "" },
                                                    { label: "20%", kh: "" },
                                                    { label: "5%", kh: "" },
                                                    { label: "0%", kh: "" },
                                                    { label: "0-20%", kh: "" }
                                                ].map((rate, i) => (
                                                    <div key={i} className="flex flex-col items-center gap-2">
                                                        <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5">
                                                            <input type="checkbox" className="w-6 h-6 bg-transparent accent-white" />
                                                        </div>
                                                        <span className="text-white font-bold text-[18px]">{rate.label}</span>
                                                    </div>
                                                ))}
                                                <div className="flex items-center gap-4 border-l border-white/20 pl-6">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-white font-bold text-[18px] leading-none" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អត្រាតាមថ្នាក់គិតជាភាគរយ</span>
                                                        <span className="text-white text-[16px] font-black uppercase mt-1">Progressive Rate</span>
                                                    </div>
                                                    <div className="w-10 h-10 border border-white flex items-center justify-center bg-white/5">
                                                        <input type="checkbox" className="w-6 h-6 bg-transparent accent-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* TAX DUE & BOX 18 */}
                                        <div className="flex h-24">
                                            <div className="w-[40%] border-r-[2px] border-white p-4 flex flex-col justify-center bg-white/5">
                                                <span className="text-white font-bold text-[26px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទឹកប្រាក់ពន្ធលើចំណូលត្រូវបង់</span>
                                                <span className="text-white text-[22px] font-black uppercase tracking-tight leading-none">Income Tax Due:</span>
                                            </div>
                                            <div className="w-[20%] border-r-[2px] border-white p-4 flex items-center">
                                                <input type="text" className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold" placeholder="..." />
                                            </div>
                                            <div className="w-[8%] border-r-[2px] border-white flex flex-col items-center justify-center bg-white/10">
                                                <span className="text-white text-[16px] font-black uppercase mb-1">Box</span>
                                                <span className="text-white font-bold text-2xl">18</span>
                                            </div>
                                            <div className="w-[15%] border-r-[2px] border-white p-3 flex flex-col justify-center bg-white/5">
                                                <span className="text-white font-bold text-[18px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឥណទានពន្ធរុញទៅមុខ</span>
                                                <span className="text-white text-[16px] font-black uppercase mt-0.5">Tax Credit Carried Forward:</span>
                                            </div>
                                            <div className="flex-1 p-4 flex items-center">
                                                <input type="text" className="w-full bg-transparent border-none outline-none text-white text-2xl font-bold" placeholder="..." />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-20 flex flex-col items-center opacity-10">
                                        <div className="w-[1px] bg-white h-10" />
                                        <p className="text-white font-mono text-[11px] uppercase tracking-[0.5em] mt-4">Enterprise Blueprint Complete</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activePage === 2 && (
                            <div className="animate-fade-in relative px-6 py-16 grid grid-cols-2 gap-16 items-start">
                                {/* LEFT COLUMN: CAPITAL & SHAREHOLDERS */}
                                <div className="flex flex-col">
                                    {/* CAPITAL CONTRIBUTIONS BOXED HEADER */}
                                    <div className="w-full border-[2px] border-white p-6 flex justify-between items-center bg-white/5 relative overflow-hidden group">
                                        <div className="flex flex-col gap-2 relative z-10">
                                            <h2 className="text-white font-bold text-[48px] tracking-tight leading-none" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ការចូលរួមមូលធនគិតត្រឹមការិយបរិច្ឆេទ</h2>
                                            <h1 className="text-white font-black text-[40px] uppercase tracking-tighter">Capital Contributions as at</h1>
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
                                            <span className="text-white font-bold text-[30px] tracking-tight leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ ៖</span>
                                            <span className="text-white text-[23px] font-black uppercase tracking-tight leading-none">Tax Identification Number (TIN) :</span>
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
                                                <span className="text-white font-bold text-[23px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឈ្មោះអ្នកចូលហ៊ុន</span>
                                                <span className="text-white font-bold text-[20px] leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>(ឈ្មោះរូបវន្តបុគ្គល/នីតិបុគ្គល)</span>
                                                <div className="flex flex-col text-[16px] font-black uppercase text-white leading-none">
                                                    <span>Shareholder's Name</span>
                                                    <span className="text-[13px] mt-0.5">(Name of Individual/Legal Entity)</span>
                                                </div>
                                            </div>
                                            <div className="w-[18%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                                <span className="text-white font-bold text-[23px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អាសយដ្ឋានបច្ចុប្បន្ន</span>
                                                <span className="text-white font-bold text-[20px] leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របស់អ្នកចូលហ៊ុន</span>
                                                <span className="text-white text-[16px] font-black uppercase leading-tight">Current Address<br />of Shareholder</span>
                                            </div>
                                            <div className="w-[12%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                                <span className="text-white font-bold text-[23px] leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មុខងារ</span>
                                                <span className="text-white font-bold text-[20px] leading-tight mb-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ក្នុងសហគ្រាស</span>
                                                <span className="text-white text-[16px] font-black uppercase leading-tight">Position in<br />the Enterprise</span>
                                            </div>
                                            <div className="flex-1 flex flex-col">
                                                <div className="h-[40%] border-b-[2px] border-white flex flex-col items-center justify-center py-1 bg-white/5">
                                                    <span className="text-white font-bold text-[23px] leading-none mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ភាគហ៊ុន ឬចំណែកដែលមាន</span>
                                                    <span className="text-white text-[18px] font-black uppercase tracking-widest">Shares Held</span>
                                                </div>
                                                <div className="flex-1 flex">
                                                    <div className="w-1/2 border-r-[2px] border-white flex flex-col">
                                                        <div className="h-1/2 border-b-[2px] border-white flex flex-col items-center justify-center py-2">
                                                            <span className="text-white font-bold text-[15px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ដើមការិយបរិច្ឆេទ</span>
                                                            <span className="text-white text-[12px] font-black uppercase">Beginning of the Period</span>
                                                        </div>
                                                        <div className="flex-1 flex italic text-[13px] font-bold text-white">
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
                                                            <span className="text-white font-bold text-[15px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចុងការិយបរិច្ឆេទ</span>
                                                            <span className="text-white text-[12px] font-black uppercase">End of the Period</span>
                                                        </div>
                                                        <div className="flex-1 flex italic text-[13px] font-bold text-white">
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

                                        <div className="bg-white/10 border-b-[2px] border-white px-4 py-4 font-bold text-[25px] uppercase text-white flex flex-col">
                                            <span style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ក. មូលធន/មូលធនភាគហ៊ុនចុះបញ្ជី</span>
                                            <span className="text-white text-[18px] font-black tracking-tight">A. Registered Capital / Share Capital</span>
                                        </div>
                                        {[1, 2, 3, 4, 5].map((r) => (
                                            <div key={r} className="flex border-b border-white/10 h-12 hover:bg-white/5 transition-colors group">
                                                <div className="w-[20%] border-r border-white/10 p-2 relative">
                                                    <span className="absolute left-1 top-1 text-white text-[11px] font-mono">{r <= 3 ? r : ''}{r === 3 ? '...' : ''}</span>
                                                    <input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] font-bold ml-2" />
                                                </div>
                                                <div className="w-[18%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px]" /></div>
                                                <div className="w-[12%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-center" /></div>
                                                <div className="flex-1 flex">
                                                    <div className="w-1/2 flex border-r border-white/10">
                                                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[16px] text-center" /></div>
                                                        <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-right" /></div>
                                                    </div>
                                                    <div className="flex-1 flex">
                                                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[16px] text-center" /></div>
                                                        <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-right" /></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex h-12 bg-white/10 border-b-[2px] border-white">
                                            <div className="w-[50%] border-r-[2px] border-white flex flex-col items-center justify-center">
                                                <span className="text-white font-bold text-[23px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>សរុប</span>
                                                <span className="text-white text-[16px] font-black uppercase">Total</span>
                                            </div>
                                            <div className="flex-1 flex">
                                                <div className="w-1/2 flex border-r-[2px] border-white">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[15px]">0%</div>
                                                    <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[15px]">-</div>
                                                </div>
                                                <div className="flex-1 flex">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[15px]">0%</div>
                                                    <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[15px]">-</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white/10 border-y-[2px] border-white px-4 py-4 font-bold text-[25px] uppercase text-white flex flex-col">
                                            <span style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ខ. មូលធន/មូលធនភាគហ៊ុន (បានបង់)</span>
                                            <span className="text-white text-[18px] font-black tracking-tight">B. Paid up Capital / Share Capital</span>
                                        </div>
                                        {[1, 2, 3, 4, 5].map((r) => (
                                            <div key={r} className="flex border-b border-white/10 h-12 hover:bg-white/5 transition-colors group">
                                                <div className="w-[20%] border-r border-white/10 p-2 relative">
                                                    <span className="absolute left-1 top-1 text-white text-[11px] font-mono">{r <= 3 ? r : ''}{r === 3 ? '...' : ''}</span>
                                                    <input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] font-bold ml-2" />
                                                </div>
                                                <div className="w-[18%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px]" /></div>
                                                <div className="w-[12%] border-r border-white/10 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-center" /></div>
                                                <div className="flex-1 flex">
                                                    <div className="w-1/2 flex border-r border-white/10">
                                                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[16px] text-center" /></div>
                                                        <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-right" /></div>
                                                    </div>
                                                    <div className="flex-1 flex">
                                                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center italic"><input type="text" className="w-full bg-transparent outline-none text-white text-[16px] text-center" /></div>
                                                        <div className="flex-1 p-2"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-right" /></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex h-12 bg-white/10">
                                            <div className="w-[50%] border-r-[2px] border-white flex flex-col items-center justify-center">
                                                <span className="text-white font-bold text-[23px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>សរុប</span>
                                                <span className="text-white text-[16px] font-black uppercase">Total</span>
                                            </div>
                                            <div className="flex-1 flex">
                                                <div className="w-1/2 flex border-r-[1px] border-white/30">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[15px]">0%</div>
                                                    <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[15px]">-</div>
                                                </div>
                                                <div className="flex-1 flex">
                                                    <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[15px]">0%</div>
                                                    <div className="flex-1 p-2 flex items-center justify-end font-black text-white text-[15px]">-</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: EMPLOYEE INFORMATION */}
                                <div className="flex flex-col">
                                    {/* EMPLOYEE INFO BOXED HEADER */}
                                    <div className="w-full border-[2px] border-white p-6 flex flex-col items-center bg-white/5 relative group">
                                        <h2 className="text-white font-bold text-[48px] tracking-tight leading-none mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ព័ត៌មានអំពីនិយោជិតសហគ្រាសនៅក្នុងការិយបរិច្ឆេទ</h2>
                                        <h1 className="text-white font-black text-[35px] uppercase tracking-tighter">Information About Employees During the Period</h1>
                                    </div>

                                    {/* EMPLOYEE TABLE */}
                                    <div className="w-full mt-10 border-[2px] border-white overflow-hidden bg-white/5 backdrop-blur-sm shadow-2xl">
                                        <div className="flex border-b-[2px] border-white h-[120px] bg-white/10">
                                            <div className="w-[30%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                                <span className="text-white font-bold text-[23px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>បរិយាយ</span>
                                                <span className="text-white text-[18px] font-black uppercase tracking-tight">Description</span>
                                            </div>
                                            <div className="w-[18%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                                <span className="text-white font-bold text-[23px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>តួនាទី</span>
                                                <span className="text-white text-[18px] font-black uppercase tracking-tight">Position</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center">
                                                <span className="text-white font-bold text-[23px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ចំនួន</span>
                                                <span className="text-white text-[18px] font-black uppercase tracking-tight">Number</span>
                                            </div>
                                            <div className="w-[22%] border-r-[2px] border-white p-3 flex flex-col items-center justify-center text-center bg-white/5">
                                                <span className="text-white font-bold text-[19px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>ប្រាក់បៀវត្សក្រៅពីអត្ថប្រយោជន៍បន្ថែម</span>
                                                <span className="text-white text-[14px] font-black uppercase leading-tight">Salary Excluding<br />Fringe Benefits</span>
                                            </div>
                                            <div className="flex-1 p-3 flex flex-col items-center justify-center text-center">
                                                <span className="text-white font-bold text-[19px] leading-tight mb-1" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>អត្ថប្រយោជន៍បន្ថែម</span>
                                                <span className="text-white text-[14px] font-black uppercase leading-tight">Fringe Benefits</span>
                                            </div>
                                        </div>

                                        {/* SECTION 1: SHAREHOLDING MANAGERS */}
                                        <div className="flex border-b border-white/10 h-16 hover:bg-white/5 transition-colors">
                                            <div className="w-[30%] border-r border-white/10 px-4 flex flex-col justify-center">
                                                <span className="text-white font-bold text-[23px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>១- អ្នកគ្រប់គ្រងជាម្ចាស់ភាគហ៊ុន</span>
                                                <span className="text-white text-[16px] font-black uppercase">1- Shareholding Managers</span>
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
                                                <div className="w-[30%] border-r border-white/10 px-4 flex items-center italic text-[9px] text-white">-</div>
                                                <div className="w-[18%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-center" /></div>
                                                <div className="w-[10%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-center" placeholder="-" /></div>
                                                <div className="w-[22%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-right" placeholder="-" /></div>
                                                <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-right" placeholder="-" /></div>
                                            </div>
                                        ))}

                                        {/* SECTION 2: NON-SHAREHOLDING MANAGERS */}
                                        <div className="flex border-b border-white/10 h-16 hover:bg-white/5 transition-colors">
                                            <div className="w-[30%] border-r border-white/10 px-4 flex flex-col justify-center">
                                                <span className="text-white font-bold text-[23px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>២- អ្នកគ្រប់គ្រងមិនមែនជាម្ចាស់ភាគហ៊ុន</span>
                                                <span className="text-white text-[16px] font-black uppercase">2- Non-Shareholding Managers</span>
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
                                                <div className="w-[30%] border-r border-white/10 px-4 flex items-center italic text-[9px] text-white">-</div>
                                                <div className="w-[18%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-center" /></div>
                                                <div className="w-[10%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-center" placeholder="-" /></div>
                                                <div className="w-[22%] border-r border-white/10 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-right" placeholder="-" /></div>
                                                <div className="flex-1 p-1"><input type="text" className="w-full h-full bg-transparent outline-none text-white text-[16px] text-right" placeholder="-" /></div>
                                            </div>
                                        ))}

                                        {/* SUMMARY ROWS */}
                                        <div className="flex border-b-[2px] border-white h-14 bg-white/10">
                                            <div className="w-[48%] border-r-[1px] border-white/30 px-4 flex flex-col justify-center bg-rose-500/5">
                                                <span className="text-white font-bold text-[20px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>៣- សរុបបុគ្គលិក-កម្មករ</span>
                                                <span className="text-white text-[15px] font-black uppercase">3- Total Employees and Workers</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-rose-400">0</div>
                                            <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white">-</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-white">-</div>
                                        </div>
                                        <div className="flex h-14 bg-white/10">
                                            <div className="w-[48%] border-r-[1px] border-white/30 px-4 flex flex-col justify-center bg-emerald-500/5">
                                                <span className="text-white font-bold text-[20px]" style={{ fontFamily: "Kantumruy Pro, sans-serif" }}>៤- បុគ្គលិក-កម្មករជាប់ពន្ធលើប្រាក់បៀវត្ស</span>
                                                <span className="text-white text-[15px] font-black uppercase">4- Taxable Salary for Employees and Workers</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-emerald-400">0</div>
                                            <div className="w-[22%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white">-</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-white">-</div>
                                        </div>
                                    </div>

                                    {/* BOTTOM DECORATION */}
                                    <div className="mt-20 flex flex-col items-center opacity-10">
                                        <div className="w-[1px] bg-white h-20" />
                                        <p className="text-white font-mono text-[9px] uppercase tracking-[1em] mt-8">Employee Census Schedule Locked</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activePage === 3 && (
                            <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                                {/* PAGE HEADER */}
                                <div className="w-full max-w-5xl bg-white/5 backdrop-blur-md border-[2px] border-white p-10 shadow-2xl">
                                    <div className="flex justify-between items-center border-b-[2px] border-white pb-6 mb-6">
                                        <div className="flex flex-col">
                                            <h2 className="text-white font-bold text-[28px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តារាងតុល្យការគិតត្រឹមការិយបរិច្ឆេទ</h2>
                                            <h1 className="text-white font-black text-[24px] uppercase tracking-tighter">BALANCE SHEET AS AT</h1>
                                        </div>
                                        <div className="flex gap-2">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div key={i} className="w-10 h-12 border-[1px] border-white flex items-center justify-center bg-white/10">
                                                    <input type="text" maxLength="1" className="w-full h-full text-center text-xl font-black outline-none bg-transparent text-white" placeholder="0" />
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
                                                    <span className="text-white font-black">{char === '-' ? '-' : ''}</span>
                                                    {char !== '-' && <input type="text" maxLength="1" className="w-full h-full text-center text-lg font-black outline-none bg-transparent text-white" defaultValue={char} />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* MAIN TABLE */}
                                    <div className="w-full border-[2px] border-white overflow-hidden">
                                        {/* HEADER */}
                                        <div className="flex bg-white/10 border-b-[2px] border-white h-16">
                                            <div className="w-[50%] border-r-[2px] border-white p-3 flex flex-col justify-center items-center text-center">
                                                <span className="text-white font-bold text-[18px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ</span>
                                                <span className="text-white text-[12px] font-black uppercase">Description</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white p-3 flex flex-col justify-center items-center text-center">
                                                <span className="text-white font-bold text-[18px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខ</span>
                                                <span className="text-white text-[12px] font-black uppercase">Ref.</span>
                                            </div>
                                            <div className="w-[20%] border-r-[2px] border-white p-3 flex flex-col justify-center items-center text-center">
                                                <span className="text-white font-bold text-[16px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទ (N)</span>
                                                <span className="text-white text-[11px] font-black uppercase">Current year (N)</span>
                                            </div>
                                            <div className="flex-1 p-3 flex flex-col justify-center items-center text-center">
                                                <span className="text-white font-bold text-[16px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទ (N-1)</span>
                                                <span className="text-white text-[11px] font-black uppercase">Last year (N-1)</span>
                                            </div>
                                        </div>

                                        {/* ASSETS TOTAL ROW */}
                                        <div className="flex border-b-[2px] border-white h-14 bg-white/5 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4 flex flex-col text-white">
                                                <span className="font-bold text-[20px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>I- ទ្រព្យសម្បត្តិ (A0 = A1 + A13)</span>
                                                <span className="text-[13px] font-black uppercase tracking-wide">Assets (A0 = A1 + A13)</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-white text-[18px]">A 0</div>
                                            <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-4 font-black text-white">-</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-white">-</div>
                                        </div>

                                        {/* NON-CURRENT ASSETS HEADER */}
                                        <div className="flex border-b-[1px] border-white/30 h-14 bg-white/5 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-8 flex flex-col text-white italic">
                                                <span className="font-bold text-[17px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យសម្បត្តិមិនចរន្ត / ទ្រព្យសកម្មថេរ [A1 = សរុប(A2:A12)]</span>
                                                <span className="text-[12px] font-bold">Non-Current Assets / Fixed Assets [A1 = Sum(A2:A12)]</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-white/50 text-[14px]">A 1</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white">-</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-white">-</div>
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
                                                <div className="w-[50%] border-r-[2px] border-white px-10 flex flex-col text-white">
                                                    <span className="font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[12px] font-bold opacity-80">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-white/40 text-[13px]">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 p-1 flex items-center">
                                                    <input type="text" value={formData[row.key + '_n'] || ''} onChange={e => handleFormChange(row.key + '_n', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[15px]" placeholder="-" />
                                                </div>
                                                <div className="flex-1 p-1 flex items-center">
                                                    <input type="text" value={formData[row.key + '_n1'] || ''} onChange={e => handleFormChange(row.key + '_n1', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[15px]" placeholder="-" />
                                                </div>
                                            </div>
                                        ))}

                                        {/* CURRENT ASSETS HEADER */}
                                        <div className="flex border-y-[2px] border-white h-14 bg-white/10 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-8 flex flex-col text-white italic">
                                                <span className="font-bold text-[17px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ទ្រព្យសម្បត្តិចរន្ត [A13 = សរុប(A14:A27)]</span>
                                                <span className="text-[12px] font-bold">Current Assets [A13 = Sum(A14:A27)]</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-white text-[15px]">A 13</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-white">-</div>
                                            <div className="flex-1 flex items-center justify-end px-4 font-black text-white">-</div>
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
                                            <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[50%] border-r-[2px] border-white px-10 flex flex-col text-white">
                                                    <span className="font-bold text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[12px] font-bold opacity-80">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-white/40 text-[13px]">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 p-1 flex items-center">
                                                    <input type="text" value={formData[row.key] || ''} onChange={e => handleFormChange(row.key, e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[15px]" placeholder="-" />
                                                </div>
                                                <div className="flex-1 p-1 flex items-center">
                                                    <input type="text" value={formData[row.key + '_prev'] || ''} onChange={e => handleFormChange(row.key + '_prev', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[15px]" placeholder="-" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}



                        {activePage === 4 && (
                            <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                                {/* PAGE HEADER */}
                                <div className="w-full max-w-7xl bg-white/5 backdrop-blur-md border-[2px] border-white p-8 shadow-2xl mb-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-4 text-white">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent"></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ :</span>
                                                        <span className="text-[9px] font-black uppercase tracking-tighter">Tax Identification Number (TIN) :</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {['', '', '', '', '', '-', '', '', '', '', '', '', ''].map((char, i) => (
                                                        <div key={i} className={`w-7 h-9 border-[1px] border-white flex items-center justify-center bg-white/5 ${char === '-' ? 'border-0 w-3' : ''}`}>
                                                            {char === '-' ? <span className="font-black text-white">-</span> : <input type="text" maxLength="1" className="w-full h-full text-center text-base font-black outline-none bg-transparent text-white" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 text-white">
                                            <div className="flex items-center gap-2">
                                                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ឆ្នាំជាប់ពន្ធ</span>
                                                    <span className="text-[9px] font-black uppercase tracking-tighter">Tax Year</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                                        <div key={i} className="w-8 h-10 border-[1px] border-white flex items-center justify-center bg-white/10">
                                                            <input type="text" maxLength="1" className="w-full h-full text-center text-lg font-black outline-none bg-transparent text-white" value={char} readOnly />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full max-w-7xl grid grid-cols-2 gap-6 items-start">
                                    {/* LEFT COLUMN: EQUITY */}
                                    <div className="border-[2px] border-white overflow-hidden text-white bg-white/5 backdrop-blur-sm">
                                        <div className="flex bg-white/10 border-b-[2px] border-white h-14 items-center">
                                            <div className="w-[50%] border-r-[2px] border-white px-4 flex flex-col">
                                                <span className="font-bold text-[16px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មូលនិធិ/ឧបត្ថម្ភទ្រព្យ</span>
                                                <span className="text-[11px] font-black uppercase">Equity (A29)</span>
                                            </div>
                                            <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[14px]">REF</div>
                                            <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[11px] font-bold">YEAR N</div>
                                            <div className="flex-1 flex items-center justify-center text-[11px] font-bold">YEAR N-1</div>
                                        </div>

                                        <div className="bg-white/5 border-b-[1px] border-white/30 h-10 flex items-center px-4 italic">
                                            <span className="text-[12px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>A29 = សរុប(A30:A36)</span>
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
                                                <div className="w-[50%] border-r-[2px] border-white px-4 flex flex-col text-white">
                                                    <span className="font-bold text-[13px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[10px] font-bold opacity-70">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black opacity-40 text-[11px]">{row.ref}</div>
                                                <div className="w-[20%] border-r border-white/10 p-1 flex items-center">
                                                    <input type="text" value={formData[row.key + '_n'] || ''} onChange={e => handleFormChange(row.key + '_n', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[13px]" placeholder="-" />
                                                </div>
                                                <div className="flex-1 p-1 flex items-center">
                                                    <input type="text" value={formData[row.key + '_n1'] || ''} onChange={e => handleFormChange(row.key + '_n1', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[13px]" placeholder="-" />
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex border-t-[2px] border-white h-12 bg-white/10 items-center font-black text-white">
                                            <div className="w-[60%] border-r-[2px] border-white px-4 text-[13px]">TOTAL EQUITY (A29)</div>
                                            <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-3">{formData.a29_n || '-'}</div>
                                            <div className="flex-1 flex items-center justify-end px-3">{formData.a29_n1 || '-'}</div>
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN: LIABILITIES */}
                                    <div className="flex flex-col gap-6">
                                        {/* NON-CURRENT LIABILITIES */}
                                        <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                            <div className="flex bg-white/10 border-b-[2px] border-white h-12 items-center">
                                                <div className="w-[50%] border-r-[2px] border-white px-4">
                                                    <span className="font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បំណុលរយៈពេលវែង</span>
                                                    <span className="text-[10px] block font-black uppercase">Non-Current (A37)</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[11px]">REF</div>
                                                <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[10px] font-bold">N</div>
                                                <div className="flex-1 flex items-center justify-center text-[10px] font-bold">N-1</div>
                                            </div>
                                            {[
                                                { ref: "A 38", kh: "បំណុលភាគីពាក់ព័ន្ធ", en: "Related parties", key: "a38" },
                                                { ref: "A 39", kh: "បំណុលធនាគារ/ក្រៅ", en: "Banks/External", key: "a39" },
                                                { ref: "A 40", kh: "សំវិធានធន", en: "Provisions", key: "a40" },
                                                { ref: "A 41", kh: "បំណុលវែងផ្សេងៗ", en: "Other LTS", key: "a41" }
                                            ].map((row, idx) => (
                                                <div key={idx} className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                    <div className="w-[50%] border-r-[2px] border-white px-4 flex flex-col">
                                                        <span className="font-bold text-[12px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="text-[9px] opacity-70">{row.en}</span>
                                                    </div>
                                                    <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[10px]">{row.ref}</div>
                                                    <div className="w-[20%] border-r border-white/10 p-1 flex items-center">
                                                        <input type="text" value={formData[row.key + '_n'] || ''} onChange={e => handleFormChange(row.key + '_n', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[12px]" placeholder="-" />
                                                    </div>
                                                    <div className="flex-1 p-1 flex items-center">
                                                        <input type="text" value={formData[row.key + '_n1'] || ''} onChange={e => handleFormChange(row.key + '_n1', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[12px]" placeholder="-" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* CURRENT LIABILITIES */}
                                        <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                            <div className="flex bg-white/10 border-b-[2px] border-white h-12 items-center">
                                                <div className="w-[50%] border-r-[2px] border-white px-4">
                                                    <span className="font-bold text-[14px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បំណុលរយៈពេលខ្លី</span>
                                                    <span className="text-[10px] block font-black uppercase">Current (A42)</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[11px]">REF</div>
                                                <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[10px] font-bold">N</div>
                                                <div className="flex-1 flex items-center justify-center text-[10px] font-bold">N-1</div>
                                            </div>
                                            {[
                                                { ref: "A 43", kh: "ឥណទានវិបារូប៍", en: "Bank overdraft", key: "a43" },
                                                { ref: "A 44", kh: "បំណុលមានការប្រាក់", en: "Interest bearing", key: "a44" },
                                                { ref: "A 45", kh: "សងភាគីពាក់ព័ន្ធ", en: "To related parties", key: "a45" },
                                                { ref: "A 46", kh: "គណនីត្រូវសងផ្សេងៗ", en: "Other accounts payable", key: "a46" },
                                                { ref: "A 48", kh: "បង្គរ/ខ្លីផ្សេងៗ", en: "Accruals/Other", key: "a48" },
                                                { ref: "A 50", kh: "ពន្ធ/អាករត្រូវបង់", en: "Taxes payable", key: "a50" },
                                                { ref: "A 52", kh: "ខាតបរិវត្តរូបិយប័ណ្ណ", en: "Currency loss", key: "a52" }
                                            ].map((row, idx) => (
                                                <div key={idx} className="flex border-b border-white/10 h-10 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                    <div className="w-[50%] border-r-[2px] border-white px-4 flex flex-col">
                                                        <span className="font-bold text-[12px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="text-[9px] opacity-70">{row.en}</span>
                                                    </div>
                                                    <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[10px]">{row.ref}</div>
                                                    <div className="w-[20%] border-r border-white/10 p-1 flex items-center">
                                                        <input type="text" value={formData[row.key + '_n'] || ''} onChange={e => handleFormChange(row.key + '_n', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[12px]" placeholder="-" />
                                                    </div>
                                                    <div className="flex-1 p-1 flex items-center">
                                                        <input type="text" value={formData[row.key + '_n1'] || ''} onChange={e => handleFormChange(row.key + '_n1', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[12px]" placeholder="-" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* GRAND TOTAL ROW */}
                                        <div className="border-[2px] border-white h-16 bg-white/20 flex items-center font-black text-white shadow-xl">
                                            <div className="w-[60%] border-r-[2px] border-white px-6">
                                                <span className="text-[16px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>សរុបបំណុល និងមូលធន (A28)</span>
                                                <span className="text-[12px] block opacity-80 uppercase">Total Equity & Liabilities</span>
                                            </div>
                                            <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-4 text-[18px]">{formData.a28_n || '-'}</div>
                                            <div className="flex-1 flex items-center justify-end px-4 text-[18px]">{formData.a28_n1 || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activePage === 5 && (
                            <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                                {/* PAGE HEADER */}
                                <div className="w-full max-w-7xl bg-white/5 backdrop-blur-md border-[2px] border-white p-8 shadow-2xl mb-10">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-[34px] font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>របាយការណ៍លទ្ធផលសម្រាប់គ្រាជាប់ពន្ធ</h2>
                                            <h1 className="text-[28px] font-black text-white uppercase tracking-tighter">INCOME STATEMENT FOR THE YEAR ENDED</h1>
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
                                                    <span className="text-[13px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ :</span>
                                                    <span className="text-[9px] font-black uppercase tracking-tighter">Tax Identification Number (TIN) :</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    {['L', '0', '0', '1', '-', '1', '2', '3', '4', '5', '6', '7', '8'].map((char, i) => (
                                                        <div key={i} className={`w-6 h-8 border-[1px] border-white flex items-center justify-center bg-white/5 ${char === '-' ? 'border-0 w-3' : ''}`}>
                                                            {char === '-' ? <span className="font-black text-white">-</span> : <span className="text-[14px] font-black">{char}</span>}
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
                                                    <span className="font-bold text-[20px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>III- ចំណូលប្រតិបត្តិការ [B0 = សរុប(B1:B3)]</span>
                                                    <span className="text-[12px] block font-black uppercase">Operating Revenues [B0 = Sum(B1:B3)]</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[14px]">B 0</div>
                                                <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[12px] font-bold">YEAR N</div>
                                                <div className="flex-1 flex items-center justify-center text-[12px] font-bold">YEAR N-1</div>
                                            </div>
                                            {[
                                                { ref: "B 1", kh: "ការលក់ផលិតផល", en: "Sales of products", key: "b1" },
                                                { ref: "B 2", kh: "ការលក់ទំនិញ", en: "Sales of goods", key: "b2" },
                                                { ref: "B 3", kh: "ការផ្គត់ផ្គង់សេវា", en: "Supplies of services", key: "b3" }
                                            ].map((row, idx) => (
                                                <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                    <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                        <span className="font-bold text-[16px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="text-[11px] font-bold opacity-70">{row.en}</span>
                                                    </div>
                                                    <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[12px] font-black">{row.ref}</div>
                                                    <div className="w-[20%] border-r border-white/10 p-1 flex items-center">
                                                        <input type="text" value={formData[row.key + '_n'] || ''} onChange={e => handleFormChange(row.key + '_n', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-black text-[16px]" placeholder="0.00" />
                                                    </div>
                                                    <div className="flex-1 p-1 flex items-center">
                                                        <input type="text" value={formData[row.key + '_n1'] || ''} onChange={e => handleFormChange(row.key + '_n1', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-black text-[16px]" placeholder="0.00" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* SECTION IV: COGS & GROSS PROFIT */}
                                        <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                            <div className="flex bg-white/15 border-b-[2px] border-white h-16 items-center">
                                                <div className="w-[50%] border-r-[2px] border-white px-4">
                                                    <span className="font-bold text-[20px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>IV- ថ្លៃដើមផលិតផល និង Gross Profit</span>
                                                    <span className="text-[12px] block font-black uppercase">COGS & Gross Profit (B7)</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[14px]">REF</div>
                                                <div className="w-[20%] border-r-[2px] border-white flex items-center justify-center text-[12px] font-bold">YEAR N</div>
                                                <div className="flex-1 flex items-center justify-center text-[12px] font-bold">YEAR N-1</div>
                                            </div>
                                            {[
                                                { ref: "B 4", kh: "ថ្លៃដើមលក់ផលិតផល (សហគ្រាសផលិត)", en: "COPS (Production enterprises)", key: "b4" },
                                                { ref: "B 5", kh: "ថ្លៃដើមលក់ទំនិញ (សហគ្រាសមិនមែនផលិត)", en: "COGS (Non-production enterprises)", key: "b5" },
                                                { ref: "B 6", kh: "ថ្លៃដើមសេវាផ្គត់ផ្គង់", en: "Cost of services supplied", key: "b6" }
                                            ].map((row, idx) => (
                                                <div key={idx} className="flex border-b border-white/10 h-14 items-center hover:bg-white/5 transition-colors">
                                                    <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                        <span className="font-bold text-[16px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="text-[11px] font-bold opacity-70">{row.en}</span>
                                                    </div>
                                                    <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[12px] font-black">{row.ref}</div>
                                                    <div className="w-[20%] border-r border-white/10 p-1 flex items-center">
                                                        <input type="text" value={formData[row.key + '_n'] || ''} onChange={e => handleFormChange(row.key + '_n', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-black text-[16px]" placeholder="0.00" />
                                                    </div>
                                                    <div className="flex-1 p-1 flex items-center">
                                                        <input type="text" value={formData[row.key + '_n1'] || ''} onChange={e => handleFormChange(row.key + '_n1', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-black text-[16px]" placeholder="0.00" />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex bg-rose-500/20 border-t-[2px] border-white h-16 items-center">
                                                <div className="w-[50%] border-r-[2px] border-white px-6">
                                                    <span className="font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លទ្ធផលដុល (B7 = B0 - B4 - B5 - B6)</span>
                                                    <span className="text-[11px] block font-black uppercase">Gross Profit</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[16px]">B 7</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[18px]">$ 0.00</div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[18px]">$ 0.00</div>
                                            </div>
                                        </div>

                                        {/* SUBSIDIARY REVENUES (B8:B11) */}
                                        <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                            <div className="flex bg-white/15 border-b-[2px] border-white h-14 items-center">
                                                <div className="w-[50%] border-r-[2px] border-white px-4">
                                                    <span className="font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលបន្ទាប់បន្សំ [B8 = សរុប(B9:B11)]</span>
                                                    <span className="text-[11px] block font-black uppercase">Subsidiary Revenues</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[14px]">B 8</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">$ 0.00</div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black">$ 0.00</div>
                                            </div>
                                            {[
                                                { ref: "B 9", kh: "ចំណូលពីការដូរភតិសន្យា ទទួល ឬត្រូវទទួល", en: "Rental fees received or receivable", key: "b9" },
                                                { ref: "B 10", kh: "ចំណូលពីសិទ្ធិប្រើប្រាស់ ទទួល ឬត្រូវទទួល", en: "Royalties received or receivable", key: "b10" },
                                                { ref: "B 11", kh: "ចំណូលបន្ទាប់បន្សំផ្សេងទៀត", en: "Other subsidiary revenues", key: "b11" }
                                            ].map((row, idx) => (
                                                <div key={idx} className="flex border-b border-white/10 h-14 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                    <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                        <span className="font-bold text-[15px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="text-[10px] font-bold opacity-70">{row.en}</span>
                                                    </div>
                                                    <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[11px] font-black">{row.ref}</div>
                                                    <div className="w-[20%] border-r border-white/10 p-1">
                                                        <input type="text" value={formData[row.key + '_n'] || ''} onChange={e => handleFormChange(row.key + '_n', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[15px]" placeholder="-" />
                                                    </div>
                                                    <div className="flex-1 p-1">
                                                        <input type="text" value={formData[row.key + '_n1'] || ''} onChange={e => handleFormChange(row.key + '_n1', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[15px]" placeholder="-" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* OTHER REVENUES (B12:B21) */}
                                        <div className="border-[2px] border-white overflow-hidden text-white bg-white/5">
                                            <div className="flex bg-white/15 border-b-[2px] border-white h-14 items-center">
                                                <div className="w-[50%] border-r-[2px] border-white px-4">
                                                    <span className="font-bold text-[18px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលផ្សេងៗ [B12 = សរុប(B13:B21)]</span>
                                                    <span className="text-[11px] block font-black uppercase">Other Revenues</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[14px]">B 12</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black">$ 0.00</div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black">$ 0.00</div>
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
                                                        <span className="font-bold text-[14px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                        <span className="text-[10px] font-bold opacity-70">{row.en}</span>
                                                    </div>
                                                    <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[10px] font-black">{row.ref}</div>
                                                    <div className="w-[20%] border-r border-white/10 p-1">
                                                        <input type="text" value={formData[row.key + '_n'] || ''} onChange={e => handleFormChange(row.key + '_n', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[14px]" placeholder="-" />
                                                    </div>
                                                    <div className="flex-1 p-1">
                                                        <input type="text" value={formData[row.key + '_n1'] || ''} onChange={e => handleFormChange(row.key + '_n1', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[14px]" placeholder="-" />
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
                                                    <span className="font-bold text-[20px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>V- ចំណាយប្រតិបត្តិការសរុប [B22 = សរុប(B23:B41)]</span>
                                                    <span className="text-[12px] block font-black uppercase">Total Operating Expenses</span>
                                                </div>
                                                <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center font-black text-[14px]">B 22</div>
                                                <div className="w-[20%] border-r border-white/10 flex items-center justify-end px-4 font-black text-[18px]">$ 0.00</div>
                                                <div className="flex-1 flex items-center justify-end px-4 font-black text-[18px]">$ 0.00</div>
                                            </div>
                                            <div className="grid grid-cols-1">
                                                {[
                                                    { ref: "B 23", kh: "ចំណាយប្រាក់បៀវត្ស", en: "Salary expenses", key: "b23" },
                                                    { ref: "B 24", kh: "ចំណាយប្រេង ហ្គាស អគ្គិសនី និងទឹក", en: "Fuel, gas, electricity and water expenses", key: "b24" },
                                                    { ref: "B 25", kh: "ចំណាយជួល", en: "Rent expenses", key: "b25" },
                                                    { ref: "B 26", kh: "ចំណាយជួសជុល និងថែទាំ", en: "Repairs and maintenance expenses", key: "b26" },
                                                    { ref: "B 27", kh: "ចំណាយធ្វើដំណើរ និងដឹកជញ្ជូន", en: "Travel and transportation expenses", key: "b27" },
                                                    { ref: "B 28", kh: "ចំណាយប្រៃសណីយ៍ និងទូរគមនាគមន៍", en: "Post and telecommunication expenses", key: "b28" },
                                                    { ref: "B 29", kh: "ចំណាយសម្ភារៈការិយាល័យ", en: "Office supplies expenses", key: "b29" },
                                                    { ref: "B 30", kh: "ចំណាយឃោសនា និងផ្សព្វផ្សាយ", en: "Marketing and advertising expenses", key: "b30" },
                                                    { ref: "B 31", kh: "កម្រៃសេវាវិជ្ជាជីវៈ", en: "Professional fees", key: "b31" },
                                                    { ref: "B 32", kh: "បុព្វលាភធានារ៉ាប់រង", en: "Insurance premiums", key: "b32" },
                                                    { ref: "B 33", kh: "ពន្ធ-អាករ និងកម្រៃផ្សេងៗ", en: "Taxes, duties and other fees", key: "b33" },
                                                    { ref: "B 34", kh: "ចំណាយការប្រាក់", en: "Interest expenses", key: "b34" },
                                                    { ref: "B 35", kh: "រំលស់ទ្រព្យសកម្មរូបវន្ត", en: "Depreciation of tangible assets", key: "b35" },
                                                    { ref: "B 36", kh: "រំលស់ទ្រព្យសកម្មអរូបវន្ត", en: "Amortization of intangible assets", key: "b36" },
                                                    { ref: "B 37", kh: "ចំណាយសំវិធានធន", en: "Provision expenses", key: "b37" },
                                                    { ref: "B 38", kh: "វិភាគទានសប្បុរសធម៌", en: "Charitable contributions", key: "b38" },
                                                    { ref: "B 39", kh: "ចំណាយកម្សាន្ត ការទទួលភ្ញៀវ", en: "Entertainment and hospitality expenses", key: "b39" },
                                                    { ref: "B 40", kh: "បំណុលអាក្រក់", en: "Bad debts", key: "b40" },
                                                    { ref: "B 41", kh: "ចំណាយប្រតិបត្តិការផ្សេងទៀត", en: "Other operating expenses", key: "b41" }
                                                ].map((row, idx) => (
                                                    <div key={idx} className="flex border-b border-white/10 h-12 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                        <div className="w-[50%] border-r-[2px] border-white px-6 flex flex-col">
                                                            <span className="font-bold text-[14px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                            <span className="text-[10px] font-bold opacity-70">{row.en}</span>
                                                        </div>
                                                        <div className="w-[10%] border-r-[2px] border-white flex items-center justify-center opacity-40 text-[10px] font-black">{row.ref}</div>
                                                        <div className="w-[20%] border-r border-white/10 p-1">
                                                            <input type="text" value={formData[row.key + '_n'] || ''} onChange={e => handleFormChange(row.key + '_n', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[14px]" placeholder="-" />
                                                        </div>
                                                        <div className="flex-1 p-1">
                                                            <input type="text" value={formData[row.key + '_n1'] || ''} onChange={e => handleFormChange(row.key + '_n1', e.target.value)} className="w-full bg-transparent outline-none text-white text-right font-bold text-[14px]" placeholder="-" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* SECTION VI: NET RESULT */}
                                        <div className="border-[2px] border-white h-24 bg-emerald-500/20 flex items-center font-black text-white shadow-2xl">
                                            <div className="w-[60%] border-r-[2px] border-white px-8">
                                                <span className="text-[24px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>VI- លទ្ធផលជារួម (ចំណេញ/ខាត) : B42</span>
                                                <span className="text-[16px] block opacity-80 uppercase">Overall Result (Net Profit / Loss)</span>
                                            </div>
                                            <div className="w-[20%] border-r-[2px] border-white flex items-center justify-end px-6 text-[24px] text-emerald-400">$ 0.00</div>
                                            <div className="flex-1 flex items-center justify-end px-6 text-[24px] text-emerald-400">$ 0.00</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activePage > 5 && (
                            <div className="flex flex-col items-center justify-center py-40">
                                <h3 className="text-white font-black uppercase tracking-widest">Page {activePage}</h3>
                                <p className="text-white text-xs mt-2 italic text-center">Canvas is currently empty for this page.<br />Ready for development.</p>
                            </div>
                        )}


                    </div>
                </div >
            </div >

            {/* Status Bar */}
            < div className="bg-[#1e293b] border-t border-white/10 px-6 py-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-white" >
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-sm bg-blue-500" /> Layout: IFRS/GDT Standard</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-sm bg-indigo-500" /> Engine: GGMT Logic Link</span>
                </div>
                <div className="text-white italic font-mono lowercase tracking-normal">workbench_v_2.8.5_page2_port</div>
            </div >
        </div >
    );
};

export default TaxFormWorkbench;
