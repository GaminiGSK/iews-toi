import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, FileText, Table } from 'lucide-react';

const ToiAcar = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState('TOI'); // 'TOI' or 'ACAR'

    return (
        <div className="w-full h-[calc(100vh-80px)] pt-6 px-4 animate-fade-in flex flex-col">
            {/* Header / Back */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition shrink-0 shadow-md"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <ShieldCheck className="text-rose-400" />
                            TOI & ACAR Compliance
                        </h1>
                        <p className="text-gray-400 text-sm">Manage Tax on Income (TOI) and ACAR Reporting.</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-800/50 p-1 rounded-xl w-fit mb-8 border border-white/5 backdrop-blur-sm">
                <button
                    onClick={() => setActiveTab('TOI')}
                    className={`px-8 py-3 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'TOI' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <FileText size={16} />
                    TOI (Tax on Income)
                </button>
                <button
                    onClick={() => setActiveTab('ACAR')}
                    className={`px-8 py-3 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'ACAR' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Table size={16} />
                    ACAR (Auditing)
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-slate-800/30 border border-white/5 rounded-2xl p-8 backdrop-blur-xl animate-fade-in">
                {activeTab === 'TOI' && (
                    <div className="space-y-6">
                        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-xl">
                            <h3 className="text-xl font-bold text-rose-300 mb-2">TOI Declaration</h3>
                            <p className="text-gray-300">Annual Tax on Income declaration interface will appear here.</p>
                        </div>
                        {/* Placeholder Content */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 hover:border-rose-500/30 transition">
                                <h4 className="font-bold text-white mb-2">Revenue Calculation</h4>
                                <p className="text-xs text-gray-500">Based on reconciled bank statements.</p>
                            </div>
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 hover:border-rose-500/30 transition">
                                <h4 className="font-bold text-white mb-2">Expense Deductibility</h4>
                                <p className="text-xs text-gray-500">Classify expenses as deductible/non-deductible.</p>
                            </div>
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 hover:border-rose-500/30 transition">
                                <h4 className="font-bold text-white mb-2">Final Tax Payable</h4>
                                <p className="text-xs text-gray-500">Automated calculation (20%).</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ACAR' && (
                    <div className="space-y-6">
                        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-xl">
                            <h3 className="text-xl font-bold text-rose-300 mb-2">ACAR Reporting</h3>
                            <p className="text-gray-300">Accounting and Auditing Regulator compliance forms.</p>
                        </div>
                        {/* Placeholder Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 hover:border-rose-500/30 transition">
                                <h4 className="font-bold text-white mb-2">Financial Position</h4>
                                <p className="text-xs text-gray-500">Statement of Financial Position for ACAR.</p>
                            </div>
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5 hover:border-rose-500/30 transition">
                                <h4 className="font-bold text-white mb-2">Comprehensive Income</h4>
                                <p className="text-xs text-gray-500">Statement of Comprehensive Income for ACAR.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToiAcar;
