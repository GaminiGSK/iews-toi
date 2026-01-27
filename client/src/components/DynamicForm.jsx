import React from 'react';
import { Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';

const FieldInput = ({ field, value, onChange, error }) => {
    const baseClasses = "w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-mono shadow-sm";

    if (field.type === 'currency') {
        return (
            <div className="relative group">
                <span className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-400 font-bold">$</span>
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(field.key, parseFloat(e.target.value) || 0)}
                    className={`${baseClasses} pl-8 text-right font-bold tracking-wide`}
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
                className={`${baseClasses} min-h-[100px]`}
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
                    className={`${baseClasses} appearance-none cursor-pointer`}
                >
                    <option value="">Select...</option>
                    {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-4 text-slate-400 pointer-events-none">
                    ▼
                </div>
            </div>
        );
    }

    // Checkbox Group (Official Style)
    if (field.type === 'checkbox-group') {
        return (
            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-1">
                {field.options?.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${value === opt.value ? 'bg-white border-white' : 'border-slate-400 group-hover:border-white'}`}>
                            {value === opt.value && <div className="w-3 h-3 bg-black"></div>}
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
                            {opt.labelKh && <span className="text-[10px] font-khmer text-slate-300">{opt.labelKh}</span>}
                            <span className={`text-sm font-bold ${value === opt.value ? 'text-white' : 'text-slate-400'}`}>{opt.label}</span>
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
            className={`${baseClasses} ${field.className || ''} font-bold text-lg`}
            placeholder={field.placeholder}
            readOnly={field.readOnly}
            style={{ fontFamily: 'monospace' }}
        />
    );
};

const DynamicForm = ({ schema, data, onChange, onSubmit }) => {
    if (!schema) return <div className="p-8 text-center text-slate-500 animate-pulse">Waiting for Schema...</div>;

    return (
        <div className="max-w-[1200px] mx-auto animate-in slide-in-from-bottom-5 fade-in duration-500 pb-20">

            {/* OFFICIAL HEADER (Kingdom of Cambodia) */}
            <div className="flex justify-between items-start mb-8 text-center px-4 font-serif">
                <div className="text-left w-1/3">
                    <h3 className="font-khmer text-lg text-blue-200">ក្រសួងសេដ្ឋកិច្ចនិងហិរញ្ញវត្ថុ</h3>
                    <h4 className="font-bold text-sm text-white tracking-wider mb-2">MINISTRY OF ECONOMY AND FINANCE</h4>

                    <h3 className="font-khmer text-lg text-blue-200">អគ្គនាយកដ្ឋានពន្ធដារ</h3>
                    <h4 className="font-bold text-sm text-white tracking-wider">GENERAL DEPARTMENT OF TAXATION</h4>
                </div>

                <div className="w-1/3 flex justify-center">
                    {/* Placeholder for Coat of Arms */}
                    <div className="w-24 h-24 rounded-full border-4 border-double border-yellow-600/50 flex items-center justify-center bg-slate-900/50 shadow-2xl">
                        <span className="text-3xl">🇰🇭</span>
                    </div>
                </div>

                <div className="text-right w-1/3">
                    <h3 className="font-khmer text-lg text-blue-200">ព្រះរាជាណាចក្រកម្ពុជា</h3>
                    <h4 className="font-bold text-sm text-white tracking-wider mb-2">KINGDOM OF CAMBODIA</h4>
                    <h3 className="font-khmer text-base text-blue-200">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
                    <h4 className="font-bold text-xs text-white tracking-widest border-b-2 border-white/20 pb-1 inline-block">NATION RELIGION KING</h4>
                </div>
            </div>

            {/* Form Title */}
            <div className="text-center mb-10 border-b-4 border-double border-slate-600 pb-6">
                <div className="inline-block bg-slate-800 border border-slate-600 px-6 py-2 rounded mb-4">
                    <h2 className="font-khmer text-xl text-yellow-500">ទម្រង់ ពន្ធ ០១ / ទម្រង់ ត​ ០១</h2>
                    <span className="text-white font-bold">FORM TOI 01</span>
                </div>
                <h1 className="font-khmer text-2xl text-white mb-1">{schema.titleKh}</h1>
                <h2 className="text-xl font-bold text-blue-300 uppercase tracking-widest">{schema.title}</h2>
            </div>


            {/* SECTIONS AS OFFICIAL TABLES */}
            <div className="border-2 border-slate-600 bg-slate-900 shadow-2xl">
                {schema.sections?.map((section, idx) => (
                    <div key={section.id} className={`${idx > 0 ? 'border-t-4 border-slate-700' : ''}`}>

                        {/* Section Header */}
                        {section.title && (
                            <div className="bg-slate-800 border-b border-slate-600 px-4 py-2 flex items-center gap-3">
                                {section.number && <span className="bg-white text-black font-bold px-2 rounded-sm">{section.number}</span>}
                                <div>
                                    {section.titleKh && <h3 className="font-khmer text-sm text-slate-300 leading-tight">{section.titleKh}</h3>}
                                    <h3 className="font-bold text-white text-sm uppercase">{section.title}</h3>
                                </div>
                            </div>
                        )}

                        {/* Grid */}
                        <div className="grid grid-cols-12 divide-x divide-slate-700"> {/* Vertical Dividers */}
                            {section.fields?.map((field) => {
                                const spanClass = field.colSpan ? `col-span-${field.colSpan}` : 'col-span-12';

                                return (
                                    <div key={field.key} className={`${spanClass} p-3 border-b border-slate-700 flex flex-col justify-center relative min-h-[80px]`}>

                                        {/* Label Area */}
                                        <div className="mb-2">
                                            {/* Field Number */}
                                            {field.number && (
                                                <div className="absolute top-2 left-2 w-6 h-6 bg-slate-700 text-white text-xs flex items-center justify-center font-bold border border-slate-500">
                                                    {field.number}
                                                </div>
                                            )}

                                            <div className={`${field.number ? 'pl-8' : ''}`}>
                                                {field.labelKh && <p className="font-khmer text-sm text-blue-200 leading-relaxed">{field.labelKh}</p>}
                                                <p className="font-bold text-xs text-white uppercase opacity-90">{field.label}</p>
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
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded shadow-lg transition"
                >
                    SAVE DRAFT
                </button>
            </div>
        </div>
    );
};

export default DynamicForm;
