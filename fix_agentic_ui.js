const fs = require('fs');
let c = fs.readFileSync('client/src/pages/CompanyProfileNew.jsx', 'utf8');

// Find the old renderAgenticFiling function and replace it
const startMarker = '    // --- Agentic Filing (4th Module) ---';
const endMarker = '    // --- IEWS Placeholder ---';

const startIdx = c.indexOf(startMarker);
const endIdx   = c.indexOf(endMarker);

if (startIdx < 0 || endIdx < 0) { console.log('Markers not found'); process.exit(1); }

const newAgenticBlock = `    // --- Agentic Filing (4th Module) ---
    const [agentStatus, setAgentStatus] = useState('idle'); // idle | ready | filing | done | error
    const [portalWindow, setPortalWindow] = useState(null);

    const launchPortal = () => {
        const win = window.open('https://owp.tax.gov.kh/gdtowpcoreweb/login', '_blank', 'width=1200,height=800,toolbar=1,scrollbars=1,resizable=1');
        setPortalWindow(win);
        setAgentStatus('ready');
    };

    const steps = [
        { id: 1, label: 'Internal TOI Form', sublabel: 'Smart Fill & Review complete', done: true },
        { id: 2, label: 'Open GDT Portal', sublabel: 'Login to owp.tax.gov.kh with TID/Email', done: agentStatus !== 'idle', active: agentStatus === 'idle' },
        { id: 3, label: 'BA TOI Auto-Fill', sublabel: 'Agent maps TOI data to GDT portal fields', done: agentStatus === 'done', active: agentStatus === 'filing' },
        { id: 4, label: 'Submit & Confirm', sublabel: 'Agent submits and captures receipt', done: agentStatus === 'done', active: false },
    ];

    const renderAgenticFiling = () => (
        <div className="w-full h-[calc(100vh-80px)] flex flex-col bg-[#080c14] animate-fade-in overflow-hidden">

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
                            <h2 className="text-white font-black text-sm uppercase tracking-wider leading-none">Agentic Filing — Module 4</h2>
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest">GDT e-Tax Portal Automation</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {agentStatus === 'idle' && <span className="flex items-center gap-2 text-yellow-400 text-[10px] font-bold uppercase"><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"/>Awaiting</span>}
                    {agentStatus === 'ready' && <span className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase"><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>Portal Open</span>}
                    {agentStatus === 'filing' && <span className="flex items-center gap-2 text-green-400 text-[10px] font-bold uppercase"><Loader2 size={12} className="animate-spin"/>Filing...</span>}
                    {agentStatus === 'done' && <span className="flex items-center gap-2 text-green-400 text-[10px] font-bold uppercase"><CheckCircle size={12}/>Submitted</span>}
                </div>
            </div>

            {/* Main Content — Two Column */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT: Filing Steps & Controls */}
                <div className="w-[380px] shrink-0 border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar">
                    {/* Steps */}
                    <div className="p-8 flex flex-col gap-4">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Filing Pipeline</p>
                        {steps.map((step, i) => (
                            <div key={step.id} className={\`flex items-start gap-4 p-4 rounded-2xl border transition-all \${step.done ? 'bg-green-500/5 border-green-500/20' : step.active ? 'bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/5' : 'bg-white/2 border-white/5'}\`}>
                                <div className={\`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-sm \${step.done ? 'bg-green-500 text-white' : step.active ? 'bg-blue-500 text-white animate-pulse' : 'bg-white/5 text-slate-600'}\`}>
                                    {step.done ? <CheckCircle size={14}/> : step.id}
                                </div>
                                <div>
                                    <p className={\`font-bold text-sm \${step.done ? 'text-green-400' : step.active ? 'text-white' : 'text-slate-600'}\`}>{step.label}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{step.sublabel}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Button */}
                    <div className="p-8 pt-0 flex flex-col gap-3">
                        {agentStatus === 'idle' && (
                            <button onClick={launchPortal}
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-green-500/20">
                                <Globe size={16}/>
                                Launch GDT Portal
                            </button>
                        )}
                        {agentStatus === 'ready' && (
                            <>
                                <p className="text-slate-400 text-[11px] text-center leading-relaxed">Login to the GDT portal in the window that opened, then click below to start auto-fill.</p>
                                <button onClick={() => setAgentStatus('filing')}
                                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                                    <Bot size={16}/>
                                    Begin BA TOI Auto-Fill
                                </button>
                                <button onClick={launchPortal}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                                    <Globe size={14}/>
                                    Re-Open Portal
                                </button>
                            </>
                        )}
                        {agentStatus === 'filing' && (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <Loader2 size={32} className="text-green-400 animate-spin"/>
                                <p className="text-green-400 text-sm font-black uppercase tracking-widest">BA TOI is filing...</p>
                                <p className="text-slate-500 text-[10px] text-center">Agent is mapping form fields on the GDT portal. This may take 1-2 minutes.</p>
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div className="mx-8 mb-8 p-4 rounded-xl bg-slate-800/30 border border-white/5 text-[10px] text-slate-500 leading-relaxed">
                        <p className="font-bold text-slate-400 mb-1">🔒 Security Note</p>
                        GDT portal credentials are entered directly in the government portal window. GK SMART never stores or sees your GDT password.
                    </div>
                </div>

                {/* RIGHT: Portal Preview / Info */}
                <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/3 to-blue-500/3 pointer-events-none"/>

                    {/* GDT Logo Area */}
                    <div className="flex flex-col items-center text-center max-w-md relative z-10">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/10">
                            <Globe size={40} className="text-blue-400"/>
                        </div>

                        <h3 className="text-white font-black text-2xl mb-2 tracking-tight">Cambodia e-Tax Portal</h3>
                        <p className="text-slate-400 text-sm mb-1">General Department of Taxation (GDT)</p>
                        <p className="text-slate-500 text-[11px] mb-8 font-mono">owp.tax.gov.kh</p>

                        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 text-left w-full mb-6">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Portal Login Methods</p>
                            <div className="flex gap-3">
                                {['MOI ID', 'Email', 'TID'].map(m => (
                                    <div key={m} className="flex-1 py-2 px-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center text-blue-300 text-[11px] font-bold">{m}</div>
                                ))}
                            </div>
                        </div>

                        <button onClick={launchPortal}
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-black rounded-2xl transition-all active:scale-95 shadow-xl shadow-green-500/20 mb-4">
                            <Globe size={18}/>
                            Open GDT Portal in New Window
                        </button>
                        <p className="text-slate-600 text-[10px]">GDT portal opens securely in a separate browser window</p>
                    </div>
                </div>
            </div>
        </div>
    );

`;

c = c.substring(0, startIdx) + newAgenticBlock + c.substring(endIdx);
fs.writeFileSync('client/src/pages/CompanyProfileNew.jsx', c, 'utf8');
console.log('Written OK, size:', c.length);
