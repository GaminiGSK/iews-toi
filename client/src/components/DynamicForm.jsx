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

    // Default Text
    return (
        <input
            type={field.type || 'text'}
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={baseClasses}
            placeholder={field.placeholder}
            readOnly={field.readOnly}
        />
    );
};

const DynamicForm = ({ schema, data, onChange, onSubmit }) => {
    if (!schema) return <div className="p-8 text-center text-slate-500 animate-pulse">Waiting for Schema...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-5 fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                        {schema.title}
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">{schema.description}</p>
                </div>
                {schema.status === 'draft' && (
                    <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider animate-pulse">
                        Draft Mode
                    </span>
                )}
            </div>

            {/* Sections */}
            {schema.sections?.map((section) => (
                <div key={section.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-xl backdrop-blur-sm relative overflow-hidden group hover:border-slate-700/80 transition-all">
                    {/* Section Decorator */}
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                            {section.icon === 'calc' ? <Calculator size={18} /> : 
                             section.icon === 'check' ? <CheckCircle2 size={18} /> : 
                             <div className="w-2 h-2 rounded-full bg-blue-400"></div>}
                        </span>
                        {section.title}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {section.fields?.map((field) => (
                            <div key={field.key} className={field.fullWidth ? "md:col-span-2" : ""}>
                                <label className="block text-sm font-semibold text-slate-400 mb-2 ml-1">
                                    {field.label}
                                    {field.required && <span className="text-red-400 ml-1">*</span>}
                                </label>
                                <FieldInput
                                    field={field}
                                    value={data[field.key]}
                                    onChange={onChange}
                                />
                                {field.help && (
                                    <p className="text-xs text-slate-500 mt-2 ml-1 flex items-center gap-1">
                                        <AlertCircle size={12} /> {field.help}
                                    </p>
                                )}
                            </div>
                        ))}
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
