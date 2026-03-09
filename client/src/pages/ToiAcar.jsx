import React, { useState } from 'react';
import { ArrowLeft, Brain, Sparkles, Loader2, ShieldCheck, Activity } from 'lucide-react';
import LiveTaxWorkspace from './LiveTaxWorkspace';

const ToiAcar = ({ onBack, packageId, year }) => {
    const [activeWorkspacePage, setActiveWorkspacePage] = useState(1);
    return (
        <div className="w-full min-h-screen bg-black text-white flex flex-col font-sans relative overflow-hidden">

            {/* HEADER */}
            <div className="bg-black/95 border-b border-white/5 px-8 py-4 flex items-center sticky top-0 z-50 overflow-hidden">
                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={onBack}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-base font-black uppercase tracking-widest text-white flex items-center gap-2">
                            TOI & ACAR <span className="text-rose-500">Workspace</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide">GPT Generation Canvas</p>
                    </div>
                </div>

                <div className="h-8 w-px bg-white/10 mx-6 shrink-0" />

                {/* 27 small round buttons */}
                <div className="flex flex-1 items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1 pr-4">
                    {Array.from({ length: 27 }).map((_, i) => {
                        const palettes = [
                            'hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-400',
                            'hover:border-blue-500 hover:bg-blue-500/10 text-blue-400',
                            'hover:border-violet-500 hover:bg-violet-500/10 text-violet-400',
                            'hover:border-rose-500 hover:bg-rose-500/10 text-rose-400',
                            'hover:border-amber-500 hover:bg-amber-500/10 text-amber-400',
                            'hover:border-cyan-500 hover:bg-cyan-500/10 text-cyan-400',
                        ];
                        const colorClass = palettes[i % palettes.length];

                        return (
                            <button
                                key={i}
                                onClick={() => setActiveWorkspacePage(i + 1)}
                                className={`w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 font-bold text-[10px] shadow-sm hover:scale-110 ${activeWorkspacePage === i + 1 ? 'bg-white text-black border-white ring-2 ring-indigo-500/50 scale-110' : 'bg-slate-900 border border-slate-800 ' + colorClass}`}
                            >
                                {i + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* MAIN CONTENT SPLIT AREA */}
            <div className="flex-1 flex overflow-hidden">

                {/* NEW LEFT SIDE: WHITE PREVIEW (ONLY PAGE 1) */}
                {activeWorkspacePage === 1 && (
                    <div className="w-[644px] shrink-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black">
                        {/* Content for the white preview */}
                        <div className="w-full flex flex-col font-sans mb-12">
                            <div className="flex justify-between items-start pb-4 border-b-[3px] border-black">
                                <div className="flex flex-col w-full items-center">
                                    <h1 className="text-[20px] font-bold uppercase tracking-widest text-center" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                        លិខិតប្រកាសពន្ធលើចំណូលប្រចាំឆ្នាំ
                                    </h1>
                                    <h2 className="text-[12px] font-black uppercase text-center mt-2 flex items-center justify-center gap-3">
                                        ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED
                                        <div className="inline-flex shadow-sm gap-[2px]">
                                            {[2, 0, 2, 6].map((num, i) => (
                                                <div key={i} className="w-8 h-10 border-[1.5px] border-black flex items-center justify-center font-bold text-xl">{num}</div>
                                            ))}
                                        </div>
                                    </h2>
                                </div>
                            </div>

                            {/* TIN Box */}
                            <div className="flex w-full mt-2">
                                <div className="w-10 border-b border-l border-r border-black flex items-center justify-center font-bold text-sm bg-slate-100">1</div>
                                <div className="w-[35%] border-b border-r border-black p-3 flex flex-col justify-center bg-slate-50">
                                    <span className="text-[12px] font-bold" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :</span>
                                    <span className="text-[9px] font-bold uppercase text-slate-600">Tax Identification Number (TIN)</span>
                                </div>
                                <div className="flex-1 flex gap-1 items-center px-4 border-b border-r border-black">
                                    <div className="w-7 h-9 border border-black" />
                                    <div className="w-7 h-9 border border-black" />
                                    <div className="w-7 h-9 border border-black" />
                                    <div className="w-7 h-9 border border-black" />
                                    <span className="mx-1 font-black text-xl">-</span>
                                    {Array.from({ length: 9 }).map((_, i) => (
                                        <div key={i} className="w-7 h-9 border border-black" />
                                    ))}
                                </div>
                            </div>

                            {/* Periods Box */}
                            <div className="flex w-full items-stretch justify-between mb-4 border-l border-r border-black">
                                <div className="flex items-center gap-3 border-r border-b border-black bg-slate-50 p-2 w-[45%]">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការិយបរិច្ឆេទជាប់ពន្ធ (ចំនួនខែ)</span>
                                        <span className="text-[9px] font-bold text-slate-600">Tax Period (Number of Month)</span>
                                    </div>
                                    <div className="flex gap-[2px] ml-auto items-center">
                                        <div className="w-7 h-9 border border-black flex items-center justify-center font-bold bg-white text-lg">1</div>
                                        <div className="w-7 h-9 border border-black flex items-center justify-center font-bold bg-white text-lg">2</div>
                                    </div>
                                </div>
                                <div className="flex flex-1 items-center justify-around px-4 border-b border-black">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-center leading-tight">ចាប់ពីថ្ងៃទី<br /><span className="text-[9px] font-normal text-slate-600">From</span></span>
                                        <div className="flex gap-[2px] text-[8px] items-center">
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <div key={i} className="w-5 h-7 border border-black" />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-black/20 mx-2" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-center leading-tight">ដល់ថ្ងៃទី<br /><span className="text-[9px] font-normal text-slate-600">Until</span></span>
                                        <div className="flex gap-[2px] text-[8px] items-center">
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <div key={i} className="w-5 h-7 border border-black" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Enterprise Details Form */}
                            <div className="flex flex-col border border-black mb-4">
                                {[
                                    { kh: "ឈ្មោះសហគ្រាស", en: "Name of Enterprise:", id: "2" },
                                    { kh: "ចំនួនសាខាក្នុងស្រុក", en: "Number of Local Branch:", id: "3" },
                                    { kh: "កាលបរិច្ឆេទចុះបញ្ជីសារពើពន្ធ", en: "Date of Tax Registration:", id: "4" },
                                    { kh: "ឈ្មោះអភិបាល/អ្នកគ្រប់គ្រង/ម្ចាស់សហគ្រាស", en: "Name of Director/Manager/Owner:", id: "5" },
                                    { kh: "សកម្មភាពអាជីវកម្មចម្បង", en: "Main Business Activities:", id: "6" },
                                    { kh: "ឈ្មោះគណនេយ្យករ/ភ្នាក់ងារសេវាកម្មពន្ធដារ", en: "Name of Accountant/Tax Service Agent:", id: "7", numBox: true },
                                    { kh: "អាសយដ្ឋានបច្ចុប្បន្ននៃការិយាល័យចុះបញ្ជី", en: "Current Registered Office Address:", id: "8", tall: true },
                                    { kh: "អាសយដ្ឋានបច្ចុប្បន្ននៃកន្លែងប្រកបអាជីវកម្មចម្បង", en: "Current Principal Establishment Address:", id: "9", tall: true },
                                    { kh: "អាសយដ្ឋានឃ្លាំង", en: "Warehouse Address:", id: "10" }
                                ].map((row, i) => (
                                    <div key={i} className={`flex border-b border-black last:border-b-0 ${row.tall ? 'min-h-[50px]' : 'min-h-[40px]'}`}>
                                        <div className="w-10 border-r border-black flex items-center justify-center font-bold text-sm bg-slate-50">{row.id}</div>
                                        <div className="w-[45%] border-r border-black p-2 flex flex-col justify-center bg-slate-50">
                                            <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh} ៖</span>
                                            <span className="text-[9px] text-slate-500">{row.en}</span>
                                        </div>
                                        <div className="flex-1 p-2 flex items-center w-full">

                                        </div>
                                        {row.numBox && (
                                            <>
                                                <div className="w-[22%] border-l border-r border-black p-2 flex flex-col justify-center bg-slate-50">
                                                    <span className="font-bold text-[9px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអាជ្ញាប័ណ្ណ...</span>
                                                    <span className="text-[8px] text-slate-500">License Number:</span>
                                                </div>
                                                <div className="w-[20%] p-2 bg-white flex items-center"></div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Compliance Details */}
                            <div className="flex flex-col border border-black">
                                <div className="flex border-b border-black min-h-[50px] bg-white">
                                    <div className="w-10 border-r border-black flex items-center justify-center font-bold text-sm bg-slate-50">11</div>
                                    <div className="w-[30%] border-r border-black p-2 flex flex-col justify-center bg-slate-50">
                                        <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការរក្សាទុកបញ្ជីគណនេយ្យ ៖</span>
                                        <span className="text-[9px] text-slate-500">Accounting Records:</span>
                                    </div>
                                    <div className="flex-1 flex px-3 py-2 items-center text-[10px] gap-6">
                                        <div className="flex items-center gap-2 border border-black p-1.5 flex-1 h-full shadow-sm">
                                            <div className="w-5 h-5 border border-black shrink-0 bg-white"></div>
                                            <div className="flex flex-col leading-tight"><span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រើប្រាស់កម្មវិធី (ឈ្មោះ) ៖</span><span className="text-[8px] text-slate-500 mt-0.5">Using Software (Name):</span></div>
                                            <div className="border-b border-dashed border-slate-400 flex-1 ml-2"></div>
                                        </div>
                                        <div className="flex items-center gap-2 border border-black p-1.5 h-full shadow-sm">
                                            <div className="w-5 h-5 border border-black shrink-0 bg-white"></div>
                                            <div className="flex flex-col leading-tight"><span className="font-bold text-[10px]" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>មិនប្រើប្រាស់ទេ</span><span className="text-[8px] text-slate-500 mt-0.5">Not Using Software</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex border-b border-black min-h-[50px]">
                                    <div className="w-10 border-r border-black flex items-center justify-center font-bold text-sm bg-slate-50">12</div>
                                    <div className="w-[30%] border-r border-black p-2 flex flex-col justify-center bg-slate-50">
                                        <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>អនុលោមភាពសារពើពន្ធ ៖</span>
                                        <span className="text-[9px] text-slate-500">Tax Compliance Status:</span>
                                    </div>
                                    <div className="flex-1 flex px-6 items-center gap-10 text-[11px] font-black uppercase bg-white">
                                        <div className="flex items-center gap-3 border border-black p-2 shadow-sm"><div className="w-5 h-5 border border-black bg-white"></div> មាស<br /><span className="text-[9px] font-bold text-slate-500">Gold</span></div>
                                        <div className="flex items-center gap-3 border border-black p-2 shadow-sm"><div className="w-5 h-5 border border-black bg-white"></div> ប្រាក់<br /><span className="text-[9px] font-bold text-slate-500">Silver</span></div>
                                        <div className="flex items-center gap-3 border border-black p-2 shadow-sm"><div className="w-5 h-5 border border-black bg-white"></div> សំរិទ្ធ<br /><span className="text-[9px] font-bold text-slate-500">Bronze</span></div>
                                    </div>
                                </div>
                                <div className="flex min-h-[50px]">
                                    <div className="w-10 border-r border-black flex items-center justify-center font-bold text-sm bg-slate-50">13</div>
                                    <div className="w-[30%] border-r border-black p-2 flex flex-col justify-center bg-slate-50">
                                        <span className="font-bold text-[11px] leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>តម្រូវសវនកម្មឯករាជ្យ ៖</span>
                                        <span className="text-[9px] text-slate-500">Statutory Audit Required:</span>
                                    </div>
                                    <div className="flex-1 flex px-6 py-2 items-center gap-10 text-[11px] bg-white">
                                        <div className="flex items-center gap-3 border border-black p-2 flex-1 shadow-sm"><div className="w-5 h-5 border border-black bg-white shrink-0"></div> <div className="flex flex-col font-bold leading-tight"><span>តម្រូវឱ្យមាន</span><span className="text-[9px] text-slate-500 mt-0.5">Required</span></div></div>
                                        <div className="flex items-center gap-3 border border-black p-2 flex-1 shadow-sm"><div className="w-5 h-5 border border-black bg-white shrink-0"></div> <div className="flex flex-col font-bold leading-tight"><span>មិនតម្រូវឱ្យមាន</span><span className="text-[9px] text-slate-500 mt-0.5">Not Required</span></div></div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full text-center mt-12 mb-8 opacity-20 flex flex-col items-center">
                                <div className="w-px h-16 bg-black mb-4"></div>
                                <span className="text-xl font-black tracking-[0.5em] uppercase text-black">Page 1 Virtual Print</span>
                                <span className="text-xs font-bold tracking-widest text-black mt-2">D N A &bull; P R E V I E W</span>
                            </div>

                        </div>
                    </div>
                )}

                {/* MIDDLE SIDE: GPT Result Landing Page (Totally Black, empty) */}
                <div className="flex-1 overflow-y-auto relative bg-black custom-scrollbar">
                    {/* Embedded TOI Page 1 Admin Template for GPT Engine to dictate */}
                    <LiveTaxWorkspace embedded={true} forcePage={activeWorkspacePage} />
                </div>

                {/* RIGHT SIDE: Agent Terminal (Right Top Side) */}
                <div className="w-[442px] shrink-0 border-l border-white/5 bg-slate-950/30 p-8 overflow-y-auto flex flex-col justify-start items-center custom-scrollbar">

                    {/* AI Orb / Avatar */}
                    <div className="relative mb-8 flex items-center justify-center gap-3 mt-8 animate-in fade-in duration-700">
                        <span className="text-3xl font-medium tracking-tight text-white/90 drop-shadow-md pb-1">the</span>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.5),inset_0_-4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden" />
                        <span className="text-3xl font-medium tracking-tight text-white/90 drop-shadow-md pb-1">blue agent</span>
                    </div>

                    {/* Agent Chat Interface */}
                    <div className="w-full h-[800px] bg-black border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col mt-2 flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-700">

                        {/* Header */}
                        <div className="px-6 py-4 bg-slate-900/40 border-b border-white/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Agent Terminal</span>
                            </div>
                            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Online</span>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="p-6 overflow-y-auto space-y-6 bg-slate-950/20 flex-1 custom-scrollbar">
                            {/* Agent Initial Message */}
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.3)] flex items-center justify-center shrink-0 border border-white/10" />
                                <div className="bg-slate-900 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3">
                                    <p className="text-slate-300 text-[13px] leading-relaxed">
                                        Hello. I am <b>the blue agent</b>.<br /><br />
                                        I can read company registration profiles, bank statements, and compliance history to auto-fill identifiers and compliance indicators on this workspace. How can I help you today?
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* GPT Input Area */}
                        <div className="p-4 bg-slate-950/50 border-t border-white/5 shrink-0">
                            <div className="flex flex-col gap-3 border border-white/10 bg-black/40 p-3 rounded-2xl focus-within:border-blue-500/50 transition-all shadow-inner">
                                <textarea
                                    placeholder="Message GPT Agent..."
                                    className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-600 resize-none custom-scrollbar px-1 leading-relaxed"
                                    rows={4}
                                />
                                <div className="flex justify-end">
                                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                        Send &gt;
                                    </button>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>

            </div>
        </div>
    );
};

export default ToiAcar;
