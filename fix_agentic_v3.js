const fs = require('fs');
const filePath = 'e:\\Antigravity\\TOI\\client\\src\\pages\\CompanyProfileNew.jsx';

// Read the clean git-restored file (NEVER read from Out-File copies — they corrupt Khmer)
let content = fs.readFileSync(filePath, 'utf8');

// ── STEP 1: Insert GDT state declarations after existing useState block ──────
// Find a reliable marker after the existing state declarations
const STATE_MARKER = "    const [regenerating, setRegenerating] = useState(false);";
const GDT_STATE = `    const [regenerating, setRegenerating] = useState(false);

    // ── GDT Credential Manager State ─────────────────────────────────────────
    const [gdtCreds, setGdtCreds] = useState({ username: '', password: '' });
    const [showCredForm, setShowCredForm] = useState(false);
    const [credEdit, setCredEdit] = useState({ username: '', password: '' });
    const [showGdtPass, setShowGdtPass] = useState(false);
    const [filingPhase, setFilingPhase] = useState('idle'); // idle|username|password|otp|inside
    const [copiedField, setCopiedField] = useState(null);`;

if (!content.includes(STATE_MARKER)) {
    console.error('STATE_MARKER not found!');
    process.exit(1);
}
content = content.replace(STATE_MARKER, GDT_STATE);
console.log('✓ GDT state declarations inserted');

// ── STEP 2: Find where to add GDT helper functions (after useEffect blocks) ──
// Insert before the renderAgenticFiling function
const AGENTIC_MARKER = '    // --- Agentic Filing (4th Module) ---';
const idx = content.indexOf(AGENTIC_MARKER);
if (idx === -1) {
    console.error('AGENTIC_MARKER not found!');
    process.exit(1);
}

// ── STEP 3: Find end marker ───────────────────────────────────────────────────
const END_MARKER = '    // --- IEWS Placeholder ---';
const endIdx = content.indexOf(END_MARKER);
if (endIdx === -1) {
    console.error('END_MARKER not found!');
    process.exit(1);
}
console.log(`✓ Found agentic section: lines ${idx} to ${endIdx}`);

// ── STEP 4: Build the replacement ─────────────────────────────────────────────
const AGENTIC_SECTION = `    // --- Agentic Filing Hub (4th Module) ---
    // GDT helper functions (state declared at component level above)
    const currentFilingYear = new Date().getFullYear() - 1;

    const saveGdtCreds = () => {
        const c = { username: credEdit.username.trim(), password: credEdit.password };
        const key = \`gdtCreds_\${formData?.companyCode || 'default'}\`;
        localStorage.setItem(key, JSON.stringify(c));
        setGdtCreds(c);
        setShowCredForm(false);
    };

    const copyToClip = (text, field) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        });
    };

    const launchGdtSession = () => {
        window.open('https://owp.tax.gov.kh/gdtowpcoreweb/login', '_blank');
        setFilingPhase('username');
    };

    // Load saved creds when company changes
    React.useEffect(() => {
        if (!formData?.companyCode) return;
        const key = \`gdtCreds_\${formData.companyCode}\`;
        try {
            const saved = JSON.parse(localStorage.getItem(key) || 'null');
            if (saved) setGdtCreds(saved);
        } catch {}
    }, [formData?.companyCode]);

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
                        <input autoFocus type="text" placeholder="GDT Email / TIN"
                            value={credEdit.username} onChange={e => setCredEdit(p => ({ ...p, username: e.target.value }))}
                            className="h-7 px-2 bg-slate-800 border border-white/20 rounded-lg text-white text-[11px] outline-none focus:border-green-500/60 w-44" />
                        <input type={showGdtPass ? 'text' : 'password'} placeholder="GDT Password"
                            value={credEdit.password} onChange={e => setCredEdit(p => ({ ...p, password: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && saveGdtCreds()}
                            className="h-7 px-2 bg-slate-800 border border-white/20 rounded-lg text-white text-[11px] outline-none focus:border-green-500/60 w-36" />
                        <button onClick={() => setShowGdtPass(p => !p)} className="text-slate-500 hover:text-white text-xs px-1">{showGdtPass ? '\u{1F648}' : '\u{1F441}\uFE0F'}</button>
                        <button onClick={saveGdtCreds} className="h-7 px-3 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black rounded-lg border border-green-500 transition active:scale-95">Save</button>
                        <button onClick={() => setShowCredForm(false)} className="h-7 px-2 bg-slate-800 text-slate-500 text-[10px] rounded-lg border border-white/10 transition">\u2715</button>
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-[9px] text-green-400 font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />BA Agent Active
                    </span>
                </div>
            </div>

            {/* PHASE STEP TABS */}
            <div className="flex shrink-0 bg-[#0a0e18] border-b border-white/5">
                {[
                    { key: 'idle',     label: 'Ready'         },
                    { key: 'username', label: '1. Username'   },
                    { key: 'password', label: '2. Password'   },
                    { key: 'otp',      label: '3. OTP Code'   },
                    { key: 'inside',   label: '\u2713 Logged In' },
                ].map(p => {
                    const phases = ['idle','username','password','otp','inside'];
                    const done = phases.indexOf(p.key) < phases.indexOf(filingPhase);
                    const active = p.key === filingPhase;
                    return (
                        <div key={p.key} className={\`flex-1 py-1.5 text-center text-[9px] font-black uppercase tracking-wider border-r border-white/5 last:border-r-0 \${
                            active ? 'bg-white/5 text-white border-b-2 border-b-green-500' :
                            done   ? 'text-emerald-500 bg-emerald-500/5' : 'text-slate-700'
                        }\`}>
                            {done ? '\u2713 ' : ''}{p.label}
                        </div>
                    );
                })}
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
                        <div className="bg-black/70 backdrop-blur border border-white/10 rounded-lg px-3 py-1 flex items-center gap-2">
                            <span className="text-slate-400 text-[9px]">Cookies disabled in iframe?</span>
                            <button className="pointer-events-auto text-green-400 text-[9px] font-bold underline"
                                onClick={() => window.open('https://owp.tax.gov.kh/gdtowpcoreweb/login', '_blank')}>
                                Open GDT in New Tab \u2197
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: GUIDE PANEL */}
                <div className="w-[300px] shrink-0 flex flex-col bg-[#090d18] overflow-y-auto">

                    {/* IDLE: LAUNCH */}
                    {filingPhase === 'idle' && (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="p-5 bg-green-500/5 border border-green-500/20 rounded-2xl text-center">
                                <div className="text-4xl mb-2">\u{1F916}</div>
                                <div className="text-green-400 font-black text-sm mb-1">BA Filing Agent</div>
                                <div className="text-slate-400 text-xs leading-relaxed mb-4">
                                    Opens GDT in a new tab. You paste credentials from this panel. You type the OTP from your email.
                                </div>
                                {gdtCreds.username ? (
                                    <button onClick={launchGdtSession}
                                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-sm rounded-xl border border-green-500 shadow-lg shadow-green-900/30 transition active:scale-[0.98]">
                                        \u{1F680} Launch Filing Session
                                    </button>
                                ) : (
                                    <div className="w-full py-3 bg-slate-800/50 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-xl text-center">
                                        \u26A0 Add GDT credentials first (top bar above)
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                {[
                                    { icon: '\u{1F310}', text: 'GDT opens in new browser tab', c: 'text-blue-400' },
                                    { icon: '\u{1F464}', text: 'Copy & paste username below', c: 'text-violet-400' },
                                    { icon: '\u{1F511}', text: 'Copy & paste password below', c: 'text-violet-400' },
                                    { icon: '\u{1F4E7}', text: 'GDT emails OTP to company owner', c: 'text-amber-400' },
                                    { icon: '\u2705', text: 'You type OTP \u2192 Inside GDT!', c: 'text-emerald-400' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className={item.c + ' text-base shrink-0'}>{item.icon}</span>
                                        <span className="text-slate-400 text-[10px]">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                                <div className="text-indigo-400 font-black text-[9px] uppercase mb-2">\u{1F916} BA-1 & BA-2 Note</div>
                                <div className="text-slate-500 text-[9px] leading-relaxed">GDT uses 3-factor login: Username \u2192 Password \u2192 OTP email code. OTP goes to company owner email and must be entered manually.</div>
                            </div>
                        </div>
                    )}

                    {/* USERNAME PHASE */}
                    {filingPhase === 'username' && (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-blue-900/30 border-blue-500/20 text-blue-400">
                                <span className="text-xl">\u{1F464}</span>
                                <div><div className="text-[8px] font-black uppercase opacity-60">Step 1 of 3</div><div className="font-black text-xs">Enter Username / TIN</div></div>
                            </div>
                            <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/60">
                                <div className="px-3 py-1.5 bg-white/5 text-[8px] font-black text-slate-500 uppercase border-b border-white/5">GDT Email / TIN / Username</div>
                                <div className="px-3 py-2.5 flex items-center gap-2">
                                    <span className="text-white font-mono text-sm font-black flex-1 truncate">{gdtCreds.username || '\u2014'}</span>
                                    <button onClick={() => copyToClip(gdtCreds.username, 'username')}
                                        className={\`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition active:scale-95 \${copiedField === 'username' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-blue-700 hover:bg-blue-600 border-blue-600 text-white'}\`}>
                                        {copiedField === 'username' ? '\u2713 Copied!' : '\u2398 Copy'}
                                    </button>
                                </div>
                                <div className="px-3 pb-2 text-slate-600 text-[8px]">Copy \u2192 click field in GDT tab \u2192 Ctrl+V</div>
                            </div>
                            <div className="space-y-1.5">
                                {['In the GDT tab: select TIN or Email tab','Click the username/email field','Ctrl+V to paste','Click Continue (\u1794\u1793\u17D2\u178F)'].map((t,i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <div className="w-4 h-4 rounded-full bg-blue-400 text-blue-900 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">{i+1}</div>
                                        <span className="text-slate-400 text-[10px] leading-relaxed">{t}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setFilingPhase('password')} className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-black text-xs rounded-xl border border-blue-600 transition active:scale-[0.98]">Done \u2014 Move to Password \u2192</button>
                            <button onClick={() => setFilingPhase('idle')} className="w-full py-1.5 text-slate-600 hover:text-slate-400 text-[10px] transition">\u2190 Back</button>
                        </div>
                    )}

                    {/* PASSWORD PHASE */}
                    {filingPhase === 'password' && (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-violet-900/30 border-violet-500/20 text-violet-400">
                                <span className="text-xl">\u{1F511}</span>
                                <div><div className="text-[8px] font-black uppercase opacity-60">Step 2 of 3</div><div className="font-black text-xs">Enter Password</div></div>
                            </div>
                            <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/60">
                                <div className="px-3 py-1.5 bg-white/5 text-[8px] font-black text-slate-500 uppercase border-b border-white/5">GDT Password</div>
                                <div className="px-3 py-2.5 flex items-center gap-2">
                                    <span className="text-white font-mono text-sm font-black flex-1 truncate">
                                        {showGdtPass ? (gdtCreds.password || '\u2014') : '\u2022'.repeat(Math.min((gdtCreds.password||'').length||8,12))}
                                    </span>
                                    <button onClick={() => setShowGdtPass(p => !p)} className="text-slate-500 hover:text-white text-xs px-1">{showGdtPass ? '\u{1F648}' : '\u{1F441}\uFE0F'}</button>
                                    <button onClick={() => copyToClip(gdtCreds.password, 'password')}
                                        className={\`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition active:scale-95 \${copiedField === 'password' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-violet-700 hover:bg-violet-600 border-violet-600 text-white'}\`}>
                                        {copiedField === 'password' ? '\u2713 Copied!' : '\u2398 Copy'}
                                    </button>
                                </div>
                                <div className="px-3 pb-2 text-slate-600 text-[8px]">Copy \u2192 click password field in GDT tab \u2192 Ctrl+V</div>
                            </div>
                            <div className="space-y-1.5">
                                {['GDT shows the password field after username','Click the password field in GDT tab','Ctrl+V to paste the password','Click Login (\u1785\u17BC\u179B) \u2014 GDT will send OTP email'].map((t,i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <div className="w-4 h-4 rounded-full bg-violet-400 text-violet-900 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">{i+1}</div>
                                        <span className="text-slate-400 text-[10px] leading-relaxed">{t}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setFilingPhase('otp')} className="w-full py-2.5 bg-violet-700 hover:bg-violet-600 text-white font-black text-xs rounded-xl border border-violet-600 transition">Logged In \u2014 Enter OTP \u2192</button>
                            <button onClick={() => setFilingPhase('username')} className="w-full py-1.5 text-slate-600 hover:text-slate-400 text-[10px] transition">\u2190 Back</button>
                        </div>
                    )}

                    {/* OTP PHASE */}
                    {filingPhase === 'otp' && (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-amber-900/30 border-amber-500/20 text-amber-400">
                                <span className="text-xl">\u{1F4E7}</span>
                                <div><div className="text-[8px] font-black uppercase opacity-60">Step 3 of 3 \u2014 Manual</div><div className="font-black text-xs">Enter OTP from Email</div></div>
                            </div>
                            <div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl text-center">
                                <div className="text-3xl mb-2">\u{1F4EC}</div>
                                <div className="text-amber-400 font-black text-sm mb-1">Check Company Email</div>
                                <div className="text-slate-400 text-xs">GDT sent OTP to the company owner's registered email</div>
                            </div>
                            <div className="space-y-1.5">
                                {['Open the GDT-registered company email inbox','Find OTP email from tax.gov.kh','Copy the 4-6 digit OTP code','In GDT tab: paste OTP into verification field','Click Confirm (\u1794\u1789\u17D2\u1787\u17B6\u1780\u17CB) to complete login'].map((t,i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <div className="w-4 h-4 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">{i+1}</div>
                                        <span className="text-slate-400 text-[10px] leading-relaxed">{t}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-2.5 bg-slate-800/40 border border-white/5 rounded-xl text-slate-500 text-[9px]">\u{1F552} OTP expires in <b className="text-amber-400">5 minutes</b>. If expired, refresh GDT and repeat from step 1.</div>
                            <button onClick={() => setFilingPhase('inside')} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl border border-amber-500 transition">\u2705 OTP Done \u2014 I'm In!</button>
                            <button onClick={() => setFilingPhase('password')} className="w-full py-1.5 text-slate-600 hover:text-slate-400 text-[10px] transition">\u2190 Back</button>
                        </div>
                    )}

                    {/* INSIDE PHASE */}
                    {filingPhase === 'inside' && (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="p-5 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl text-center">
                                <div className="text-4xl mb-2">\u{1F389}</div>
                                <div className="text-emerald-400 font-black text-sm mb-1">Logged In!</div>
                                <div className="text-slate-400 text-xs">You are inside the GDT e-Tax portal</div>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { icon: '\u{1F4C4}', text: 'Click "Tax on Income - ToI E-Filing"', c: 'text-rose-400' },
                                    { icon: '\u{1F4C5}', text: 'Select Tax Year ' + (new Date().getFullYear()-1), c: 'text-blue-400' },
                                    { icon: '\u{1F4CE}', text: 'Upload TOI 01 PDF + financial statements', c: 'text-violet-400' },
                                    { icon: '\u{1F4E4}', text: 'Click Submit (\u178A\u17B6\u1780\u179F\u17D2\u1793\u17BE)', c: 'text-green-400' },
                                    { icon: '\u{1F4CB}', text: 'Save the acknowledgement number', c: 'text-amber-400' },
                                ].map((item,i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <span className={item.c + ' text-base shrink-0'}>{item.icon}</span>
                                        <span className="text-slate-300 text-[11px]">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setView('toi_acar')} className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl border border-rose-500 transition">\u{1F4CB} Open TOI & ACAR Workspace</button>
                            <button onClick={() => setFilingPhase('idle')} className="w-full py-1.5 text-slate-600 hover:text-slate-400 text-[10px] transition">\u21BA Reset Session</button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );

`;

// ── STEP 5: Replace the section ───────────────────────────────────────────────
const before = content.substring(0, idx);
const after = content.substring(endIdx);
const newContent = before + AGENTIC_SECTION + after;

// Write to the actual target file
// Normalize to CRLF (match the original file's line endings)
const normalized = newContent.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, Buffer.from(normalized, 'utf8'));
console.log('✓ File written to', filePath);
console.log('  Length:', newContent.length, 'chars');

// Build the frontend
console.log('\nNow run: npm run build in client directory');
