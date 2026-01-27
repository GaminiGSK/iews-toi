import React from 'react';

const EditableField = ({ label, value, onChange, className, placeholder }) => {
    return (
        <div className="relative group inline-block min-w-[200px]">
            {/* Label only appears on hover to keep the "Document" look clean */}
            <span className="absolute -top-4 left-0 text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold tracking-wider">
                {label}
            </span>
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`bg-transparent border-b border-transparent hover:border-blue-300 focus:border-blue-500 outline-none w-full text-center transition-colors placeholder-gray-300 ${className}`}
            />
        </div>
    );
};

const DigitalCertificate = ({ data, onUpdate }) => {
    return (
        <div className="w-full max-w-[800px] mx-auto bg-[#fffdf5] text-gray-900 font-serif border-8 border-double border-[#b8860b] p-10 shadow-2xl relative overflow-hidden">

            {/* Watermark / Background Texture Effect */}
            <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
                <div className="w-96 h-96 rounded-full border-4 border-gray-900"></div>
            </div>

            {/* HEADER */}
            <div className="text-center mb-12 relative z-10">
                <h1 className="text-2xl font-bold tracking-[0.2em] mb-2 font-serif text-[#1a365d]">KINGDOM OF CAMBODIA</h1>
                <h2 className="text-lg font-medium text-[#c53030] tracking-widest mb-6">NATION RELIGION KING</h2>

                {/* Decorative Line */}
                <div className="w-32 h-1 bg-[#b8860b] mx-auto mb-8"></div>

                <div className="mb-4">
                    <span className="block text-sm text-gray-500 uppercase tracking-widest mb-1">Ministry of Commerce</span>
                    <h1 className="text-4xl font-bold text-[#1a365d] uppercase tracking-wide border-b-2 border-[#1a365d] inline-block pb-2 px-6">
                        Certificate of Incorporation
                    </h1>
                </div>
            </div>

            {/* BODY */}
            <div className="text-center space-y-8 relative z-10 px-10">
                <p className="text-lg italic text-gray-600">This is to certify that</p>

                {/* COMPANY NAMES */}
                <div className="py-6 bg-blue-50/30 rounded-xl border border-blue-50">
                    <div className="mb-4">
                        <EditableField
                            label="Company Name (Khmer)"
                            value={data.companyNameKh}
                            onChange={(val) => onUpdate('companyNameKh', val)}
                            className="text-3xl font-bold text-[#1a365d]"
                            placeholder="ឈ្មោះក្រុមហ៊ុន (ខ្មែរ)"
                        />
                    </div>
                    <div>
                        <EditableField
                            label="Company Name (English)"
                            value={data.companyNameEn}
                            onChange={(val) => onUpdate('companyNameEn', val)}
                            className="text-2xl font-bold text-[#1a365d] uppercase tracking-wide"
                            placeholder="COMPANY NAME (ENGLISH)"
                        />
                    </div>
                </div>

                <p className="text-lg italic text-gray-600">is a Limited Private Company registered under the laws of the Kingdom of Cambodia.</p>

                {/* DETAILS GRID */}
                <div className="grid grid-cols-2 gap-12 text-left max-w-2xl mx-auto mt-8">
                    <div className="border-t border-gray-300 pt-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-sans">Registration Number</p>
                        <EditableField
                            label="Reg. No"
                            value={data.registrationNumber}
                            onChange={(val) => onUpdate('registrationNumber', val)}
                            className="text-xl font-mono text-gray-900 font-bold text-left"
                            placeholder="00000000"
                        />
                    </div>
                    <div className="border-t border-gray-300 pt-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-sans">Incorporation Date</p>
                        <EditableField
                            label="Date"
                            value={data.incorporationDate}
                            onChange={(val) => onUpdate('incorporationDate', val)}
                            className="text-xl font-mono text-gray-900 font-bold text-left"
                            placeholder="DD/MM/YYYY"
                        />
                    </div>
                </div>

                {/* ADDRESS */}
                <div className="mt-8 border-t border-gray-300 pt-4 text-left max-w-2xl mx-auto">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-sans md:text-center">Registered Office Address</p>
                    <textarea
                        value={data.address || ''}
                        onChange={(e) => onUpdate('address', e.target.value)}
                        placeholder="Registered Address..."
                        className="w-full bg-transparent border-none outline-none text-center text-lg italic text-gray-800 resize-none h-20 hover:bg-gray-50 focus:bg-white transition-colors rounded"
                    />
                </div>
            </div>

            {/* FOOTER */}
            <div className="mt-20 flex justify-end px-10 relative z-10">
                <div className="text-center">
                    <div className="mb-4">
                        {/* Signature Placeholder */}
                        <div className="h-16 flex items-end justify-center">
                            <span className="font-script text-3xl text-blue-900 opacity-60">Verified Digitally</span>
                        </div>
                    </div>
                    <div className="border-t-2 border-gray-800 w-64 pt-2">
                        <p className="text-sm font-bold uppercase tracking-widest text-gray-800">Minister of Commerce</p>
                    </div>
                </div>
            </div>

            {/* SYSTEM STATUS BADGE */}
            <div className="absolute top-4 right-4">
                <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200 shadow-sm flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    DIGITAL TWIN VERIFIED
                </div>
            </div>
        </div>
    );
};

export default DigitalCertificate;
