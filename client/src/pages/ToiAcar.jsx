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

                {/* LEFT SIDE: GPT Result Landing Page (Totally Black, empty) */}
                <div className="flex-1 overflow-y-auto relative bg-black custom-scrollbar">
                    {/* Embedded TOI Page 1 Admin Template for GPT Engine to dictate */}
                    <LiveTaxWorkspace embedded={true} forcePage={activeWorkspacePage} />
                </div>

                {/* RIGHT SIDE: Agent Terminal (Right Top Side) */}
                <div className="w-[450px] shrink-0 border-l border-white/5 bg-slate-950/30 p-8 overflow-y-auto flex flex-col justify-start items-center custom-scrollbar">

                    {/* AI Orb / Avatar */}
                    <div className="relative mb-8 flex flex-col items-center mt-2">
                        <div className="w-20 h-20 bg-black border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.1)] rounded-full flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-rose-500/20 opacity-50" />
                            <Brain size={32} className="text-indigo-400 relative z-10" />
                        </div>

                        <div className="mt-5 text-center animate-in fade-in duration-700">
                            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                                Page 1 Intelligence <span className="text-indigo-500">v3.0</span>
                            </h2>
                            <p className="text-slate-500 text-[10px] mt-2 flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest">
                                <Sparkles size={12} className="text-rose-400" />
                                Form Automation Module
                            </p>
                        </div>
                    </div>

                    {/* Agent Chat Interface */}
                    <div className="w-full bg-black border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col mt-2 flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-700">

                        {/* Header */}
                        <div className="px-6 py-4 bg-slate-900/40 border-b border-white/5 flex items-center justify-between">
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
                        <div className="p-6 overflow-y-auto space-y-6 bg-slate-950/20 max-h-[400px]">
                            {/* Agent Initial Message */}
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                    <Brain size={14} className="text-indigo-400" />
                                </div>
                                <div className="bg-slate-900 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3">
                                    <p className="text-slate-300 text-[13px] leading-relaxed">
                                        System initialized for <b>Page 1 Analytics</b>.<br /><br />
                                        I can read company registration profiles, bank statements, and compliance history to auto-fill the entity identifiers and compliance indicators on this page.
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 mt-4">
                                <button className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                    Sync From Company Profile
                                </button>
                                <button className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition shadow-sm">
                                    Analyze Tax Compliance Status
                                </button>
                                <button className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition shadow-sm">
                                    Scan For Audit Requirements
                                </button>
                            </div>
                        </div>

                        {/* Footer (Status) */}
                        <div className="px-5 py-4 bg-black border-t border-white/5">
                            <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-center gap-2 group">
                                <ShieldCheck size={16} className="text-slate-600 group-hover:text-slate-500 transition-colors" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest transition-colors">Standby Mode</span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default ToiAcar;
