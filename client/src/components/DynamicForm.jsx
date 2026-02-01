import React from 'react';
import { Calculator, AlertCircle, CheckCircle2, CheckCircle } from 'lucide-react';

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

// New Selection Box for Checkboxes/Radio
const OptionBox = ({ labelEn, labelKh, selected, onClick, subText = "" }) => (
    <div
        onClick={onClick}
        className={`flex-1 flex gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer group ${selected
            ? 'border-blue-600 bg-blue-50/50 shadow-md'
            : 'border-slate-100 bg-white hover:border-slate-300'
            }`}
    >
        <div className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${selected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'
            }`}>
            {selected && <div className="w-2 h-2 bg-white rounded-full"></div>}
        </div>
        <div className="flex flex-col min-w-0">
            <span className="font-khmer font-bold text-[11px] text-slate-900 leading-tight">{labelKh}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{labelEn}</span>
            {subText && <span className="text-[10px] text-blue-600 font-mono mt-1">{subText}</span>}
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
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-4 p-5 relative overflow-hidden">
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
            <div className="mb-8 space-y-0 border-t border-slate-200 pt-4">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-4">Identification of Enterprise</h3>

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

                <NumberedFieldRow
                    number="8"
                    labelKh="អាសយដ្ឋានទីស្នាក់ការសហគ្រាសបច្ចុប្បន្ន ៖"
                    labelEn="Current Registered Office Address"
                    value={data.registeredAddress}
                    onChange={(val) => onChange('registeredAddress', val)}
                />

                <NumberedFieldRow
                    number="9"
                    labelKh="អាសយដ្ឋានគ្រឹះស្ថានជាគោលដើមបច្ចុប្បន្ន ៖"
                    labelEn="Current Principal Establishment Address"
                    value={data.principalAddress}
                    onChange={(val) => onChange('principalAddress', val)}
                />

                <NumberedFieldRow
                    number="10"
                    labelKh="អាសយដ្ឋានឃ្លាំងបច្ចុប្បន្ន ៖"
                    labelEn="Warehouse Address"
                    value={data.warehouseAddress}
                    onChange={(val) => onChange('warehouseAddress', val)}
                />

                <div className="flex items-start gap-4 py-3 border-b border-slate-100 group transition">
                    <div className="w-8 h-8 shrink-0 bg-slate-100 text-slate-900 rounded-lg flex items-center justify-center font-bold text-[10px] mt-1">
                        ID
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col mb-1.5">
                            <span className="font-khmer font-bold text-[13px] text-slate-900 leading-tight">លេខសម្គាល់ភ្នាក់ងារសេវាកម្មពន្ធដារ ៖</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Tax Service Agent License Number</span>
                        </div>
                        <input
                            type="text"
                            value={data.agentLicenseNumber || ""}
                            onChange={(e) => onChange('agentLicenseNumber', e.target.value)}
                            className="w-full bg-transparent border-b-2 border-slate-100 focus:border-blue-500 outline-none font-mono font-bold text-lg text-slate-700 py-1 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: COMPLIANCE & LEGAL (Fields 11-14) --- */}
            <div className="space-y-6 mb-8 border-t border-slate-200 pt-8">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-4">Accounting & Compliance</h3>

                {/* 11. Accounting Records */}
                <div className="p-0 rounded-none border-b border-slate-100 pb-6">
                    <div className="flex flex-col mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-[10px]">11</div>
                            <span className="font-khmer font-bold text-[13px]">ការកត់ត្រាបញ្ជីគណនេយ្យ ៖</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-8">Accounting Records</span>
                    </div>
                    <div className="flex gap-4 ml-8">
                        <OptionBox
                            labelKh="ប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ (ឈ្មោះកម្មវិធី) ៖"
                            labelEn="Using Accounting Software (Software's Name)"
                            selected={data.accountingType === 'software'}
                            onClick={() => onChange('accountingType', 'software')}
                            subText={data.accountingType === 'software' ? data.softwareName : ""}
                        />
                        <OptionBox
                            labelKh="មិនប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ"
                            labelEn="Not Using Accounting Software"
                            selected={data.accountingType === 'manual'}
                            onClick={() => onChange('accountingType', 'manual')}
                        />
                    </div>
                </div>

                {/* 12 & 13 Split Row */}
                <div className="grid grid-cols-2 gap-6 border-b border-slate-100 pb-6">
                    {/* 12. Tax Compliance */}
                    <div className="p-0">
                        <div className="flex flex-col mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-[10px]">12</div>
                                <span className="font-khmer font-bold text-[13px]">កម្រិតអនុលោមភាពសារពើពន្ធ ៖</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase ml-8">Status of Tax Compliance</span>
                        </div>
                        <div className="flex gap-2 ml-8">
                            {['Gold', 'Silver', 'Bronze'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => onChange('taxCompliance', level)}
                                    className={`px-3 py-1.5 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest transition-all ${data.taxCompliance === level
                                        ? 'bg-slate-900 border-slate-900 text-white scale-105'
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 13. Statutory Audit */}
                    <div className="p-0">
                        <div className="flex flex-col mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-[10px]">13</div>
                                <span className="font-khmer font-bold text-[13px]">សវនកម្មឯករាជ្យដែលតម្រូវដោយច្បាប់ ៖</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase ml-8">Statutory Audit Requirement</span>
                        </div>
                        <div className="flex gap-3 ml-8">
                            <button
                                onClick={() => onChange('auditRequired', true)}
                                className={`flex-1 py-2 rounded-xl border-2 text-[11px] font-bold transition-all ${data.auditRequired ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-500'}`}
                            >
                                REQUIRED
                            </button>
                            <button
                                onClick={() => onChange('auditRequired', false)}
                                className={`flex-1 py-2 rounded-xl border-2 text-[11px] font-bold transition-all ${data.auditRequired === false ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-500'}`}
                            >
                                NOT REQUIRED
                            </button>
                        </div>
                    </div>
                </div>

                {/* 14. Legal Form Grid */}
                <div className="p-0">
                    <div className="flex flex-col mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-[10px]">14</div>
                            <span className="font-khmer font-bold text-[13px]">ទម្រង់គតិយុត្តិ / ទម្រង់នៃប្រតិបត្តិការអាជីវកម្ម ៖</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-8">Legal Form or Form of Business Operations</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-8">
                        {[
                            { id: 'sole', kh: 'សហគ្រាសឯកបុគ្គល/រូបវន្តបុគ្គល', en: 'Sole Proprietorship / Physical Person' },
                            { id: 'general_partnership', kh: 'ក្រុមហ៊ុនសហកម្មសិទ្ធិទូទៅ', en: 'General Partnership' },
                            { id: 'limited_partnership', kh: 'ក្រុមហ៊ុនសហកម្មសិទ្ធិមានកម្រិត', en: 'Limited Partnership' },
                            { id: 'single_member_plc', kh: 'សហគ្រាសឯកបុគ្គលទទួលខុសត្រូវមានកម្រិត', en: 'Single Member Private Limited Company' },
                            { id: 'private_limited', kh: 'ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិត', en: 'Private Limited Company' },
                            { id: 'public_limited', kh: 'ក្រុមហ៊ុនមហាជនទទួលខុសត្រូវមានកម្រិត', en: 'Public Limited Company' },
                            { id: 'joint_venture_interest', kh: 'ផលប្រយោជន៍ក្នុងសម្ព័ន្ធអាជីវកម្ម', en: 'Interest in Joint Venture' },
                            { id: 'public_enterprise', kh: 'សហគ្រាសសាធារណៈ', en: 'Public Enterprise' },
                            { id: 'state_enterprise', kh: 'សហគ្រាសរដ្ឋ', en: 'State Enterprise' },
                            { id: 'state_joint_venture', kh: 'ក្រុមហ៊ុនចម្រុះរដ្ឋ', en: 'State Joint Venture' },
                            { id: 'foreign_branch', kh: 'សាខាក្រុមហ៊ុនបរទេស', en: 'Foreign Company\'s Branch' },
                            { id: 'representative_office', kh: 'ការិយាល័យតំណាង', en: 'Representative Office' },
                            { id: 'ngo', kh: 'អង្គការក្រៅរដ្ឋាភិបាល / សមាគម', en: 'Non-Government Organization / Association' },
                            { id: 'others', kh: 'សហគ្រាសដទៃទៀត', en: 'Others' },
                        ].map((opt) => (
                            <OptionBox
                                key={opt.id}
                                labelKh={opt.kh}
                                labelEn={opt.en}
                                selected={data.legalForm === opt.id}
                                onClick={() => onChange('legalForm', opt.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* --- SECTION 4: EXEMPTIONS & RATES (Fields 15-18) --- */}
            <div className="space-y-6 mb-8 border-t border-slate-200 pt-8">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-4">Exemptions & Tax Rates</h3>

                {/* 15. Income Tax Exemption */}
                <div className="p-0 border-b border-slate-100 pb-6">
                    <div className="flex flex-col mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-[10px]">15</div>
                            <span className="font-khmer font-bold text-[13px]">លើកលែងពន្ធលើប្រាក់ចំណូល ៖</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-8">Income Tax Exemption</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-8">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 leading-tight">ឆ្នាំមានផលរបរដំបូង ៖<br /><span className="text-[8px] uppercase">Year of First Revenue</span></label>
                            <DigitBoxGroup value={data.yearFirstRevenue} count={4} onChange={(v) => onChange('yearFirstRevenue', v)} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 leading-tight">ឆ្នាំមានចំណេញដំបូង ៖<br /><span className="text-[8px] uppercase">Year of First Profit</span></label>
                            <DigitBoxGroup value={data.yearFirstProfit} count={4} onChange={(v) => onChange('yearFirstProfit', v)} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 leading-tight">រយៈពេលអាទិភាព ៖<br /><span className="text-[8px] uppercase">Priority Period</span></label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={data.priorityPeriod || ""}
                                    onChange={(e) => onChange('priorityPeriod', e.target.value)}
                                    placeholder="Years"
                                    className="w-20 bg-white border-2 border-slate-200 rounded-lg px-2 py-1 font-bold text-center"
                                />
                                <span className="text-[10px] font-bold text-slate-400">YEARS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 16. Income Tax Rate */}
                <div className="p-0 border-b border-slate-100 pb-6">
                    <div className="flex flex-col mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-[10px]">16</div>
                            <span className="font-khmer font-bold text-[13px]">អត្រាពន្ធលើប្រាក់ចំណូល ៖</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-8">Income Tax Rate</span>
                    </div>

                    <div className="flex flex-wrap gap-3 ml-8">
                        {[
                            { label: '30%', id: '30' },
                            { label: '20%', id: '20' },
                            { label: '5%', id: '5' },
                            { label: '0%', id: '0' },
                            { label: '0-20%', id: '0-20' },
                            { label: 'Progressive Rate', id: 'progressive' }
                        ].map((rate) => (
                            <button
                                key={rate.id}
                                onClick={() => onChange('taxRate', rate.id)}
                                className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${data.taxRate === rate.id
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                            >
                                {rate.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 17 & 18 Financial Row */}
                <div className="grid grid-cols-2 gap-6 ml-8">
                    <div className="p-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-[10px]">17</div>
                            <span className="font-khmer font-bold text-[12px] text-slate-900">ពន្ធលើប្រាក់ចំណូលត្រូវបង់ ៖</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={data.taxDue || ""}
                                onChange={(e) => onChange('taxDue', e.target.value)}
                                className="w-full bg-transparent border-b-2 border-slate-200 focus:border-slate-900 outline-none font-mono font-bold text-xl text-slate-900 py-1"
                            />
                            <span className="text-sm font-bold text-slate-400">KHR</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Income Tax Due</span>
                    </div>

                    <div className="p-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center font-black text-[10px]">18</div>
                            <span className="font-khmer font-bold text-[12px] text-slate-900">ឥណទានពន្ធយោងទៅមុខ ៖</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={data.taxCreditForward || ""}
                                onChange={(e) => onChange('taxCreditForward', e.target.value)}
                                className="w-full bg-transparent border-b-2 border-slate-200 focus:border-slate-900 outline-none font-mono font-bold text-xl text-slate-900 py-1"
                            />
                            <span className="text-sm font-bold text-slate-400">KHR</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Tax Credit Carried Forward</span>
                    </div>
                </div>
            </div>

            {/* --- DECLARATION SECTION --- */}
            <div className="mt-12 p-8 bg-slate-900 rounded-3xl text-white">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <CheckCircle2 className="text-emerald-400" size={24} />
                    </div>
                    <div className="space-y-4 flex-1">
                        <h3 className="font-khmer text-xl font-bold leading-tight decoration-emerald-500/30 underline underline-offset-8">សេចក្តីប្រកាស / DECLARATION</h3>
                        <p className="font-khmer text-[13px] text-slate-300 leading-relaxed text-justify">
                            យើងខ្ញុំបានពិនិត្យគ្រប់ចំណុចទាំងអស់នៅលើលិខិតប្រកាសនេះ និងតារាងឧបសម្ព័ន្ធភ្ជាប់ជាមួយ។ យើងខ្ញុំមានសក្ខីប័ត្រប៉ញ្ជាក់ច្បាស់លាស់ ត្រឹមត្រូវ ពេញលេញ ដែលធានាបានថា ព័ត៌មានទាំងអស់ នៅលើលិខិតប្រកាសពិតជាត្រឹមត្រូវប្រាកដមែន ហើយគ្មានប្រតិបត្តិការណាមួយមិនបានប្រកាសនោះទេ។ យើងខ្ញុំសូមទទួលខុសត្រូវទាំងស្រុងចំពោះមុខច្បាប់ទាំងឡាយជាធរមានប្រសិនបើព័ត៌មានណាមួយមានការក្លែងបន្លំ។
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-4 uppercase font-bold tracking-tight text-justify">
                            We have examined all items on this return and the annex attached herewith. We have correct, and complete supporting documents which ensure that all information in this return is true and accurate and there is no undeclared business transaction. We are lawfully responsible for any falsified information.
                        </p>
                    </div>
                </div>
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
