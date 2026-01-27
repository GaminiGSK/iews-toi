import React from 'react';
import { Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';

const BoxGridInput = ({ length, value, onChange, format }) => {
    const chars = (value || '').toString().split('');

    const handleChange = (index, char) => {
        const newVal = [...chars];
        // Ensure newVal has enough length
        while (newVal.length < length) newVal.push('');
        newVal[index] = char.slice(-1);
        onChange(newVal.join(''));

        // Auto focus next box
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

    // Split length into segments if format exists (e.g. "3-9" for TIN)
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
                        className="w-7 h-8 border border-black text-center font-serif font-bold text-lg bg-white focus:bg-blue-50 outline-none"
                    />
                );
            }
            renderedBoxes.push(<div key={`seg-${pIdx}`} className="flex gap-[-1px]">{segment}</div>);
            if (pIdx < parts.length - 1) {
                renderedBoxes.push(<span key={`dash-${pIdx}`} className="mx-1 font-bold">-</span>);
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
                    className="w-7 h-8 border border-black text-center font-serif font-bold text-lg bg-white focus:bg-blue-50 outline-none"
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

const FieldInput = ({ field, value, onChange, error }) => {
    // Official Paper Input Style (Transparent with bottom border or box)
    const baseClasses = "w-full bg-transparent border-b border-dotted border-slate-400 focus:border-blue-600 outline-none transition-all font-mono text-blue-900 font-bold px-1";

    if (field.type === 'boxes') {
        return <BoxGridInput length={field.length} value={value} onChange={(val) => onChange(field.key, val)} format={field.format} />;
    }

    if (field.type === 'currency') {
        return (
            <div className="relative group">
                <span className="absolute left-0 top-1 text-slate-500 font-bold">$</span>
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(field.key, parseFloat(e.target.value) || 0)}
                    className={`${baseClasses} pl-4 text-right`}
                    placeholder="0.00"
                    readOnly={field.readOnly}
                />
            </div>
        );
    }

    if (field.type === 'textarea') {
        return (
            <textarea
                value={value || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                className={`${baseClasses} border border-slate-300 rounded-sm p-2 min-h-[60px] bg-blue-50/30`}
                placeholder={field.placeholder}
            />
        );
    }

    if (field.type === 'select') {
        return (
            <div className="relative">
                <select
                    value={value || ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className={`${baseClasses}`}
                >
                    <option value="">Select...</option>
                    {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        );
    }

    // Checkbox Group (Official Paper Style)
    if (field.type === 'checkbox-group') {
        return (
            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-1">
                {field.options?.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer group hover:bg-blue-50 p-1 rounded">
                        <div className={`w-4 h-4 border border-slate-800 flex items-center justify-center transition-all bg-white relative`}>
                            {value === opt.value && <div className="absolute inset-0.5 bg-black"></div>}
                        </div>
                        <input
                            type="radio"
                            name={field.key}
                            value={opt.value}
                            checked={value === opt.value}
                            onChange={() => onChange(field.key, opt.value)}
                            className="hidden"
                        />
                        <div className="flex flex-col leading-none">
                            {opt.labelKh && <span className="text-[10px] font-khmer text-slate-800">{opt.labelKh}</span>}
                            <span className={`text-[11px] font-bold uppercase ${value === opt.value ? 'text-black' : 'text-slate-600'}`}>{opt.label}</span>
                        </div>
                    </label>
                ))}
            </div>
        );
    }

    // Default Text
    return (
        <input
            type={field.type || 'text'}
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={`${baseClasses} ${field.className || ''}`}
            placeholder={field.placeholder}
            readOnly={field.readOnly}
        />
    );
};

const DynamicForm = ({ schema, data, onChange, onSubmit }) => {
    if (!schema) return <div className="p-8 text-center text-slate-500 animate-pulse">Waiting for Schema...</div>;

    return (
        <div className="max-w-[1000px] mx-auto animate-in slide-in-from-bottom-5 fade-in duration-500 pb-20 bg-white text-black shadow-2xl p-8 min-h-[1400px]">

            {/* --- OFFICIAL HEADER (REPLICA) --- */}
            <div className="relative mb-8 font-serif">
                {/* Form Code Top Left - Moved outside flow to prevent overlap */}
                <div className="absolute -top-10 -left-6 font-bold text-xl tracking-wide font-serif text-black">TOI 01 / I</div>

                <div className="flex justify-between items-start mt-12 px-0">
                    {/* Left Column: Ministry & Dept */}
                    <div className="flex flex-col items-center w-[35%] text-center">
                        <h3 className="font-khmer font-bold text-xs mb-1.5 leading-relaxed">ក្រសួងសេដ្ឋកិច្ចនិងហិរញ្ញវត្ថុ</h3>
                        <h4 className="font-serif font-bold text-[11px] uppercase border-b-2 border-black pb-1 mb-2 w-full max-w-[260px] tracking-wide leading-none">MINISTRY OF ECONOMY AND FINANCE</h4>

                        <h3 className="font-khmer font-bold text-xs mb-1.5 leading-relaxed">អគ្គនាយកដ្ឋានពន្ធដារ</h3>
                        <h4 className="font-serif font-bold text-[11px] uppercase mb-6 w-full max-w-[260px] tracking-wide leading-none">GENERAL DEPARTMENT OF TAXATION</h4>

                        {/* Form Name Box - No Shadow */}
                        <div className="border-[2.5px] border-black px-4 py-2 bg-slate-50 relative ml-4">
                            <h3 className="font-khmer font-bold text-sm text-black leading-none mb-1">ទម្រង់ ពបច ០១ / FORM TOI 01</h3>
                        </div>
                        <p className="font-khmer text-[9px] mt-4 leading-none text-slate-800">(មាត្រា ២៩ ថ្មី នៃច្បាប់ស្តីពីសារពើពន្ធ )</p>
                        <p className="font-serif text-[10px] italic leading-none text-slate-800 mt-1">(Article 29 New of the Law on Taxation)</p>
                    </div>

                    {/* Center Column: Logo */}
                    <div className="w-[30%] flex flex-col items-center justify-start -mt-4">
                        <img
                            src="/assets/gdt_seal.png"
                            alt="GDT Seal"
                            className="w-60 h-60 object-contain mix-blend-multiply"
                        />
                    </div>

                    {/* Right Column: Kingdom */}
                    <div className="flex flex-col items-center w-[35%] text-center pt-2">
                        <h3 className="font-khmer font-bold text-sm mb-1.5 text-black">ព្រះរាជាណាចក្រកម្ពុជា</h3>
                        <h4 className="font-serif font-bold text-sm uppercase mb-3 text-black tracking-[0.2em]">KINGDOM OF CAMBODIA</h4>

                        <h3 className="font-khmer font-bold text-xs mb-1.5 text-black">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
                        <h4 className="font-serif font-bold text-[10px] uppercase mb-2 text-black tracking-[0.2em]">NATION RELIGION KING</h4>

                        {/* Decorative Divider - Classical Style */}
                        <div className="flex items-center gap-2 opacity-90 mt-2">
                            {/* Using text-based classic divider replication */}
                            <div className="text-black font-serif tracking-tighter text-xs">
                                ══════ ❖ ══════
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Title Area */}
                <div className="text-center mt-10">
                    <h1 className="font-khmer font-bold text-xl mb-2 text-black tracking-wide">{schema.title || "លិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ"}</h1>
                    <div className="flex items-end justify-center gap-4 relative">
                        <h2 className="font-bold text-lg uppercase translate-y-1 text-black text-shadow-sm">{schema.titleKh || "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED"}</h2>

                        {/* The 4 Year Boxes Replica - Dynamic Fill */}
                        <div className="flex gap-1 ml-2 mb-0.5">
                            {(() => {
                                // Extract Year from taxYear string (Assuming DD-MM-YYYY or YYYY)
                                let yearChars = ['', '', '', ''];
                                if (data.taxYear) {
                                    const match = data.taxYear.match(/(\d{4})/);
                                    if (match) {
                                        yearChars = match[0].split('');
                                    } else if (data.taxYear.length === 4) {
                                        yearChars = data.taxYear.split('');
                                    }
                                }

                                return yearChars.map((char, i) => (
                                    <div key={i} className="w-8 h-9 border-2 border-black bg-white shadow-sm flex items-center justify-center font-mono font-bold text-xl">
                                        {char}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>


            {/* SECTIONS AS OFFICIAL TABLES */}
            <div className="border border-black bg-white">
                {schema.sections?.map((section, idx) => (
                    <div key={section.id} className={`${idx > 0 ? 'border-t border-black' : ''}`}>

                        {/* Section Header */}
                        {section.title && (
                            <div className="bg-slate-100 border-b border-black px-2 py-1 flex items-center gap-2">
                                {section.number && <span className="bg-black text-white font-bold px-1.5 py-0.5 text-xs rounded-sm">{section.number}</span>}
                                <div className="leading-tight">
                                    {section.titleKh && <h3 className="font-khmer text-xs text-black font-bold">{section.titleKh}</h3>}
                                    <h3 className="font-bold text-black text-[10px] uppercase">{section.title}</h3>
                                </div>
                            </div>
                        )}

                        {/* Grid */}
                        <div className="grid grid-cols-12 divide-x divide-black"> {/* Vertical Dividers */}
                            {section.fields?.map((field) => {
                                const spanClass = field.colSpan ? `col-span-${field.colSpan}` : 'col-span-12';

                                return (
                                    <div key={field.key} className={`${spanClass} p-2 border-b border-black flex flex-col justify-start relative min-h-[60px] hover:bg-blue-50/50 transition-colors`}>

                                        {/* Label Area */}
                                        <div className="mb-1">
                                            {/* Field Number */}
                                            {field.number && (
                                                <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black text-white text-[10px] flex items-center justify-center font-bold">
                                                    {field.number}
                                                </div>
                                            )}

                                            <div className={`${field.number ? 'pl-7' : ''} leading-tight`}>
                                                {field.labelKh && <p className="font-khmer text-[11px] text-black font-medium">{field.labelKh}</p>}
                                                <p className="font-bold text-[9px] text-slate-800 uppercase">{field.label}</p>
                                            </div>
                                        </div>

                                        {/* Input Area */}
                                        <div className="mt-1">
                                            <FieldInput
                                                field={field}
                                                value={data[field.key]}
                                                onChange={onChange}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-8 gap-4 print:hidden">
                <button
                    onClick={onSubmit}
                    className="bg-slate-900 hover:bg-black text-white font-bold px-8 py-3 rounded shadow-lg transition uppercase tracking-wider text-sm"
                >
                    Save Draft Return
                </button>
            </div>
        </div>
    );
};

export default DynamicForm;
