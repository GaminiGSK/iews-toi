import React from 'react';
import { RefreshCw, QrCode } from 'lucide-react';

const MOCCertificate = ({ data, onRegenerate, regenerating }) => {
    console.log("MOCCertificate Rendering. Data:", data);
    return (
        <div className="relative w-full aspect-[1.414/1] bg-white text-black font-serif shadow-2xl overflow-hidden select-none border border-gray-300">
            {/* DEBUG: Remove in production */}
            {/* <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] z-50 p-1">DEBUG: MOC Component Mounted</div> */}

            {/* 1. ORNATE BORDER (Simulated with double borders) */}
            <div className="absolute inset-2 border-4 border-[#B8860B] rounded-sm pointer-events-none z-10"></div>
            <div className="absolute inset-4 border border-[#B8860B] rounded-sm pointer-events-none z-10"></div>

            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-20"></div>
            <div className="absolute inset-0 bg-blue-50/10 pointer-events-none"></div>

            <div className="relative z-20 h-full flex flex-col px-12 py-10">

                {/* 2. HEADER SECTION */}
                <div className="flex justify-between items-start mb-6">
                    {/* Left: Ministry Logo */}
                    <div className="text-center w-1/3">
                        <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Emblem_of_the_Ministry_of_Commerce_%28Cambodia%29.svg/1200px-Emblem_of_the_Ministry_of_Commerce_%28Cambodia%29.svg.png" alt="MOC" className="w-12 h-12 opacity-80" />
                        </div>
                        <h3 className="font-bold text-[10px] text-blue-900 font-khmer leading-tight">ក្រសួងពាណិជ្ជកម្�?/h3>
                        <h3 className="font-bold text-[8px] text-gray-800 uppercase">Ministry of Commerce</h3>
                        <p className="text-[8px] text-gray-500 mt-1">លេ�?(No): MOC-{data.registrationNumber || '00000000'}</p>
                    </div>

                    {/* Center: Title (Actually usually blank or small decorative) */}
                    <div className="flex-1"></div>

                    {/* Right: Kingdom Header */}
                    <div className="text-center w-1/3">
                        <h2 className="font-bold text-lg font-khmer text-blue-900 mb-1">ព្រះរាជាណាចក្រកម្ពុជា</h2>
                        <h3 className="font-bold text-xs uppercase mb-2">Kingdom of Cambodia</h3>
                        <h4 className="font-serif text-[10px] italic relative inline-block px-4">
                            Nation Religion King
                            {/* Decorative underline */}
                            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-400"></span>
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-400 rounded-full"></span>
                        </h4>
                    </div>
                </div>

                {/* 3. CENTER TITLE */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-900 font-khmer mb-2 shadow-sm">វិញ្ញាបនបត្របញ្ជារការចុះឈ្មោះក្នុងបញ្ជីពាណិជ្ជកម្�?/h1>
                    <h2 className="text-xl font-bold text-gray-900 tracking-wide uppercase decoration-double">Certificate of Incorporation</h2>
                </div>

                {/* 4. MAIN CONTENT (Fields) */}
                <div className="flex-1 relative px-8">
                    {/* Watermark Logo */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Emblem_of_the_Ministry_of_Commerce_%28Cambodia%29.svg/1200px-Emblem_of_the_Ministry_of_Commerce_%28Cambodia%29.svg.png" className="w-64 h-64 grayscale" />
                    </div>

                    <div className="grid grid-cols-[140px_1fr] gap-y-4 text-sm relative z-10 ml-10">
                        {/* Name */}
                        <div className="font-bold text-gray-500 text-xs uppercase pt-1 tracking-wider">Name</div>
                        <div className="flex flex-col border-b border-gray-300 border-dashed pb-1">
                            <span className="font-bold text-lg text-blue-900 font-khmer">{data.companyNameKh || '...'}</span>
                            <span className="font-bold text-base text-gray-900 uppercase">{data.companyNameEn || '...'}</span>
                        </div>

                        {/* Registration Number */}
                        <div className="font-bold text-gray-500 text-xs uppercase pt-1 tracking-wider">Registration No.</div>
                        <div className="font-mono text-lg font-bold text-gray-800 tracking-widest">{data.registrationNumber || '...'}</div>

                        {/* Old Registration Number (If exists) */}
                        <div className="font-bold text-gray-500 text-xs uppercase pt-1 tracking-wider">Old Reg No.</div>
                        <div className="font-mono text-base text-gray-600">{data.oldRegistrationNumber || '-'}</div>

                        {/* Incorporation Date */}
                        <div className="font-bold text-gray-500 text-xs uppercase pt-1 tracking-wider">Incorporation Date</div>
                        <div className="font-bold text-base text-gray-800 flex gap-2">
                            <span>{data.incorporationDate || '...'}</span>
                        </div>

                        {/* Type */}
                        <div className="font-bold text-gray-500 text-xs uppercase pt-1 tracking-wider">Is Incorporated As</div>
                        <div className="font-bold text-base text-gray-800">{data.companyType || 'Private Limited Company'}</div>
                    </div>
                </div>

                {/* 5. FOOTER */}
                <div className="mt-8 flex justify-between items-end pb-4 px-4">
                    {/* Left: QR & Legal */}
                    <div className="flex flex-col gap-2 w-1/3">
                        <p className="text-[7px] text-gray-500 leading-tight text-justify">
                            Companies must register their business with the Ministry of Commerce.
                            This certificate is valid evidence of legal incorporation in the Kingdom of Cambodia.
                            Under the regulations of commercial rules and register law.
                        </p>
                        <div className="w-16 h-16 bg-white border border-gray-200 p-1">
                            <QrCode className="w-full h-full text-gray-800" />
                        </div>
                    </div>

                    {/* Right: Signature */}
                    <div className="text-center w-1/3 relative">
                        <p className="text-xs font-bold text-gray-700 mb-1">
                            Phnom Penh, <span className="font-mono">{data.incorporationDate || '...'}</span>
                        </p>
                        <p className="text-[10px] font-bold text-gray-600 uppercase mb-4">
                            For Minister of Commerce
                        </p>

                        {/* Stamp & Sig */}
                        <div className="relative h-24 flex items-center justify-center">
                            {/* Signature (Fake) */}
                            <div className="absolute font-cursive text-blue-800 text-xl -rotate-6 z-20 transform translate-y-2">
                                Pan Sorasak
                            </div>

                            {/* Stamp */}
                            <div className="w-24 h-24 border-2 border-red-600 rounded-full flex items-center justify-center opacity-80 rotate-[-12deg] z-10 absolute">
                                <span className="text-red-600 text-[6px] font-bold uppercase text-center w-20 leading-tight">
                                    Ministry of Commerce<br />Kingdom of Cambodia<br />* Official *
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-gray-400 mt-2 pt-1">
                            <h4 className="font-bold text-blue-900 text-xs font-khmer">ប្រតិភូរាជរដ្ឋាភិបាល</h4>
                            <h5 className="font-bold text-blue-900 text-[10px] uppercase">Delegate of Royal Government</h5>
                        </div>
                    </div>
                </div>

            </div>

            {/* Action Overlay (Regenerate) */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={onRegenerate}
                    disabled={regenerating}
                    className="flex items-center gap-2 bg-white/90 backdrop-blur border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg shadow hover:bg-blue-50 transition text-sm font-medium disabled:opacity-50"
                >
                    <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
                    {regenerating ? 'Scanning...' : 'Regenerate'}
                </button>
            </div>
        </div>
    );
};

export default MOCCertificate;
