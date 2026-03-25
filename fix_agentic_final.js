const fs = require('fs');
const path = require('path');

const filePath = path.join('e:\\Antigravity\\TOI\\client\\src\\pages\\CompanyProfileNew.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the exact section using a regex that handles both \r\n and \n
// We'll find start and end markers, then replace everything between them
const startMarker = '    // --- Agentic Filing (4th Module) ---';
const endMarker = '    // --- IEWS Placeholder ---';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('Markers not found:', { startIdx, endIdx });
    process.exit(1);
}

console.log(`Found section from ${startIdx} to ${endIdx} (${endIdx - startIdx} chars)`);

const beforeSection = content.substring(0, startIdx);
const afterSection = content.substring(endIdx);

const newSection = `    // --- Agentic Filing Hub (4th Module) ---
    const currentFilingYear = new Date().getFullYear() - 1;

    // GDT Credentials — stored per company in localStorage
    const credKey = \`gdtCreds_\${formData?.companyCode || 'default'}\`;
    const [gdtCreds, setGdtCreds] = React.useState(() => {
        try { return JSON.parse(localStorage.getItem(credKey) || 'null') || { username: '', password: '' }; }
        catch { return { username: '', password: '' }; }
    });
    const [showCredForm, setShowCredForm] = React.useState(false);
    const [credEdit, setCredEdit] = React.useState({ username: '', password: '' });
    const [showGdtPass, setShowGdtPass] = React.useState(false);
    const [gdtStep, setGdtStep] = React.useState(1);
    const [copiedField, setCopiedField] = React.useState(null);

    const saveGdtCreds = () => {
        const c = { username: credEdit.username.trim(), password: credEdit.password };
        localStorage.setItem(credKey, JSON.stringify(c));
        setGdtCreds(c);
        setShowCredForm(false);
    };
    const copyToClip = (text, field) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        });
    };

    const GDT_LOGIN_STEPS = [
        {
            step: 1, title: 'Enter Username / TIN', icon: '\u{1F464}', color: 'blue',
            field: 'username', label: 'GDT Username / TIN',
            instructions: [
                'Select the correct tab: MOH ID, \u1796\u17B8\u1793 (PIN), or TIN',
                'Click the username / ID field in the portal (left side)',
                'Click Copy below, then paste (Ctrl+V) into that field',
                'Click \u1794\u1793\u17D2\u178F (Continue) in the GDT portal',
            ],
        },
        {
            step: 2, title: 'Enter Password', icon: '\u{1F511}', color: 'violet',
            field: 'password', label: 'GDT Password',
            instructions: [
                'The portal shows a password field after username is accepted',
                'Click the password field in the portal',
                'Click Copy below then paste (Ctrl+V) into the field',
                'Click \u1785\u17BC\u179B (Login) in the portal',
            ],
        },
        {
            step: 3, title: 'Enter OTP (from Email)', icon: '\u{1F4E7}', color: 'amber',
            field: null,
            instructions: [
                'GDT automatically sends a One-Time Password to the company owner email',
                'Check the company inbox for a message from GDT / tax.gov.kh',
                'The OTP is 4\u20136 digits and expires in 5 minutes',
                'Type the OTP code into the verification field in the portal',
                'Click Confirm / \u1794\u1789\u17D2\u1787\u17B6\u1780\u17CB to complete login',
            ],
        },
        {
            step: 4, title: 'File Inside Portal', icon: '\u{1F4CB}', color: 'emerald',
            field: null,
            instructions: [
                'You are logged in! Navigate to Annual Tax Return (\u1796\u1793\u17D2\u1792\u1794\u17D2\u179A\u1785\u17B6\u17C6\u1786\u17D2\u1793\u17B6\u17C6)',
                'Select Tax Year ' + (new Date().getFullYear() - 1),
                'Upload your TOI 01 form (PDF) or fill in online',
                'Attach financial statements if required',
                'Click Submit (\u178A\u17B6\u1780\u179F\u17D2\u1793\u17BE) and save the acknowledgement number',
            ],
        },
    ];

    const renderAgenticFiling = () => (
        <div className="w-full h-[calc(100vh-80px)] flex flex-col bg-[#080c14]">

            {/* TOP BAR */}
            <div className="flex items-center gap-3 px-4 py-2 bg-[#0d1117] border-b border-white/5 shrink-0 z-20">
                <button onClick={() => setView('home')} className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition border border-white/5 active:scale-95 shrink-0">
                    <ArrowLeft size={14} />
                </button>
                <Bot size={13} className="text-green-400 shrink-0" />
                <span className="text-white font-black text-xs uppercase tracking-wider shrink-0">Agentic Filing</span>
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black uppercase tracking-widest shrink-0">GDT e-Tax</span>
                <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

                {!showCredForm ? (
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/70 border border-white/10 rounded-lg">
                            <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">GDT:</span>
                            <span className="text-slate-200 text-[10px] font-black">{gdtCreds.username || <span className="text-slate-600 italic">no credentials</span>}</span>
                        </div>
                        <button onClick={() => { setCredEdit({ ...gdtCreds }); setShowCredForm(true); }}
                            className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white text-[9px] font-black uppercase rounded-lg transition active:scale-95 shrink-0">
                            {gdtCreds.username ? '\u270E Edit' : '\uFF0B Add Credentials'}
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                        <input autoFocus type="text" placeholder="GDT Username / TIN"
                            value={credEdit.username} onChange={e => setCredEdit(p => ({ ...p, username: e.target.value }))}
                            className="h-7 px-2 bg-slate-800 border border-white/20 rounded-lg text-white text-[11px] outline-none focus:border-green-500/60 w-40" />
                        <input type={showGdtPass ? 'text' : 'password'} placeholder="Password"
                            value={credEdit.password} onChange={e => setCredEdit(p => ({ ...p, password: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && saveGdtCreds()}
                            className="h-7 px-2 bg-slate-800 border border-white/20 rounded-lg text-white text-[11px] outline-none focus:border-green-500/60 w-32" />
                        <button onClick={() => setShowGdtPass(p => !p)} className="text-slate-500 hover:text-white text-xs">{showGdtPass ? '\u{1F648}' : '\u{1F441}'}</button>
                        <button onClick={saveGdtCreds} className="h-7 px-3 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black rounded-lg border border-green-500 transition active:scale-95">Save</button>
                        <button onClick={() => setShowCredForm(false)} className="h-7 px-2 bg-slate-800 text-slate-500 text-[10px] rounded-lg border border-white/10 transition">\u2715</button>
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-[9px] text-green-400 font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />BA Agent Active
                    </span>
                    <button onClick={() => window.open('https://owp.tax.gov.kh/gdtowpcoreweb/login', '_blank')}
                        className="h-7 px-3 bg-green-700 hover:bg-green-600 text-white text-[9px] font-black uppercase rounded-lg border border-green-600 transition active:scale-95">
                        \u{1F310} New Tab \u2197
                    </button>
                </div>
            </div>

            {/* STEP TABS */}
            <div className="flex shrink-0 bg-[#0a0e18] border-b border-white/5">
                {GDT_LOGIN_STEPS.map(s => (
                    <button key={s.step} onClick={() => setGdtStep(s.step)}
                        className={\`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider border-r border-white/5 last:border-r-0 transition-all \${
                            gdtStep === s.step ? 'bg-white/5 text-white border-b-2 border-b-green-500' :
                            gdtStep > s.step ? 'text-emerald-500' : 'text-slate-600 hover:text-slate-400'
                        }\`}>
                        {gdtStep > s.step ? '\u2713 ' : \`\${s.step}. \`}{s.title}
                    </button>
                ))}
            </div>

            {/* SPLIT BODY */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT: GDT IFRAME */}
                <div className="flex-1 relative overflow-hidden border-r border-white/5">
                    <iframe
                        src="https://owp.tax.gov.kh/gdtowpcoreweb/login"
                        className="absolute inset-0 w-full h-full border-none bg-white"
                        title="GDT e-Tax Portal"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                    />
                    <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                        <div className="bg-black/80 backdrop-blur border border-amber-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                            <span className="text-amber-400 text-[9px] font-bold">\u26A0 Cookies disabled?</span>
                            <span className="text-slate-400 text-[9px]">Click the link in that message OR use \u{1F310} New Tab button above</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: STEP GUIDE PANEL */}
                <div className="w-[295px] shrink-0 flex flex-col bg-[#090d18] overflow-y-auto">
                    {GDT_LOGIN_STEPS.map((s) => {
                        if (s.step !== gdtStep) return null;
                        const cc = {
                            blue:    { hdr: 'bg-blue-900/30 border-blue-500/20 text-blue-400',       btn: 'bg-blue-700 hover:bg-blue-600 border-blue-600',       dot: 'bg-blue-400 text-blue-900'    },
                            violet:  { hdr: 'bg-violet-900/30 border-violet-500/20 text-violet-400', btn: 'bg-violet-700 hover:bg-violet-600 border-violet-600', dot: 'bg-violet-400 text-violet-900' },
                            amber:   { hdr: 'bg-amber-900/30 border-amber-500/20 text-amber-400',    btn: 'bg-amber-700 hover:bg-amber-600 border-amber-600',    dot: 'bg-amber-400 text-amber-900'   },
                            emerald: { hdr: 'bg-emerald-900/30 border-emerald-500/20 text-emerald-400', btn: 'bg-emerald-700 hover:bg-emerald-600 border-emerald-600', dot: 'bg-emerald-400 text-emerald-900' },
                        }[s.color];
                        return (
                            <div key={s.step} className="p-3 flex flex-col gap-3">
                                <div className={\`flex items-center gap-2.5 p-2.5 rounded-xl border \${cc.hdr}\`}>
                                    <span className="text-xl">{s.icon}</span>
                                    <div>
                                        <div className="text-[8px] font-black uppercase opacity-60">Step {s.step} / 4</div>
                                        <div className="font-black text-xs">{s.title}</div>
                                    </div>
                                </div>

                                {s.field && (
                                    <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/60">
                                        <div className="px-3 py-1.5 bg-white/5 text-[8px] font-black text-slate-500 uppercase border-b border-white/5">{s.label}</div>
                                        {gdtCreds[s.field] ? (
                                            <React.Fragment>
                                                <div className="px-3 py-2 flex items-center gap-2">
                                                    <span className="text-white font-mono text-xs font-bold flex-1 truncate">
                                                        {s.field === 'password' && !showGdtPass
                                                            ? '\u2022'.repeat(Math.min((gdtCreds[s.field] || '').length, 10))
                                                            : gdtCreds[s.field]}
                                                    </span>
                                                    {s.field === 'password' && (
                                                        <button onClick={() => setShowGdtPass(p => !p)} className="text-slate-600 hover:text-white text-[10px]">
                                                            {showGdtPass ? '\u{1F648}' : '\u{1F441}'}
                                                        </button>
                                                    )}
                                                    <button onClick={() => copyToClip(gdtCreds[s.field], s.field)}
                                                        className={\`shrink-0 px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border transition active:scale-95 \${
                                                            copiedField === s.field ? 'bg-emerald-600 border-emerald-500 text-white' : \`\${cc.btn} text-white\`}\`}>
                                                        {copiedField === s.field ? '\u2713 Copied' : '\u2398 Copy'}
                                                    </button>
                                                </div>
                                                <div className="px-3 pb-2 text-slate-600 text-[8px]">Copy \u2192 click field in portal \u2192 Ctrl+V to paste</div>
                                            </React.Fragment>
                                        ) : (
                                            <div className="px-3 py-2 text-amber-400 text-[10px] font-bold">\u26A0 No credentials \u2014 click + Add Credentials above</div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <div className="text-slate-600 text-[8px] font-black uppercase tracking-widest mb-2">Instructions</div>
                                    <div className="space-y-1.5">
                                        {s.instructions.map((inst, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <div className={\`w-4 h-4 rounded-full \${cc.dot} flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5\`}>{i + 1}</div>
                                                <span className="text-slate-400 text-[10px] leading-relaxed">{inst}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-white/5">
                                    {s.step > 1 && (
                                        <button onClick={() => setGdtStep(p => p - 1)}
                                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs rounded-xl border border-white/5 transition">\u2190 Back</button>
                                    )}
                                    {s.step < 4 ? (
                                        <button onClick={() => setGdtStep(p => p + 1)}
                                            className={\`flex-1 py-2 text-white font-black text-xs rounded-xl border transition active:scale-[0.98] \${cc.btn}\`}>
                                            {s.step === 3 ? '\u2705 OTP Done \u2192' : 'Done \u2192 Next \u2192'}
                                        </button>
                                    ) : (
                                        <button onClick={() => setView('toi_acar')}
                                            className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl border border-rose-500 transition">
                                            \u{1F4CB} Open TOI Workspace
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* BA AGENT GUIDE */}
                    <div className="mx-3 mb-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
                        <div className="px-3 py-2 bg-indigo-500/10 border-b border-indigo-500/10 flex items-center gap-2">
                            <span className="text-xs">\u{1F916}</span>
                            <span className="text-indigo-400 font-black text-[9px] uppercase tracking-widest">BA Agent Guide</span>
                            <span className="ml-auto text-indigo-700 text-[8px] uppercase">BA-1 &amp; BA-2</span>
                        </div>
                        <div className="p-3 space-y-3">
                            <div>
                                <div className="text-indigo-400 font-black text-[9px] uppercase mb-1.5">How GDT Login Works</div>
                                <div className="text-slate-500 text-[9px] space-y-0.5 leading-relaxed">
                                    <p><b className="text-slate-400">1.</b> Enter MOH ID / TIN (username tab)</p>
                                    <p><b className="text-slate-400">2.</b> Enter GDT portal password</p>
                                    <p><b className="text-slate-400">3.</b> GDT emails OTP to company owner</p>
                                    <p><b className="text-slate-400">4.</b> User enters OTP to complete login</p>
                                    <p><b className="text-slate-400">5.</b> Navigate to Annual Return to file</p>
                                </div>
                            </div>
                            <div className="border-t border-indigo-500/10 pt-2">
                                <div className="text-indigo-400 font-black text-[9px] uppercase mb-1">Credentials</div>
                                <div className="text-slate-500 text-[9px] leading-relaxed">GK SMART admin saves via <b className="text-slate-300">+ Add Credentials</b> top bar. Stored per company, auto-loads each time.</div>
                            </div>
                            <div className="border-t border-indigo-500/10 pt-2">
                                <div className="text-indigo-400 font-black text-[9px] uppercase mb-1.5">Key Filing Dates</div>
                                <div className="flex gap-2">
                                    <div className="flex-1 p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                                        <div className="text-amber-400 font-black text-[10px]">Mar 31</div>
                                        <div className="text-slate-600 text-[8px]">TOI Deadline</div>
                                    </div>
                                    <div className="flex-1 p-1.5 bg-slate-800/50 border border-white/5 rounded-lg text-center">
                                        <div className="text-slate-300 font-black text-[10px]">Apr 30</div>
                                        <div className="text-slate-600 text-[8px]">Tax Payment</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

`;

const newContent = beforeSection + newSection + afterSection;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('SUCCESS: File updated');
console.log('Old length:', content.length, '-> New length:', newContent.length);
