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
    // Allow A-Z and 0-9, uppercase
    const chars = value.toString().toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(count, ' ').split('').slice(0, count);
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
        <div className="max-w-[1400px] mx-auto animate-in slide-in-from-bottom-5 fade-in duration-500 pb-10 bg-white text-black shadow-xl p-6 min-h-[900px]">

            {/* --- COMPACT DIGITAL-FIRST HEADER --- */}
            <div className="mb-6 border-b border-slate-900 pb-4">
                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-0.5">
                        <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Kingdom of Cambodia</div>
                        <div className="text-[10px] font-khmer font-bold text-slate-800">ព្រះរាជាណាចក្រកម្ពុជា</div>
                    </div>

                    <div className="flex flex-col items-center">
                        <h1 className="font-khmer font-bold text-lg text-slate-900 leading-tight">
                            {schema.title || "លិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ"}
                        </h1>
                        <div className="flex items-center gap-2">
                            <h2 className="font-sans font-black text-xs uppercase text-slate-700 tracking-tight">
                                {schema.titleKh || "ANNUAL INCOME TAX RETURN"}
                            </h2>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">General Department of Taxation</div>
                        <div className="text-[10px] font-khmer font-bold text-slate-800">អគ្គនាយកដ្ឋានពន្ធដារ</div>
                    </div>
                </div>
            </div>

            {/* --- COMPACT TAX PERIOD ROW --- */}
            <div className="flex items-center justify-between gap-4 mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200">

                {/* Tax Year */}
                <div className="flex items-center gap-3 border-r border-slate-200 pr-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Tax Year</span>
                    <div className="flex gap-1">
                        {(() => {
                            const yearStr = (data.taxYear || '2023').toString().replace(/[^0-9]/g, '').slice(-4);
                            let yearChars = yearStr.split('');
                            while (yearChars.length < 4) yearChars.unshift('0');
                            return yearChars.map((char, i) => (
                                <div key={i} className="w-6 h-8 bg-white border border-slate-900 rounded flex items-center justify-center font-mono font-black text-lg text-blue-600">
                                    {char}
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Period Details */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                            <span className="font-khmer font-bold text-[10px] text-slate-900">ចំនួនខែ</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Months</span>
                        </div>
                        <DigitBoxGroup value={data.taxMonths || "12"} count={2} />
                    </div>

                    <div className="h-8 w-px bg-slate-200"></div>

                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                            <span className="font-khmer font-bold text-[10px] text-slate-900">ចាប់ពីថ្ងៃទី</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">From</span>
                        </div>
                        <DigitBoxGroup value={data.fromDate || "01012023"} count={8} highlightIndices={[1, 3]} />
                    </div>

                    <div className="text-slate-300">➜</div>

                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                            <span className="font-khmer font-bold text-[10px] text-slate-900">ដល់ថ្ងៃទី</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Until</span>
                        </div>
                        <DigitBoxGroup value={data.untilDate || "31122023"} count={8} highlightIndices={[1, 3]} />
                    </div>
                </div>
            </div>

            {/* --- COMPACT 2-COL GRID MAIN CONTENT --- */}
            <div className="grid grid-cols-12 gap-6">

                {/* LEFT COLUMN: IDENTIFICATION (Span 7) */}
                <div className="col-span-12 xl:col-span-7 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-0.5 w-4 bg-blue-600"></div>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Enterprise Identification</span>
                        <div className="h-0.5 flex-1 bg-slate-100"></div>
                    </div>

                    <div className="grid grid-cols-12 gap-x-4 gap-y-2 bg-white rounded-xl">
                        {/* Row 0 - TIN */}
                        <div className="col-span-12 py-2 border-b border-slate-100 flex items-center gap-3">
                            <div className="w-6 h-6 shrink-0 bg-slate-900 text-white rounded flex items-center justify-center font-bold text-xs">1</div>
                            <div className="flex-1">
                                <span className="font-khmer font-bold text-[11px] block">លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) ៖</span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase block">Tax Identification Number</span>
                            </div>
                            <div className="mr-2">
                                <DigitBoxGroup value={data.tin || ""} count={9} />
                            </div>
                        </div>

                        {/* Row 1 */}
                        <div className="col-span-8">
                            <NumberedFieldRow
                                number="2"
                                labelKh="ឈ្មោះសហគ្រាស ៖"
                                labelEn="Name of Enterprise"
                                value={data.enterpriseName}
                                onChange={(val) => onChange('enterpriseName', val)}
                            />
                        </div>
                        <div className="col-span-4">
                            <NumberedFieldRow
                                number="3"
                                labelKh="សាខា ៖"
                                labelEn="Branches"
                                value={data.branchCount}
                                onChange={(val) => onChange('branchCount', val)}
                                type="number"
                            />
                        </div>

                        {/* Row 2 */}
                        <div className="col-span-6">
                            <NumberedFieldRow
                                number="5"
                                labelKh="ឈ្មោះម្ចាស់/អភិបាល ៖"
                                labelEn="Director/Owner Name"
                                value={data.ownerName}
                                onChange={(val) => onChange('ownerName', val)}
                            />
                        </div>
                        <div className="col-span-6">
                            <NumberedFieldRow
                                number="6"
                                labelKh="សកម្មភាពអាជីវកម្ម ៖"
                                labelEn="Main Activity"
                                value={data.businessActivity}
                                onChange={(val) => onChange('businessActivity', val)}
                            />
                        </div>

                        {/* Row 3 - Tax Date */}
                        <div className="col-span-6 py-2 border-b border-slate-100 flex items-center gap-3">
                            <div className="w-6 h-6 shrink-0 bg-slate-900 text-white rounded flex items-center justify-center font-bold text-xs">4</div>
                            <div className="flex-1">
                                <span className="font-khmer font-bold text-[11px] block">បញ្ជីពន្ធដារ ៖</span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase block">Reg. Date</span>
                            </div>
                            <DigitBoxGroup value={data.regDate || "01012023"} count={8} highlightIndices={[1, 3]} />
                        </div>
                        <div className="col-span-6 py-2 border-b border-slate-100 flex items-center gap-3">
                            <div className="w-6 h-6 shrink-0 bg-blue-100 text-blue-800 rounded flex items-center justify-center font-bold text-[9px]">ID</div>
                            <input
                                type="text"
                                placeholder="Agent License No."
                                value={data.agentLicenseNumber || ""}
                                onChange={(e) => onChange('agentLicenseNumber', e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 font-mono font-bold text-sm text-slate-700"
                            />
                        </div>

                        {/* Addresses */}
                        <div className="col-span-12">
                            <NumberedFieldRow
                                number="8"
                                labelKh="អាសយដ្ឋានទីស្នាក់ការ ៖"
                                labelEn="Registered Office Address"
                                value={data.registeredAddress}
                                onChange={(val) => onChange('registeredAddress', val)}
                            />
                        </div>
                        <div className="col-span-12">
                            <NumberedFieldRow
                                number="9"
                                labelKh="អាសយដ្ឋានអាជីវកម្ម ៖"
                                labelEn="Principal Establishment Address"
                                value={data.principalAddress}
                                onChange={(val) => onChange('principalAddress', val)}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: DATA & CALCS (Span 5) */}
                <div className="col-span-12 xl:col-span-5 flex flex-col gap-4">
                    {/* Accounting */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-slate-800 text-white rounded flex items-center justify-center font-bold text-[10px]">11</div>
                            <span className="text-[10px] font-bold text-slate-700 uppercase">Accounting Records</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onChange('accountingType', 'software')}
                                className={`flex-1 py-1.5 rounded border text-[10px] font-bold ${data.accountingType === 'software' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                                Software
                            </button>
                            <button
                                onClick={() => onChange('accountingType', 'manual')}
                                className={`flex-1 py-1.5 rounded border text-[10px] font-bold ${data.accountingType === 'manual' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                                Manual
                            </button>
                        </div>
                    </div>

                    {/* Legal Form Compact */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-slate-800 text-white rounded flex items-center justify-center font-bold text-[10px]">14</div>
                            <span className="text-[10px] font-bold text-slate-700 uppercase">Legal Form</span>
                        </div>
                        <select
                            value={data.legalForm || ""}
                            onChange={(e) => onChange('legalForm', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg text-[10px] font-bold py-2 px-2 outline-none focus:border-blue-500"
                        >
                            <option value="">Select Legal Form...</option>
                            <option value="sole">Sole Proprietorship / Physical Person</option>
                            <option value="general_partnership">General Partnership</option>
                            <option value="limited_partnership">Limited Partnership</option>
                            <option value="single_member_plc">Single Member Private Limited Company</option>
                            <option value="private_limited">Private Limited Company</option>
                            <option value="public_limited">Public Limited Company</option>
                            <option value="joint_venture_interest">Interest in Joint Venture</option>
                            <option value="public_enterprise">Public Enterprise</option>
                            <option value="state_enterprise">State Enterprise</option>
                            <option value="state_joint_venture">State Joint Venture</option>
                            <option value="foreign_branch">Foreign Company's Branch</option>
                            <option value="representative_office">Representative Office</option>
                            <option value="ngo">Non-Government Organization / Association</option>
                            <option value="others">Others</option>
                        </select>
                    </div>

                    {/* Tax Rates */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-slate-800 text-white rounded flex items-center justify-center font-bold text-[10px]">16</div>
                            <span className="text-[10px] font-bold text-slate-700 uppercase">Tax Rate</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {['20%', '30%', '5%', '0%', '0-20%'].map(rate => (
                                <button
                                    key={rate}
                                    onClick={() => onChange('taxRate', rate)}
                                    className={`px-3 py-1 rounded border text-[10px] font-bold ${data.taxRate === rate ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                    {rate}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calculations */}
                    <div className="space-y-2 mt-auto">
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-bold text-blue-400 uppercase">Tax Due</div>
                                <div className="font-khmer font-bold text-[10px] text-blue-900">ពន្ធត្រូវបង់</div>
                            </div>
                            <input
                                type="number"
                                value={data.taxDue || ""}
                                onChange={(e) => onChange('taxDue', e.target.value)}
                                className="w-32 bg-transparent text-right font-mono font-bold text-xl text-blue-800 outline-none border-b border-blue-200 focus:border-blue-500"
                                placeholder="0"
                            />
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-bold text-emerald-400 uppercase">Credit Fwd</div>
                                <div className="font-khmer font-bold text-[10px] text-emerald-900">ឥណទានពន្ធ</div>
                            </div>
                            <input
                                type="number"
                                value={data.taxCreditForward || ""}
                                onChange={(e) => onChange('taxCreditForward', e.target.value)}
                                className="w-32 bg-transparent text-right font-mono font-bold text-xl text-emerald-800 outline-none border-b border-emerald-200 focus:border-emerald-500"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* --- COMPACT DECLARATION --- */}
            <div className="mt-8 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3 opacity-70 hover:opacity-100 transition">
                    <CheckCircle className="text-emerald-500 shrink-0" size={16} />
                    <p className="text-[10px] text-slate-500 leading-tight">
                        <span className="font-bold">DECLARATION:</span> We certify that the information on this return and the attached annexes is true, correct, and complete.
                        <span className="font-khmer ml-2">យើងខ្ញុំសូមទទួលខុសត្រូវទាំងស្រុងចំពោះមុខច្បាប់...</span>
                    </p>
                    <button
                        onClick={onSubmit}
                        className="ml-auto bg-black text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-slate-800 transition uppercase text-[10px] tracking-widest whitespace-nowrap"
                    >
                        Submit Return
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DynamicForm;
