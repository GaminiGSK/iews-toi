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

// Clean Numbered Row for Ministry Style (Print Version)
const NumberedFieldRow = ({ number, labelKh, labelEn, value, onChange, type = "text", placeholder = "", suffix = "" }) => (
    <div className="flex items-start gap-4 py-3 border-b border-black hover:bg-slate-50/50 transition duration-200 px-4">
        <div className="w-6 h-6 shrink-0 bg-black text-white flex items-center justify-center font-bold text-xs mt-1">
            {number}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex flex-col mb-1.5">
                <span className="font-khmer font-bold text-[13px] text-black leading-tight">{labelKh}</span>
                <span className="text-[10px] font-bold text-black uppercase tracking-tight">{labelEn}</span>
            </div>
            {type === "text" || type === "number" ? (
                <div className="flex items-center gap-2">
                    <input
                        type={type}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-b border-dotted border-slate-400 focus:border-black outline-none font-bold text-lg text-black py-1"
                    />
                    {suffix && <span className="text-sm font-bold text-black">{suffix}</span>}
                </div>
            ) : null}
        </div>
    </div>
);

// Simple Inline Option (Checkbox/Radio) - Replaces "OptionBox"
const OptionItem = ({ labelEn, labelKh, selected, onClick, subText = "" }) => (
    <div
        onClick={onClick}
        className="flex items-start gap-2 cursor-pointer group py-1"
    >
        <div className={`w-4 h-4 shrink-0 border border-black flex items-center justify-center bg-white mt-0.5`}>
            {selected && <div className="w-2.5 h-2.5 bg-black"></div>}
        </div>
        <div className="flex flex-col leading-none">
            <span className="font-khmer font-bold text-[11px] text-black">{labelKh}</span>
            <span className="text-[9px] font-normal text-black uppercase">{labelEn}</span>
            {subText && <span className="text-[10px] text-black font-mono mt-1 border-b border-black inline-block">{subText}</span>}
        </div>
    </div>
);

const DynamicForm = ({ schema, data, onChange, onSubmit }) => {
    const [activeSheet, setActiveSheet] = React.useState(1);

    if (!schema) return <div className="p-8 text-center text-slate-500 animate-pulse">Waiting for Schema...</div>;

    // Generate Array of 25 Pages
    const pages = Array.from({ length: 25 }, (_, i) => i + 1);

    return (
        <div className="max-w-[1200px] mx-auto animate-in slide-in-from-bottom-5 fade-in duration-500 pb-20 bg-slate-50/50 p-4 min-h-[1400px]">

            {/* --- SHEET NAVIGATION TABS (EXCEL STYLE) --- */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0 mb-4 border-b border-slate-300 no-scrollbar">
                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => setActiveSheet(page)}
                        className={`
                            px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg border-x border-t transition-all whitespace-nowrap
                            ${activeSheet === page
                                ? 'bg-white border-slate-300 text-black border-b-white translate-y-[1px] shadow-sm z-10'
                                : 'bg-slate-200 border-slate-300 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }
                        `}
                    >
                        Page {page}
                    </button>
                ))}
            </div>

            {/* --- SHEET CONTENT CONTAINER --- */}
            <div className="bg-white shadow-xl border border-slate-300 min-h-[1200px] p-8 md:p-12 relative">

                {/* --- HEADER (Common for all pages or just Page 1? Keeping on Page 1 for now) --- */}
                {activeSheet === 1 && (
                    <>
                        <div className="mb-12 border-b-2 border-slate-900 pb-4">
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

                            <div className="mt-8 flex flex-col items-center gap-2">
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

                        {/* --- TAX PERIOD ROW (Compact One-Liner) --- */}
                        <div className="flex flex-wrap items-center justify-between px-6 py-4 border border-black border-b-0">
                            {/* 1. Tax Period (Number of Month) */}
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col text-right">
                                    <span className="font-khmer font-bold text-xs text-black leading-tight">ការិយបរិច្ឆេទសារពើពន្ធ <br className="hidden md:block" />(ចំនួនខែ)</span>
                                    <span className="text-[9px] font-bold text-black uppercase tracking-tight hidden md:block">Tax Period (Months)</span>
                                </div>
                                <span className="font-bold text-black px-1">:</span>
                                <DigitBoxGroup value={data.taxMonths || "12"} count={2} />
                            </div>

                            {/* Arrow Decor */}
                            <div className="text-black hidden lg:block">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            </div>

                            {/* 2. From */}
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col text-right">
                                    <span className="font-khmer font-bold text-xs text-black leading-tight">ចាប់ពីថ្ងៃទី</span>
                                    <span className="text-[9px] font-bold text-black uppercase tracking-tight hidden md:block">From</span>
                                </div>
                                <span className="font-bold text-black px-1">:</span>
                                <DigitBoxGroup value={data.fromDate || "01012023"} count={8} highlightIndices={[1, 3]} />
                            </div>

                            {/* 3. Until */}
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col text-right">
                                    <span className="font-khmer font-bold text-xs text-black leading-tight">ដល់ថ្ងៃទី</span>
                                    <span className="text-[9px] font-bold text-black uppercase tracking-tight hidden md:block">Until</span>
                                </div>
                                <span className="font-bold text-black px-1">:</span>
                                <DigitBoxGroup value={data.untilDate || "31122023"} count={8} highlightIndices={[1, 3]} />
                            </div>
                        </div>

                        {/* --- UNIFIED MAIN CONTENT BOX --- */}
                        <div className="border-x border-b border-black">

                            {/* SECTION 2: ENTERPRISE IDENTIFICATION */}
                            <div className="py-2 px-4 border-b border-black bg-slate-50">
                                <h3 className="font-bold text-xs text-black uppercase tracking-widest text-center">Identification of Enterprise</h3>
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
                            <div className="flex items-start gap-4 py-3 border-b border-black px-4 group transition">
                                <div className="w-6 h-6 shrink-0 bg-black text-white flex items-center justify-center font-bold text-xs mt-1">4</div>
                                <div className="flex-1">
                                    <div className="flex flex-col mb-3">
                                        <span className="font-khmer font-bold text-[13px] text-black leading-tight">កាលបរិច្ឆេទចុះបញ្ជីពន្ធដារ ៖</span>
                                        <span className="text-[10px] font-bold text-black uppercase tracking-tight">Date of Tax Registration</span>
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

                            <div className="flex items-start gap-4 py-3 border-b border-black px-4 group transition">
                                <div className="w-6 h-6 shrink-0 border border-black text-black flex items-center justify-center font-bold text-[10px] mt-1">
                                    ID
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col mb-1.5">
                                        <span className="font-khmer font-bold text-[13px] text-black leading-tight">លេខសម្គាល់ភ្នាក់ងារសេវាកម្មពន្ធដារ ៖</span>
                                        <span className="text-[10px] font-bold text-black uppercase tracking-tight">Tax Service Agent License Number</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={data.agentLicenseNumber || ""}
                                        onChange={(e) => onChange('agentLicenseNumber', e.target.value)}
                                        className="w-full bg-transparent border-b border-dotted border-slate-400 focus:border-black outline-none font-bold text-lg text-black py-1"
                                    />
                                </div>
                            </div>

                            {/* SECTION 3: COMPLIANCE & LEGAL */}
                            <div className="py-2 px-4 border-b border-black bg-slate-50">
                                <h3 className="font-bold text-xs text-black uppercase tracking-widest text-center">Accounting & Compliance</h3>
                            </div>

                            {/* 11. Accounting Records */}
                            <div className="px-4 border-b border-black py-4">
                                <div className="flex flex-col mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs">11</div>
                                        <span className="font-khmer font-bold text-[13px] text-black">ការកត់ត្រាបញ្ជីគណនេយ្យ ៖</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-black uppercase ml-8">Accounting Records</span>
                                </div>
                                <div className="flex gap-8 ml-8">
                                    <OptionItem
                                        labelKh="ប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ (ឈ្មោះកម្មវិធី) ៖"
                                        labelEn="Using Accounting Software"
                                        selected={data.accountingType === 'software'}
                                        onClick={() => onChange('accountingType', 'software')}
                                        subText={data.accountingType === 'software' ? data.softwareName : ""}
                                    />
                                    <OptionItem
                                        labelKh="មិនប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ"
                                        labelEn="Not Using Accounting Software"
                                        selected={data.accountingType === 'manual'}
                                        onClick={() => onChange('accountingType', 'manual')}
                                    />
                                </div>
                            </div>

                            {/* 12 & 13 Split Row */}
                            <div className="grid grid-cols-2 border-b border-black divide-x divide-black">
                                {/* 12. Tax Compliance */}
                                <div className="p-4">
                                    <div className="flex flex-col mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs">12</div>
                                            <span className="font-khmer font-bold text-[13px] text-black">កម្រិតអនុលោមភាពសារពើពន្ធ ៖</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-black uppercase ml-8">Status of Tax Compliance</span>
                                    </div>
                                    <div className="flex gap-4 ml-8">
                                        {['Gold', 'Silver', 'Bronze'].map(level => (
                                            <OptionItem
                                                key={level}
                                                labelKh={level === 'Gold' ? "មាស" : level === 'Silver' ? "ប្រាក់" : "សំរឹទ្ធ"}
                                                labelEn={level}
                                                selected={data.taxCompliance === level}
                                                onClick={() => onChange('taxCompliance', level)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* 13. Statutory Audit */}
                                <div className="p-4">
                                    <div className="flex flex-col mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs">13</div>
                                            <span className="font-khmer font-bold text-[13px] text-black">សវនកម្មឯករាជ្យដែលតម្រូវដោយច្បាប់ ៖</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-black uppercase ml-8">Statutory Audit Requirement</span>
                                    </div>
                                    <div className="flex gap-4 ml-8">
                                        <OptionItem
                                            labelKh="តម្រូវ"
                                            labelEn="REQUIRED"
                                            selected={data.auditRequired === true}
                                            onClick={() => onChange('auditRequired', true)}
                                        />
                                        <OptionItem
                                            labelKh="មិនតម្រូវ"
                                            labelEn="NOT REQUIRED"
                                            selected={data.auditRequired === false}
                                            onClick={() => onChange('auditRequired', false)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 14. Legal Form Grid */}
                            <div className="p-4">
                                <div className="flex flex-col mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs">14</div>
                                        <span className="font-khmer font-bold text-[13px] text-black">ទម្រង់គតិយុត្តិ / ទម្រង់នៃប្រតិបត្តិការអាជីវកម្ម ៖</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-black uppercase ml-8">Legal Form or Form of Business Operations</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 ml-8">
                                    {[
                                        { id: 'sole', kh: 'សហគ្រាសឯកបុគ្គល/រូបវន្តបុគ្គល', en: 'Sole Proprietorship / Physical Person' },
                                        { id: 'general_partnership', kh: 'ក្រុមហ៊ុនសហកម្មសិទ្ធិទូទៅ', en: 'General Partnership' },
                                        { id: 'limited_partnership', kh: 'ក្រុមហ៊ុនសហកម្មសិទ្ធិមានកម្រិត', en: 'Limited Partnership' },
                                        { id: 'single_member_plc', kh: 'សហគ្រាសឯកបុគ្គលទទួលខុសត្រូវមានកម្រិត', en: 'Single Member Private Ltd.' },
                                        { id: 'private_limited', kh: 'ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិត', en: 'Private Limited Company' },
                                        { id: 'public_limited', kh: 'ក្រុមហ៊ុនមហាជនទទួលខុសត្រូវមានកម្រិត', en: 'Public Limited Company' },
                                        { id: 'joint_venture_interest', kh: 'ផលប្រយោជន៍ក្នុងសម្ព័ន្ធអាជីវកម្ម', en: 'Interest in Joint Venture' },
                                        { id: 'public_enterprise', kh: 'សហគ្រាសសាធារណៈ', en: 'Public Enterprise' },
                                        { id: 'state_enterprise', kh: 'សហគ្រាសរដ្ឋ', en: 'State Enterprise' },
                                        { id: 'state_joint_venture', kh: 'ក្រុមហ៊ុនចម្រុះរដ្ឋ', en: 'State Joint Venture' },
                                        { id: 'foreign_branch', kh: 'សាខាក្រុមហ៊ុនបរទេស', en: 'Foreign Company\'s Branch' },
                                        { id: 'representative_office', kh: 'ការិយាល័យតំណាង', en: 'Representative Office' },
                                        { id: 'ngo', kh: 'អង្គការក្រៅរដ្ឋាភិបាល / សមាគម', en: 'Non-Government Org. / Association' },
                                        { id: 'others', kh: 'សហគ្រាសដទៃទៀត', en: 'Others' },
                                    ].map((opt) => (
                                        <OptionItem
                                            key={opt.id}
                                            labelKh={opt.kh}
                                            labelEn={opt.en}
                                            selected={data.legalForm === opt.id}
                                            onClick={() => onChange('legalForm', opt.id)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* SECTION 4: EXEMPTIONS & RATES */}
                            <div className="py-2 px-4 border-y border-black bg-slate-50">
                                <h3 className="font-bold text-xs text-black uppercase tracking-widest text-center">Exemptions & Tax Rates</h3>
                            </div>

                            {/* 15. Income Tax Exemption */}
                            <div className="p-4 border-b border-black">
                                <div className="flex flex-col mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs">15</div>
                                        <span className="font-khmer font-bold text-[13px] text-black">លើកលែងពន្ធលើប្រាក់ចំណូល ៖</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-black uppercase ml-8">Income Tax Exemption</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-8">
                                    <div>
                                        <label className="block text-[10px] font-bold text-black mb-1 leading-tight">ឆ្នាំមានផលរបរដំបូង ៖<br /><span className="text-[8px] uppercase">Year of First Revenue</span></label>
                                        <DigitBoxGroup value={data.yearFirstRevenue} count={4} onChange={(v) => onChange('yearFirstRevenue', v)} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-black mb-1 leading-tight">ឆ្នាំមានចំណេញដំបូង ៖<br /><span className="text-[8px] uppercase">Year of First Profit</span></label>
                                        <DigitBoxGroup value={data.yearFirstProfit} count={4} onChange={(v) => onChange('yearFirstProfit', v)} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-black mb-1 leading-tight">រយៈពេលអាទិភាព ៖<br /><span className="text-[8px] uppercase">Priority Period</span></label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={data.priorityPeriod || ""}
                                                onChange={(e) => onChange('priorityPeriod', e.target.value)}
                                                placeholder="Years"
                                                className="w-20 bg-transparent border-b border-dotted border-slate-500 px-2 py-1 font-bold text-center text-black"
                                            />
                                            <span className="text-[10px] font-bold text-black">YEARS</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 16. Income Tax Rate */}
                            <div className="p-4 border-b border-black">
                                <div className="flex flex-col mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs">16</div>
                                        <span className="font-khmer font-bold text-[13px] text-black">អត្រាពន្ធលើប្រាក់ចំណូល ៖</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-black uppercase ml-8">Income Tax Rate</span>
                                </div>

                                <div className="flex flex-wrap gap-8 ml-8">
                                    {[
                                        { label: '30%', id: '30' },
                                        { label: '20%', id: '20' },
                                        { label: '5%', id: '5' },
                                        { label: '0%', id: '0' },
                                        { label: '0-20%', id: '0-20' },
                                        { label: 'Progressive Rate', id: 'progressive' }
                                    ].map((rate) => (
                                        <OptionItem
                                            key={rate.id}
                                            labelKh=""
                                            labelEn={rate.label}
                                            selected={data.taxRate === rate.id}
                                            onClick={() => onChange('taxRate', rate.id)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* 17 & 18 Financial Row */}
                            <div className="grid grid-cols-2 divide-x divide-black border-black">
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs">17</div>
                                        <span className="font-khmer font-bold text-[12px] text-black">ពន្ធលើប្រាក់ចំណូលត្រូវបង់ ៖</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={data.taxDue || ""}
                                            onChange={(e) => onChange('taxDue', e.target.value)}
                                            className="w-full bg-transparent border-b border-dotted border-black outline-none font-mono font-bold text-xl text-black py-1"
                                        />
                                        <span className="text-sm font-bold text-black">KHR</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-black uppercase">Income Tax Due</span>
                                </div>

                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs">18</div>
                                        <span className="font-khmer font-bold text-[12px] text-black">ឥណទានពន្ធយោងទៅមុខ ៖</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={data.taxCreditForward || ""}
                                            onChange={(e) => onChange('taxCreditForward', e.target.value)}
                                            className="w-full bg-transparent border-b border-dotted border-black outline-none font-mono font-bold text-xl text-black py-1"
                                        />
                                        <span className="text-sm font-bold text-black">KHR</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-black uppercase">Tax Credit Carried Forward</span>
                                </div>
                            </div>
                        </div>


                        {/* --- OFFICIAL TABLE BLOCK --- */}
                        <div className="border border-t-0 border-black text-black">
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
                    </>
                )}

                {/* --- PLACEHOLDER FOR PAGES 2-25 --- */}
                {activeSheet > 1 && (
                    <div className="flex flex-col items-center justify-center h-[600px] text-slate-400">
                        <Calculator size={64} className="mb-4 text-slate-200" />
                        <h3 className="text-xl font-bold text-slate-500 uppercase tracking-widest">Page {activeSheet}</h3>
                        <p className="text-sm mt-2">Ready for Annex or Calculation Table</p>
                        <p className="text-xs text-slate-300 mt-1 italic">Ask the BA Assistant to generate content for this page.</p>
                    </div>
                )}
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
