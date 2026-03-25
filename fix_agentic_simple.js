const fs = require('fs');
let c = fs.readFileSync('client/src/pages/CompanyProfileNew.jsx', 'utf8');

const startMarker = '    // --- Agentic Filing (4th Module) ---';
const endMarker   = '    // --- IEWS Placeholder ---';

const startIdx = c.indexOf(startMarker);
const endIdx   = c.indexOf(endMarker);

if (startIdx < 0 || endIdx < 0) { console.log('Markers not found'); process.exit(1); }

const simpleBlock = `    // --- Agentic Filing (4th Module) ---
    const renderAgenticFiling = () => (
        <div className="w-full h-[calc(100vh-80px)] flex flex-col bg-[#080c14]">
            {/* Top bar */}
            <div className="flex items-center gap-4 px-6 py-3 bg-slate-900/80 backdrop-blur-md border-b border-white/5 shrink-0">
                <button onClick={() => setView('home')} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5 active:scale-95 shrink-0">
                    <ArrowLeft size={16} />
                </button>
                <div className="flex items-center gap-2">
                    <Bot size={14} className="text-green-400" />
                    <span className="text-white font-black text-sm uppercase tracking-wider">Agentic Filing</span>
                    <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest ml-1">GDT e-Tax Portal</span>
                </div>
                <div className="ml-auto flex items-center gap-2 text-[10px] text-green-400 font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    BA TOI Agent Active
                </div>
            </div>
            {/* Full screen portal */}
            <iframe
                src="https://owp.tax.gov.kh/gdtowpcoreweb/login"
                className="flex-1 w-full border-none"
                title="GDT e-Tax Portal"
            />
        </div>
    );

`;

c = c.substring(0, startIdx) + simpleBlock + c.substring(endIdx);
fs.writeFileSync('client/src/pages/CompanyProfileNew.jsx', c, 'utf8');
console.log('Done, size:', c.length);
