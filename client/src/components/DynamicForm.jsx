import React from 'react';
import { Calculator, AlertCircle, CheckCircle2, CheckCircle } from 'lucide-react';

const BoxGridInput = ({ length, value, onChange, format, noDash }) => {
    const cleanValue = (value || '').toString().replace(/[^a-zA-Z0-9]/g, '');
    const chars = cleanValue.split('');

    const handleChange = (index, char) => {
        const newVal = [...chars];
        while (newVal.length < length) newVal.push('');
        newVal[index] = char.slice(-1);
        onChange(newVal.join(''));

        if (char && index < length - 1) {
            const nextInput = document.getElementById(`box-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !chars[index] && index > 0) {
            const prevInput = document.getElementById(`box-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    let renderedBoxes = [];
    let currentIdx = 0;

    if (format) {
        const parts = format.split('-').map(Number);
        parts.forEach((partLen, pIdx) => {
            let segment = [];
            for (let i = 0; i < partLen; i++) {
                const idx = currentIdx++;
                segment.push(
                    <input
                        key={idx}
                        id={`box-${idx}`}
                        type="text"
                        maxLength={1}
                        value={chars[idx] || ''}
                        onChange={(e) => handleChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-6 h-7 border border-black text-center font-serif font-bold text-[14px] bg-white focus:bg-blue-50 outline-none"
                    />
                );
            }
            renderedBoxes.push(<div key={`seg-${pIdx}`} className={`flex ${pIdx > 0 ? 'ml-1.5' : ''}`}>{segment}</div>);
            if (pIdx < parts.length - 1 && !noDash) {
                renderedBoxes.push(<span key={`dash-${pIdx}`} className="mx-0.5 font-bold text-xs">-</span>);
            }
        });
    } else {
        for (let i = 0; i < length; i++) {
            const idx = i;
            renderedBoxes.push(
                <input
                    key={idx}
                    id={`box-${idx}`}
                    type="text"
                    maxLength={1}
                    value={chars[idx] || ''}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-6 h-7 border border-black text-center font-serif font-bold text-[14px] bg-white focus:bg-blue-50 outline-none"
                />
            );
        }
    }

    return (
        <div className="flex items-center gap-0.5">
            {renderedBoxes}
        </div>
    );
};

const FieldInput = ({ field, value, onChange }) => {
    const baseClasses = "w-full bg-transparent border-b border-dotted border-slate-400 focus:border-black outline-none transition-all font-mono text-blue-900 font-bold px-1 text-sm";

    if (field.type === 'boxes') {
        return (
            <div className="flex items-center">
                {field.prefix && <span className="mr-2 text-black text-lg">▶</span>}
                <BoxGridInput length={field.length} value={value} onChange={(val) => onChange(field.key, val)} format={field.format} noDash={field.noDash} />
            </div>
        );
    }

    return (
        <input
            type={field.type || 'text'}
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={`${baseClasses} ${field.className || ''}`}
        />
    );
};

const OptionItem = ({ labelKh, labelEn, selected, onClick, subText }) => (
    <div onClick={onClick} className="flex items-start gap-2 cursor-pointer group py-1">
        <div className={`w-4 h-4 border border-black flex items-center justify-center bg-white mt-1 shrink-0`}>
            {selected && <div className="w-2.5 h-2.5 bg-black"></div>}
        </div>
        <div className="flex flex-col">
            <span className="font-khmer text-[10px] text-black leading-none">{labelKh || "ព័ត៌មាន"}</span>
            <span className={`text-[10px] uppercase font-bold leading-none ${selected ? 'text-black' : 'text-slate-500'}`}>{labelEn}</span>
            {subText && <span className="text-[10px] text-blue-700 italic font-bold mt-1">{subText}</span>}
        </div>
    </div>
);

const SectionRow = ({ number, labelKh, labelEn, children, className = "" }) => (
    <div className={`flex items-start gap-4 py-4 border-b border-black px-6 hover:bg-slate-50/50 transition ${className}`}>
        {number && (
            <div className="w-6 h-6 shrink-0 bg-black text-white flex items-center justify-center font-bold text-xs mt-0.5">
                {number}
            </div>
        )}
        <div className="flex-1 min-w-0">
            <div className="flex flex-col mb-3">
                <span className="font-khmer font-bold text-[13px] text-black leading-tight">{labelKh || "ព័ត៌មាន"}</span>
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">{labelEn}</span>
            </div>
            {children}
        </div>
    </div>
);

const DynamicForm = ({ schema = {}, data = {}, onChange = () => { }, onSubmit = () => { }, activeSheet = 1, onSheetChange = () => { } }) => {
    return (
        <div className="bg-white shadow-2xl mx-auto w-full max-w-[1000px] text-black font-sans leading-normal relative min-h-[1414px]">
            {/* Header / Top Navigation */}
            <div className="sticky top-0 z-[60] bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-white/10 print:hidden text-white">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Calculator className="text-rose-400" size={20} />
                        <span className="font-bold text-sm tracking-widest hidden md:block">TAX LIVE WORKSPACE</span>
                    </div>
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
                        {[1, 2, 3, 4, 5].map(p => (
                            <button
                                key={p}
                                onClick={() => onSheetChange(p)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${activeSheet === p ? 'bg-rose-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400'}`}
                            >
                                PAGE {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Paper Container */}
            <div className="p-8 print:p-0">
                {activeSheet === 1 && (
                    <div className="border-[3px] border-black">
                        {/* 1. Official Header */}
                        <div className="flex justify-between items-start p-6 border-b-[2px] border-black">
                            <div className="flex flex-col items-center">
                                <h3 className="font-khmer font-bold text-xs mb-1.5 leading-relaxed">ព្រះរាជាណាចក្រកម្ពុជា</h3>
                                <h4 className="font-serif font-bold text-sm uppercase mb-3 text-black tracking-[0.2em]">KINGDOM OF CAMBODIA</h4>
                                <h3 className="font-khmer font-bold text-xs mb-1.5 leading-relaxed">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
                                <div className="w-32 h-[1px] bg-black mb-1"></div>
                                <h4 className="font-serif text-[11px] uppercase tracking-widest">NATION RELIGION KING</h4>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2 border border-black/10 grayscale opacity-80">
                                    <img src="/logo-gdt-small.png" alt="" className="w-12" />
                                </div>
                                <h3 className="font-khmer font-bold text-xs mb-1.5 leading-relaxed">អគ្គនាយកដ្ឋានពន្ធដារ</h3>
                                <h4 className="font-serif font-bold text-[11px] uppercase mb-6 tracking-wide leading-none">GENERAL DEPARTMENT OF TAXATION</h4>
                            </div>
                        </div>

                        {/* Title Box */}
                        <div className="text-center py-10 border-b border-black">
                            <h1 className="font-khmer font-bold text-xl text-black leading-none mb-3">លិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ</h1>
                            <h2 className="font-serif font-black text-lg uppercase tracking-[0.15em] text-black">ANNUAL INCOME TAX RETURN</h2>
                            <p className="text-[10px] mt-2 italic font-serif">(Law on Taxation - December 2023)</p>
                        </div>

                        {/* Fiscal Context */}
                        <div className="grid grid-cols-3 divide-x divide-black border-b border-black">
                            <div className="p-4">
                                <SectionRow labelKh="សម្រាប់កាលបរិច្ឆេទ (ខែ)" labelEn="Tax Period (Months)" className="!p-0 !border-0 hover:bg-transparent">
                                    <BoxGridInput length={2} value={data.taxMonths || "12"} onChange={(v) => onChange('taxMonths', v)} />
                                </SectionRow>
                            </div>
                            <div className="p-4">
                                <span className="text-[10px] font-bold uppercase block mb-2">From</span>
                                <BoxGridInput length={8} format="2-2-4" value={data.fromDate || "01012023"} onChange={(v) => onChange('fromDate', v)} />
                            </div>
                            <div className="p-4">
                                <span className="text-[10px] font-bold uppercase block mb-2">Until</span>
                                <BoxGridInput length={8} format="2-2-4" value={data.untilDate || "31122023"} onChange={(v) => onChange('untilDate', v)} />
                            </div>
                        </div>

                        {/* Section 1: Identification */}
                        <div className="bg-slate-50 border-b border-black py-2 px-6">
                            <h3 className="font-bold text-xs uppercase tracking-widest">Section 1: Taxpayer Identification</h3>
                        </div>

                        <SectionRow number="01" labelKh="ឈ្មោះសហគ្រាស" labelEn="Name of Enterprise">
                            <input
                                type="text"
                                value={data.enterpriseName || ""}
                                onChange={(e) => onChange('enterpriseName', e.target.value)}
                                className="w-full bg-transparent border-b border-dotted border-black outline-none font-bold text-lg text-blue-900 uppercase"
                            />
                        </SectionRow>

                        <div className="grid grid-cols-2 divide-x divide-black">
                            <SectionRow number="02" labelKh="អាសយដ្ឋានស្នាក់ការកណ្តាល" labelEn="Registered Headquarters Address" className="!border-b-0">
                                <textarea
                                    value={data.registeredAddress || ""}
                                    onChange={(e) => onChange('registeredAddress', e.target.value)}
                                    className="w-full bg-transparent border-b border-dotted border-black outline-none text-sm font-bold min-h-[60px]"
                                />
                            </SectionRow>
                            <SectionRow number="03" labelKh="សកម្មភាពអាជីវកម្មចម្បង" labelEn="Principal Business Activity" className="!border-b-0">
                                <input
                                    type="text"
                                    value={data.businessActivity || ""}
                                    onChange={(e) => onChange('businessActivity', e.target.value)}
                                    className="w-full bg-transparent border-b border-dotted border-black outline-none text-sm font-bold"
                                />
                            </SectionRow>
                        </div>
                    </div>
                )}

                {activeSheet > 1 && (
                    <div className="border-[3px] border-black flex flex-col items-center justify-center h-[1200px] text-slate-300">
                        <Calculator size={64} className="mb-4 text-slate-100" />
                        <h3 className="text-2xl font-black uppercase tracking-widest text-slate-400">PAGE {activeSheet}</h3>
                        <p className="mt-4 text-slate-400 font-bold">ANNEX CALCULATION SYSTEMS</p>
                        <p className="text-xs text-slate-400 mt-2">Ready for automated computation via GGMT Agent link.</p>
                    </div>
                )}
            </div>

            {/* Footer / Submit */}
            <div className="p-8 border-t border-slate-200 bg-slate-50 flex justify-end gap-4 print:hidden">
                <button
                    onClick={onSubmit}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition active:scale-95"
                >
                    Submit Tax Return
                </button>
            </div>
        </div>
    );
};

export default DynamicForm;
