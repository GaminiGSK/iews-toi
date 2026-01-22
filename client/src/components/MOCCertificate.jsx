import React from 'react';
import { RefreshCw } from 'lucide-react';

const MOCCertificate = ({ data, onRegenerate, regenerating }) => {
    return (
        <div className="relative w-full max-w-2xl mx-auto bg-white border-8 border-yellow-600/30 p-8 shadow-2xl rounded-lg font-serif">
            {/* Background Texture Hint */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 pointer-events-none"></div>

            {/* Header */}
            <div className="text-center mb-8 relative z-10">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-300">
                    <span className="text-xs text-gray-400">LOGO</span>
                </div>
                <h1 className="text-2xl font-bold text-blue-900 mb-1 font-khmer">វិញ្ញាបនបត្របញ្ជារការចុះឈ្មោះក្នុងបញ្ជីពាណិជ្ជកម្ម</h1>
                <h2 className="text-lg font-bold text-gray-800 tracking-wider">CERTIFICATE OF INCORPORATION</h2>
            </div>

            {/* Content Grid */}
            <div className="space-y-6 relative z-10 px-4">

                {/* Name */}
                <div className="grid grid-cols-3 gap-4 border-b border-dashed border-gray-200 pb-2">
                    <div className="text-sm font-bold text-gray-500 uppercase pt-2">Name</div>
                    <div className="col-span-2">
                        <div className="font-bold text-lg text-blue-900 font-khmer">{data.companyNameKh || '...'}</div>
                        <div className="font-bold text-lg text-gray-800">{data.companyNameEn || '...'}</div>
                    </div>
                </div>

                {/* Reg Number */}
                <div className="grid grid-cols-3 gap-4 border-b border-dashed border-gray-200 pb-2">
                    <div className="text-sm font-bold text-gray-500 uppercase pt-1">Registration No.</div>
                    <div className="col-span-2 font-mono text-xl text-gray-800 tracking-widest">{data.registrationNumber || '...'}</div>
                </div>

                {/* Old Reg Number */}
                <div className="grid grid-cols-3 gap-4 border-b border-dashed border-gray-200 pb-2">
                    <div className="text-sm font-bold text-gray-500 uppercase pt-1">Old Reg No.</div>
                    <div className="col-span-2 font-mono text-lg text-gray-600">{data.oldRegistrationNumber || '-'}</div>
                </div>

                {/* Incorporated Date */}
                <div className="grid grid-cols-3 gap-4 border-b border-dashed border-gray-200 pb-2">
                    <div className="text-sm font-bold text-gray-500 uppercase pt-1">Incorporation Date</div>
                    <div className="col-span-2 font-bold text-lg text-gray-800">{data.incorporationDate || '...'}</div>
                </div>

                {/* Type */}
                <div className="grid grid-cols-3 gap-4 border-b border-dashed border-gray-200 pb-2">
                    <div className="text-sm font-bold text-gray-500 uppercase pt-1">Incorporated As</div>
                    <div className="col-span-2 font-bold text-lg text-gray-800">{data.companyType || '...'}</div>
                </div>

            </div>

            {/* Footer */}
            <div className="mt-12 flex justify-end relative z-10">
                <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Phnom Penh, {data.incorporationDate || '...'}</p>
                    <div className="w-32 h-32 border-2 border-red-500/50 rounded-full flex items-center justify-center rotate-[-12deg] mb-2">
                        <span className="text-red-500 text-xs font-bold uppercase opacity-50">Authorized Stamp</span>
                    </div>
                    <p className="font-bold text-blue-900 border-t border-gray-400 pt-1 inline-block px-4">Minister of Commerce</p>
                </div>
            </div>

            {/* Action Overlay (Regenerate) */}
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={onRegenerate}
                    disabled={regenerating}
                    className="flex items-center gap-2 bg-white/90 backdrop-blur border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg shadow hover:bg-blue-50 transition text-sm font-medium disabled:opacity-50"
                >
                    <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
                    {regenerating ? 'Scanning...' : 'Regenerate AI'}
                </button>
            </div>

        </div>
    );
};

export default MOCCertificate;
