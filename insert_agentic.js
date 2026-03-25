const fs = require('fs');
let c = fs.readFileSync('client/src/pages/CompanyProfileNew.jsx', 'utf8');

// Find "    // --- IEWS Placeholder ---" in the file (with \r\n)
const marker = '    // --- IEWS Placeholder ---';
const idx = c.indexOf(marker);
console.log('Found marker at:', idx, '| Context:', JSON.stringify(c.substring(idx-10, idx+50)));

const agenticBlock = `    // --- Agentic Filing (4th Module) ---
    const renderAgenticFiling = () => (
        <div className="w-full h-[calc(100vh-80px)] flex flex-col bg-[#0a0f1a] animate-fade-in">
            {/* Top Control Bar */}
            <div className="flex items-center justify-between px-8 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('home')} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5 active:scale-95">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                            <Bot size={16} className="text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-black text-sm uppercase tracking-wider leading-none">Agentic Filing</h2>
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest">GDT e-Tax Portal Bridge</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
                        <Wifi size={12} className="text-green-400 animate-pulse" />
                        <span className="text-green-400 text-[10px] font-black uppercase tracking-widest">Portal Connected</span>
                    </div>
                    <a href="https://owp.tax.gov.kh/gdtowpcoreweb/login" target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-white/10 rounded-xl text-slate-300 text-[11px] font-bold transition-all">
                        <Globe size={12} />
                        Open Full
                    </a>
                </div>
            </div>
            {/* Info Banner */}
            <div className="flex items-start gap-4 px-8 py-3 bg-blue-500/5 border-b border-blue-500/10 shrink-0">
                <Bot size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                    <p className="text-blue-300 text-[11px] font-bold">
                        Module 4 — Agentic Filing
                        <span className="ml-2 text-blue-400/60 font-normal">Once the internal TOI form is reviewed and approved, BA TOI will automatically navigate this portal and submit your annual return. No manual entry required.</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 text-yellow-400/70 text-[10px] shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    Awaiting TOI Approval
                </div>
            </div>
            {/* iframe — GDT Portal */}
            <div className="flex-1 relative">
                <iframe
                    src="https://owp.tax.gov.kh/gdtowpcoreweb/login"
                    className="w-full h-full border-none"
                    title="GDT e-Tax Portal — Cambodia General Department of Taxation"
                    allow="fullscreen"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-white/5 px-3 py-2 rounded-lg text-[10px] text-slate-400 pointer-events-none shadow-xl">
                    <Bot size={10} className="text-green-400" />
                    BA TOI Filing Agent
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-1" />
                </div>
            </div>
        </div>
    );

`;

c = c.substring(0, idx) + agenticBlock + c.substring(idx);
fs.writeFileSync('client/src/pages/CompanyProfileNew.jsx', c, 'utf8');
console.log('Written OK. File size:', c.length);
