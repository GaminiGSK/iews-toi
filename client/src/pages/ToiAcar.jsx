import React from 'react';
import { ArrowLeft } from 'lucide-react';

const ToiAcar = ({ onBack, packageId, year }) => {
    return (
        <div className="w-full min-h-screen bg-[#0f172a] text-white flex flex-col font-sans">
            {/* HEADER */}
            <div className="bg-[#1e293b] border-b border-white/10 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/5 rounded-lg text-white transition"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold uppercase tracking-tight">New Workspace Concept</h1>
                        <p className="text-[10px] text-gray-500 font-mono tracking-tighter">Ready for rebuild</p>
                    </div>
                </div>
            </div>

            {/* MAIN EMPTY EXPERIMENTAL CANVAS */}
            <div className="flex-1 overflow-y-auto px-10 py-10 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-3xl bg-slate-900/40 w-full max-w-4xl min-h-[500px]">
                    <h2 className="text-3xl font-black text-white/30 uppercase tracking-widest mb-4">Blank Canvas</h2>
                    <p className="text-slate-500 text-sm text-center max-w-lg">
                        The previous compliance form layout has been completely cleared.
                        This page is now ready for your new idea and layout rebuild.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ToiAcar;
