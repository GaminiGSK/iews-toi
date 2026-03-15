const fs = require('fs');
let code = fs.readFileSync('client/src/pages/CompanyProfileNew.jsx', 'utf8');

const startStr = '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">';
const endStr = '{/* --- END CORE USER FUNCTIONS --- */}';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end tags");
    process.exit(1);
}

const newLayout = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {/* --- CORE USER FUNCTIONS (STRICT: DO NOT AMEND OR REMOVE) --- */}
                    
                    {/* COLUMN 1 */}
                    <div className="flex flex-col gap-6">
                        <div onClick={() => setView('iews')} className="group p-8 bg-slate-800/40 hover:bg-indigo-600/10 border border-white/5 hover:border-indigo-500/50 rounded-3xl transition-all duration-500 cursor-pointer relative overflow-hidden">
                            <span className="absolute top-4 right-4 bg-indigo-500 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg animate-pulse">NEW</span>
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <ShieldCheck size={28} className="text-indigo-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">IEWS</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Enterprise Work System. Manage workflow packages.</p>
                        </div>

                        <div onClick={() => setView('profile')} className="group p-8 bg-slate-800/40 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/50 rounded-3xl transition-all duration-500 cursor-pointer text-left">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <FileText size={28} className="text-blue-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Company Profile</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Update official registration details, MOC certificates, and shareholders.</p>
                        </div>

                        <div onClick={() => setView('codes')} className="group p-8 bg-slate-800/40 hover:bg-cyan-600/10 border border-white/5 hover:border-cyan-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <QrCode size={28} className="text-cyan-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Accounting Codes</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Manage Chart of Accounts codes and standard descriptions.</p>
                        </div>
                    </div>

                    {/* COLUMN 2 */}
                    <div className="flex flex-col gap-6">
                        <div onClick={() => setView('bank')} className="group p-8 bg-slate-800/40 hover:bg-emerald-600/10 border border-white/5 hover:border-emerald-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Table size={28} className="text-emerald-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Bank Statements</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Upload monthly statements, parse transactions via AI, and sync data.</p>
                        </div>

                        <div onClick={() => setView('bank_v2')} className="group p-8 bg-slate-800/40 hover:bg-emerald-600/10 border border-white/5 hover:border-emerald-500/50 rounded-3xl transition-all duration-500 cursor-pointer relative overflow-hidden">
                            <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-sm shadow-sm uppercase tracking-widest">Multi-Bank</span>
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Layers size={28} className="text-emerald-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Bank Statements V2</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Create isolated statement baskets for multiple separate bank accounts.</p>
                        </div>

                        <div onClick={() => setView('assets')} className="group p-8 bg-slate-800/40 hover:bg-yellow-600/10 border border-white/5 hover:border-yellow-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <ShieldCheck size={28} className="text-yellow-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Asset & Depreciation</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Manage fixed assets, intangibles, and calculate tax depreciation pooling.</p>
                        </div>

                        <div onClick={() => setView('salary')} className="group p-8 bg-slate-800/40 hover:bg-pink-600/10 border border-white/5 hover:border-pink-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Users size={28} className="text-pink-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Salary & TOS Recon</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Reconcile Tax on Salary filings with annual SG&A salary expenses.</p>
                        </div>

                        <div onClick={() => setView('related_party')} className="group p-8 bg-slate-800/40 hover:bg-orange-600/10 border border-white/5 hover:border-orange-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Layers size={28} className="text-orange-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Related Party Disclosure</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Map intercompany transactions, director loans, and parent/subsidiary entities.</p>
                        </div>
                    </div>

                    {/* COLUMN 3 */}
                    <div className="flex flex-col gap-6">
                        <div onClick={() => setView('toi_acar')} className="group p-8 bg-gradient-to-br from-slate-800/40 to-slate-900/60 hover:from-rose-600/20 hover:to-indigo-600/20 border border-white/5 hover:border-rose-400/50 rounded-3xl transition-all duration-500 cursor-pointer relative overflow-hidden shadow-xl hover:shadow-rose-500/20">
                            <span className="absolute top-4 right-4 bg-gradient-to-r from-rose-500 to-indigo-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse uppercase tracking-widest">Premium Pack</span>
                            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500 border border-rose-500/20 shadow-inner">
                                <Box size={28} className="text-rose-400" />
                            </div>
                            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 font-black text-2xl mb-2 tracking-tight">TOI ACAR PACK</h3>
                            <p className="text-slate-400 text-xs leading-relaxed font-medium">All-in-one compliance bundle for Tax on Income and ACAR reporting. Rebuilt architecture.</p>
                        </div>

                        <div onClick={() => setView('ledger')} className="group p-8 bg-slate-800/40 hover:bg-orange-600/10 border border-white/5 hover:border-orange-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Book size={28} className="text-orange-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">General Ledger</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">View chronological financial history of all audited transactions.</p>
                        </div>

                        <div onClick={() => setView('tb')} className="group p-8 bg-slate-800/40 hover:bg-amber-600/10 border border-white/5 hover:border-amber-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Scale size={28} className="text-amber-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Trial Balance</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">View Unadjusted & Adjusted Trial Balance reports.</p>
                        </div>

                        <div onClick={() => setView('currency')} className="group p-8 bg-slate-800/40 hover:bg-teal-600/10 border border-white/5 hover:border-teal-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <DollarSign size={28} className="text-teal-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Currency Exchange</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Set Annual Exchange Rates (USD to KHR) for compliance.</p>
                        </div>

                        <div onClick={() => setView('financials')} className="group p-8 bg-slate-800/40 hover:bg-violet-600/10 border border-white/5 hover:border-violet-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <TrendingUp size={28} className="text-violet-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Financial Stmts</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Generate final audited reports (Income, Balance Sheet, Cash Flow).</p>
                        </div>
                    </div>
                    
                    {/* --- END CORE USER FUNCTIONS --- */}`;

code = code.substring(0, startIndex) + newLayout + code.substring(endIndex + endStr.length);
fs.writeFileSync('client/src/pages/CompanyProfileNew.jsx', code);
console.log('Successfully updated layout');
