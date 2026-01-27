import React from 'react';
import { Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';

const FieldInput = ({ field, value, onChange, error }) => {
    // Official Paper Input Style (Transparent with bottom border or box)
    const baseClasses = "w-full bg-transparent border-b border-dotted border-slate-400 focus:border-blue-600 outline-none transition-all font-mono text-blue-900 font-bold px-1";

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
                {/* Form Code Top Left */}
                <div className="absolute -top-4 -left-2 font-bold text-sm tracking-wide">TOI 01 / I</div>

                <div className="flex justify-between items-start mt-6">
                    {/* Left Column: Ministry & Dept */}
                    <div className="flex flex-col items-center w-[35%] text-center">
                        <h3 className="font-khmer font-bold text-xs mb-1">ក្រសួងសេដ្ឋកិច្ចនិងហិរញ្ញវត្ថុ</h3>
                        <h4 className="font-bold text-[10px] uppercase border-b border-black pb-0.5 mb-1 w-full max-w-[220px]">MINISTRY OF ECONOMY AND FINANCE</h4>

                        <h3 className="font-khmer font-bold text-xs mb-1">អគ្គនាយកដ្ឋានពន្ធដារ</h3>
                        <h4 className="font-bold text-[10px] uppercase mb-3 w-full max-w-[220px]">GENERAL DEPARTMENT OF TAXATION</h4>

                        {/* Form Name Box */}
                        <div className="border-2 border-black p-1.5 bg-slate-100 text-center w-full shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                            <h3 className="font-khmer font-bold text-sm leading-tight">ទម្រង់ ពបច ០១ / FORM TOI 01</h3>
                        </div>
                        <p className="font-khmer text-[9px] mt-1.5 leading-tight">(មាត្រា ២៩ ថ្មី នៃច្បាប់ស្តីពីសារពើពន្ធ )</p>
                        <p className="text-[9px] leading-tight">(Article 29 New of the Law on Taxation)</p>
                    </div>

                    {/* Center Column: Logo */}
                    <div className="w-[30%] flex flex-col items-center justify-start pt-2">
                        <div className="w-24 h-24 rounded-full border border-green-600 flex items-center justify-center bg-white shadow-sm mb-2 relative overflow-hidden group">
                            {/* Simulated GDT Seal */}
                            <div className="absolute inset-1 border border-dotted border-green-600 rounded-full"></div>
                            <div className="text-center">
                                <div className="font-khmer text-[8px] text-green-700">អគ្គនាយកដ្ឋានពន្ធដារ</div>
                                <div className="text-2xl pt-1">🏛️</div>
                                <div className="text-[6px] font-bold text-green-700 uppercase mt-0.5">G.D.T</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Kingdom */}
                    <div className="flex flex-col items-center w-[35%] text-center">
                        <h3 className="font-khmer font-bold text-sm mb-1">ព្រះរាជាណាចក្រកម្ពុជា</h3>
                        <h4 className="font-bold text-xs uppercase mb-2">KINGDOM OF CAMBODIA</h4>
                        <h3 className="font-khmer font-bold text-xs mb-1">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
                        <h4 className="font-bold text-[10px] uppercase mb-1">NATION RELIGION KING</h4>

                        {/* Fancy Divider */}
                        <div className="flex items-center gap-2 opacity-80 mt-1">
                            <div className="h-px bg-black w-12"></div>
                            <div className="text-xs">✤</div>
                            <div className="h-px bg-black w-12"></div>
                        </div>
                    </div>
                </div>

                {/* Main Title Area */}
                <div className="text-center mt-6">
                    <h1 className="font-khmer font-bold text-xl mb-1 text-black">{schema.title || "លិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ"}</h1>
                    <div className="flex items-end justify-center gap-3">
                        <h2 className="font-bold text-sm uppercase translate-y-1">{schema.titleKh || "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED"}</h2>

                        {/* The 4 Year Boxes Replica */}
                        <div className="flex gap-1 ml-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-6 h-7 border border-black bg-white"></div>
                            ))}
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
