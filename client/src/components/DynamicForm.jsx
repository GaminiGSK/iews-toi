import React from 'react';
import { Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';

const BoxGridInput = ({ length, value, onChange, format, noDash }) => {
    // Filter out non-alphanumeric chars for display in boxes
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
            // Add segment with small gap
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

const FieldInput = ({ field, value, onChange, error }) => {
    const baseClasses = "w-full bg-transparent border-b border-dotted border-slate-400 focus:border-black outline-none transition-all font-mono text-blue-900 font-bold px-1 text-sm";

    if (field.type === 'boxes') {
        return (
            <div className="flex items-center">
                {field.prefix && <span className="mr-2 text-black text-lg">▶</span>}
                <BoxGridInput length={field.length} value={value} onChange={(val) => onChange(field.key, val)} format={field.format} noDash={field.noDash} />
            </div>
        );
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
                className={`${baseClasses} border border-slate-300 rounded-sm p-2 min-h-[60px] bg-blue-50/30 font-sans`}
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
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                {field.options?.map(opt => (
                    <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                        <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center bg-white relative`}>
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
                            {opt.labelKh && <span className="text-[9px] font-khmer text-black">{opt.labelKh}</span>}
                            <span className={`text-[9px] font-bold uppercase ${value === opt.value ? 'text-black' : 'text-slate-600'}`}>{opt.label}</span>
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

// Reusable Digit Box Group for the Ministry Look
const DigitBoxGroup = ({ value = "", count = 2, highlightIndices = [] }) => {
    const chars = value.toString().replace(/[^0-9]/g, '').padEnd(count, ' ').split('').slice(0, count);
    return (
        <div className="flex gap-1 shrink-0">
            {chars.map((char, i) => (
                <div key={i} className="flex items-center gap-1">
                    <div className="w-7 h-9 bg-white border border-slate-300 rounded-md shadow-sm flex items-center justify-center font-mono font-bold text-lg text-slate-800">
                        {char}
                    </div>
                    {highlightIndices.includes(i) && <span className="text-slate-300 font-bold">/</span>}
                </div>
            ))}
        </div>
    );
};

// Clean Numbered Row for Ministry Style
const NumberedFieldRow = ({ number, labelKh, labelEn, value, onChange, type = "text", placeholder = "", suffix = "" }) => (
    <div className="flex items-start gap-4 py-3 border-b border-slate-100 hover:bg-slate-50/50 transition duration-200">
        <div className="w-8 h-8 shrink-0 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-sm shadow-md mt-1">
            {number}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex flex-col mb-1.5">
                <span className="font-khmer font-bold text-[13px] text-slate-900 leading-tight">{labelKh}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{labelEn}</span>
            </div>
            {type === "text" || type === "number" ? (
                <div className="flex items-center gap-2">
                    <input
                        type={type}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-b-2 border-slate-200 focus:border-blue-600 outline-none font-bold text-lg text-slate-800 py-1 transition-colors"
                    />
                    {suffix && <span className="text-sm font-bold text-slate-400">{suffix}</span>}
                </div>
            ) : null}
        </div>
    </div>
);

const DynamicForm = ({ schema, data, onChange, onSubmit }) => {
    if (!schema) return <div className="p-8 text-center text-slate-500 animate-pulse">Waiting for Schema...</div>;

    return (
        <div className="max-w-[1000px] mx-auto animate-in slide-in-from-bottom-5 fade-in duration-500 pb-20 bg-white text-black shadow-2xl p-8 min-h-[1400px]">

            {/* --- DIGITAL-FIRST HEADER --- */}
            <div className="mb-12 border-b-2 border-slate-900 pb-8">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Kingdom of Cambodia</div>
                        <div className="text-[10px] font-khmer font-bold text-slate-800">ព្រះរាជាណាចក្រកម្ពុជា</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">General Department of Taxation</div>
                        <div className="text-[10px] font-khmer font-bold text-slate-800">អគ្គនាយកដ្ឋានពន្ធដារ</div>
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center gap-2">
                    <h1 className="font-khmer font-bold text-2xl text-slate-900 text-center leading-tight">
                        {schema.title || "លិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ"}
                    </h1>
                    <div className="flex items-center gap-6">
                        <h2 className="font-sans font-black text-sm uppercase text-slate-700 tracking-tight">
                            {schema.titleKh || "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED"}
                        </h2>

                        {/* Interactive Year Boxes */}
                        <div className="flex gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-200">
                            {(() => {
                                const yearStr = (data.taxYear || '2023').toString().replace(/[^0-9]/g, '').slice(-4);
                                let yearChars = yearStr.split('');
                                while (yearChars.length < 4) yearChars.unshift('0');
                                return yearChars.map((char, i) => (
                                    <div key={i} className="w-8 h-10 bg-white border-2 border-slate-900 rounded-md flex items-center justify-center font-mono font-black text-xl text-blue-600 shadow-sm">
                                        {char}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TAX PERIOD ROW (STEP 2) --- */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-10 p-5 bg-slate-50/50 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rotate-45 translate-x-16 -translate-y-16"></div>

                {/* 1. Tax Period (Number of Month) */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="font-khmer font-bold text-xs text-slate-900 leading-tight">ការិយបរិច្ឆេទសារពើពន្ធ ( ចំនួនខែ ) ៖</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Tax Period (Number of Month)</span>
                    </div>
                    <DigitBoxGroup value={data.taxMonths || "12"} count={2} />
                </div>

                {/* Arrow Decor */}
                <div className="hidden md:block text-slate-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>

                {/* 2. From */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="font-khmer font-bold text-xs text-slate-900 leading-tight">ចាប់ពីថ្ងៃទី</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">From</span>
                    </div>
                    <DigitBoxGroup value={data.fromDate || "01012023"} count={8} highlightIndices={[1, 3]} />
                </div>

                {/* 3. Until */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="font-khmer font-bold text-xs text-slate-900 leading-tight">ដល់ថ្ងៃទី</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Until</span>
                    </div>
                    <DigitBoxGroup value={data.untilDate || "31122023"} count={8} highlightIndices={[1, 3]} />
                </div>
            </div>

            {/* --- SECTION 2: ENTERPRISE IDENTIFICATION (STEP 3) --- */}
            <div className="mb-12 space-y-2">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-0.5 flex-1 bg-slate-100"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Identification of Enterprise</span>
                    <div className="h-0.5 flex-1 bg-slate-100"></div>
                </div>

                <NumberedFieldRow
                    number="2"
                    labelKh="ឈ្មោះសហគ្រាស ៖"
                    labelEn="Name of Enterprise"
                    value={data.enterpriseName}
                    onChange={(val) => onChange('enterpriseName', val)}
                />

                <NumberedFieldRow
                    number="3"
                    labelKh="ចំនួនសាខាសហគ្រាស ៖"
                    labelEn="Number of Local Branch"
                    value={data.branchCount}
                    onChange={(val) => onChange('branchCount', val)}
                    type="number"
                />

                {/* Special Date Row for Number 4 */}
                <div className="flex items-start gap-4 py-3 border-b border-slate-100 group transition">
                    <div className="w-8 h-8 shrink-0 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-sm shadow-md mt-1">4</div>
                    <div className="flex-1">
                        <div className="flex flex-col mb-3">
                            <span className="font-khmer font-bold text-[13px] text-slate-900 leading-tight">កាលបរិច្ឆេទចុះបញ្ជីពន្ធដារ ៖</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Date of Tax Registration</span>
                        </div>
                        <DigitBoxGroup value={data.regDate || "01012023"} count={8} highlightIndices={[1, 3]} />
                    </div>
                </div>

                <NumberedFieldRow
                    number="5"
                    labelKh="ឈ្មោះអភិបាល/បណ្ណាធិការ/កម្មសិទ្ធិករ ៖"
                    labelEn="Name of Director/Manager/Owner"
                    value={data.ownerName}
                    onChange={(val) => onChange('ownerName', val)}
                />

                <NumberedFieldRow
                    number="6"
                    labelKh="សកម្មភាពអាជីវកម្មចម្បង ៖"
                    labelEn="Main Business Activities"
                    value={data.businessActivity}
                    onChange={(val) => onChange('businessActivity', val)}
                />

                <NumberedFieldRow
                    number="7"
                    labelKh="ឈ្មោះគណនេយ្យករ/ ភ្នាក់ងារសេវាកម្មពន្ធដារ ៖"
                    labelEn="Name of Accountant/ Tax Service Agent"
                    value={data.accountantName}
                    onChange={(val) => onChange('accountantName', val)}
                />
            </div>


            {/* --- OFFICIAL TABLE BLOCK --- */}
            <div className="border-[1.5px] border-black text-black">
                {schema.sections?.map((section) => (
                    <div key={section.id} className="w-full">
                        {/* Section Header if it exists */}
                        {section.title && (
                            <div className="bg-slate-100 border-b border-black px-2 py-0.5 flex items-center gap-2">
                                {section.number && <span className="font-bold text-xs">{section.number}</span>}
                                <div className="leading-tight">
                                    {section.titleKh && <h3 className="font-khmer text-[10px] font-bold">{section.titleKh}</h3>}
                                    <h3 className="font-bold text-[9px] uppercase">{section.title}</h3>
                                </div>
                            </div>
                        )}

                        {/* Fields Grid */}
                        <div className="grid grid-cols-12 border-b border-black last:border-0 divide-x divide-black">
                            {section.fields?.map((field) => {
                                const spanClass = field.colSpan ? `col-span-${field.colSpan}` : 'col-span-12';
                                const isHorizontal = field.layout === 'horizontal';

                                return (
                                    <div
                                        key={field.key}
                                        className={`${spanClass} flex ${isHorizontal ? 'flex-row items-center px-2 py-0.5' : 'flex-col p-1.5'} min-h-[48px] relative bg-white`}
                                    >
                                        {/* Serial Number Box - Official Style */}
                                        {field.number && (
                                            <div className="absolute top-0 left-0 w-7 h-full border-r border-black font-bold text-[11px] flex items-center justify-center bg-slate-50">
                                                {field.number}
                                            </div>
                                        )}

                                        <div className={`${field.number ? 'ml-8' : 'ml-0.5'} h-full flex ${isHorizontal ? 'flex-row items-center' : 'flex-col'} w-full`}>
                                            {/* Label Area */}
                                            <div className={`flex flex-col leading-tight ${isHorizontal ? 'mr-3' : 'mb-1.5'}`}>
                                                {field.labelKh && <span className="font-khmer text-[11px] block font-bold text-black whitespace-nowrap">{field.labelKh}</span>}
                                                {field.label && <span className="text-[9px] block uppercase font-bold text-slate-700 whitespace-nowrap">{field.label}</span>}
                                            </div>

                                            {/* Input Area */}
                                            <div className={isHorizontal ? 'py-1' : 'mt-auto'}>
                                                <FieldInput
                                                    field={field}
                                                    value={data[field.key]}
                                                    onChange={onChange}
                                                />
                                            </div>
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
                    className="bg-black text-white font-bold px-8 py-2 rounded shadow transition uppercase text-xs tracking-widest"
                >
                    Submit Tax Return
                </button>
            </div>
        </div>
    );
};

export default DynamicForm;
