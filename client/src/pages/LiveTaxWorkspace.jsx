import React, { useState, useEffect } from 'react';
import DynamicForm from '../components/DynamicForm';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, RefreshCw, Radio, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const INITIAL_SCHEMA = {
    title: "Annual Income Tax Return",
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
        }
    ]
};

const LiveTaxWorkspace = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const packageId = searchParams.get('packageId') || searchParams.get('year');
    const socket = useSocket();
    const [isSyncing, setIsSyncing] = useState(false);
    const [activePage, setActivePage] = useState(1);

    useEffect(() => {
        if (socket && packageId) {
            socket.emit('workspace:join', { packageId });
        }
    }, [socket, packageId]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Header / Navigation */}
            <div className="bg-slate-900/50 border-b border-white/5 backdrop-blur-md sticky top-0 z-20 px-10 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition border border-white/10"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-none mb-1">TOI Compliance Package</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">27 Pages Document Suite</p>
                        </div>
                    </div>

                    {/* 27 PAGE SELECTION */}
                    <div className="flex-1 flex overflow-x-auto mx-12 py-2 no-scrollbar gap-1.5 justify-center">
                        {Array.from({ length: 27 }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setActivePage(i + 1)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${activePage === i + 1
                                    ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-900/40'
                                    : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                                    }`}
                            >
                                P.{i + 1}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-tighter transition-colors ${socket?.connected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            <Radio size={12} className={socket?.connected ? "animate-pulse" : ""} />
                            <span>{socket?.connected ? 'Logic Link Online' : 'Logic Link Offline'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* A4 VISUALIZATION STAGE */}
            <div className="flex-1 overflow-y-auto bg-slate-900/40 pt-10 pb-20 px-10 relative">
                <div className="ml-0 mr-[450px] flex justify-center transition-all duration-500">
                    <div className="relative group">
                        {/* Page Shadow Stack (Visual Depth) */}
                        <div className="absolute top-3 left-3 w-[800px] aspect-[1/1.414] bg-white/5 rounded-sm -z-10 blur-sm translate-x-3 translate-y-3 opacity-50" />
                        <div className="absolute top-1.5 left-1.5 w-[800px] aspect-[1/1.414] bg-white/10 rounded-sm -z-10 translate-x-1.5 translate-y-1.5" />

                        {/* THE MAIN WHITE A4 PAGE */}
                        <div className="w-[800px] aspect-[1/1.414] bg-white rounded shadow-2xl overflow-hidden animate-fade-in relative">
                            {/* Watermark/Grid */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                                style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                            {/* Header of the actual form */}
                            <div className="p-12 h-full flex flex-col">
                                <div className="border-b-[3px] border-black pb-8 mb-10 flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-black font-extrabold uppercase text-sm tracking-tighter">Kingdom of Cambodia</span>
                                        <span className="text-black text-xs font-bold">Nation Religion King</span>
                                        <div className="w-20 h-[2px] bg-black mt-2" />
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="bg-black text-white px-3 py-1 text-[12px] font-black mb-3 rounded-sm shadow-lg shadow-black/20">DOCUMENT PAGE {activePage}</div>
                                        <span className="text-[10px] text-gray-400 font-mono tracking-widest font-bold">SERIAL_PK: TOI-2027-{activePage.toString().padStart(2, '0')}</span>
                                    </div>
                                </div>

                                {/* Form Content Mockup */}
                                <div className="flex-1">
                                    {activePage === 1 ? (
                                        <div className="animate-fade-in">
                                            <div className="text-center mb-12">
                                                <h1 className="text-2xl font-black text-black uppercase mb-1">Annual Income Tax Return</h1>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">General Department of Taxation</p>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="h-10 bg-gray-50 border border-gray-100 rounded" />
                                                    <div className="h-10 bg-gray-50 border border-gray-100 rounded" />
                                                </div>
                                                <div className="h-32 bg-gray-50 border border-gray-100 rounded" />
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="h-12 bg-gray-50 border border-gray-100 rounded" />
                                                    <div className="h-12 bg-gray-50 border border-gray-100 rounded" />
                                                    <div className="h-12 bg-gray-50 border border-gray-100 rounded" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-200 animate-slide-up py-40">
                                            <div className="w-24 h-24 border-4 border-dashed border-slate-100 rounded-3xl flex items-center justify-center mb-8 rotate-12 opacity-40">
                                                <span className="text-4xl font-black text-slate-300 -rotate-12">{activePage}</span>
                                            </div>
                                            <h3 className="text-slate-400 font-black uppercase tracking-[0.4em] text-sm">Visual Annex</h3>
                                            <p className="text-slate-300 text-[10px] mt-4 font-bold uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">Awaiting Neural Data Mapping</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="mt-auto pt-8 border-t border-gray-100 text-center">
                                    <span className="text-[8px] text-gray-300 uppercase tracking-[0.3em] font-bold">GK Smart Business Integrity Logic v.2.7</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default LiveTaxWorkspace;
