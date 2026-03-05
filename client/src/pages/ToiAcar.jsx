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
