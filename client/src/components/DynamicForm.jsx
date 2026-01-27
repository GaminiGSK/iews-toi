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

    if (field.type === 'checkbox-group') {
        return (
            <div className="flex flex-wrap gap-4 mt-2">
                {field.options?.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${value === opt.value ? 'bg-blue-500 border-blue-500' : 'border-slate-600 group-hover:border-slate-400'}`}>
                            {value === opt.value && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <input
                            type="radio"
                            name={field.key}
                            value={opt.value}
                            checked={value === opt.value}
                            onChange={() => onChange(field.key, opt.value)} // Single select for now like Radio
                            className="hidden"
                        />
                        <span className={`text-sm font-medium ${value === opt.value ? 'text-blue-300' : 'text-slate-400'}`}>{opt.label}</span>
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
        <div className="max-w-5xl mx-auto space-y-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between border-b2 border-slate-700 pb-4 mb-8">
                {/* Simplified Header for print-like feel */}
                <div className="text-center w-full">
                    <h1 className="text-xl font-bold text-white uppercase tracking-widest">{schema.title}</h1>
                    <p className="text-slate-400 text-sm font-serif italic">{schema.description}</p>
                </div>
            </div>

            {/* Sections */}
            {schema.sections?.map((section) => (
                <div key={section.id} className="bg-slate-900 border border-slate-700/50 p-6 rounded-xl shadow-lg relative print:shadow-none print:border-black print:bg-white text-left">

                    {section.title && (
                        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                            {section.title}
                        </h2>
                    )}

                    {/* 12 Column Grid System for Exact Form Layout */}
                    <div className="grid grid-cols-12 gap-x-4 gap-y-6">
                        {section.fields?.map((field) => {
                            // Calculate colSpan class specifically
                            const spanClass = field.colSpan ? `col-span-${field.colSpan}` : 'col-span-12';
                            // Start Col class
                            const startClass = field.colStart ? `col-start-${field.colStart}` : '';

                            return (
                                <div key={field.key} className={`${spanClass} ${startClass}`}>
                                    {/* Traditional Form Label Look */}
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        {field.label}
                                        {field.required && <span className="text-red-400 ml-1">*</span>}
                                    </label>
                                    <FieldInput
                                        field={field}
                                        value={data[field.key]}
                                        onChange={onChange}
                                    />
                                    {field.help && (
                                        <p className="text-[10px] text-slate-500 mt-1 italic">
                                            {field.help}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Actions */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={onSubmit}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-1 active:scale-95"
                >
                    {schema.submitLabel || 'Submit Form'}
                </button>
            </div>
        </div>
    );
};

export default DynamicForm;
