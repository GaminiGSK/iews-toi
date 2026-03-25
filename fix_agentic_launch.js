const fs = require('fs');

const filePath = 'e:\\Antigravity\\TOI\\client\\src\\pages\\CompanyProfileNew.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the old start marker to end marker
const startMarker = '    // --- Agentic Filing Hub (4th Module) ---';
const endMarker = '    // --- IEWS Placeholder ---';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) {
    console.error('Markers not found:', { startIdx, endIdx });
    process.exit(1);
}

console.log(`Found section: ${startIdx} -> ${endIdx} (${endIdx - startIdx} chars)`);

const beforeSection = content.substring(0, startIdx);
const afterSection = content.substring(endIdx);

const newSection = `    // --- Agentic Filing Hub (4th Module) ---
    const currentFilingYear = new Date().getFullYear() - 1;

    // GDT Credentials — stored per company
    const credKey = \`gdtCreds_\${formData?.companyCode || 'default'}\`;
    const [gdtCreds, setGdtCreds] = React.useState(() => {
        try { return JSON.parse(localStorage.getItem(credKey) || 'null') || { username: '', password: '' }; }
        catch { return { username: '', password: '' }; }
    });
    const [showCredForm, setShowCredForm] = React.useState(false);
    const [credEdit, setCredEdit] = React.useState({ username: '', password: '' });
    const [showGdtPass, setShowGdtPass] = React.useState(false);
    const [filingPhase, setFilingPhase] = React.useState('idle'); // idle | user | password | otp | inside
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
    const launchGdtSession = () => {
        window.open('https://owp.tax.gov.kh/gdtowpcoreweb/login', '_blank');
        setFilingPhase('username');
    };

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
                            <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">GDT Acct:</span>
                            <span className="text-slate-200 text-[10px] font-black">{gdtCreds.username || <span className="text-slate-600 italic">not set</span>}</span>
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

            {/* PHASE STEPS BAR */}
            <div className="flex shrink-0 bg-[#0a0e18] border-b border-white/5">
                {[
                    { key: 'idle',     label: 'Ready',           short: '0' },
                    { key: 'username', label: '1. Username',      short: '1' },
                    { key: 'password', label: '2. Password',      short: '2' },
                    { key: 'otp',      label: '3. OTP Code',      short: '3' },
                    { key: 'inside',   label: '\u2713 Logged In', short: '\u2713' },
                ].map((p, i) => {
                    const phases = ['idle','username','password','otp','inside'];
                    const pIdx = phases.indexOf(p.key);
                    const curIdx = phases.indexOf(filingPhase);
                    const done = pIdx < curIdx;
                    const active = p.key === filingPhase;
                    return (
                        <div key={p.key} className={\`flex-1 py-1.5 text-center text-[9px] font-black uppercase tracking-wider border-r border-white/5 last:border-r-0 transition-all \${
                            active ? 'bg-white/5 text-white border-b-2 border-b-green-500' :
                            done ? 'text-emerald-500 bg-emerald-500/5' : 'text-slate-700'
                        }\`}>
                            {done ? '\u2713 ' : ''}{p.label}
                        </div>
                    );
                })}
            </div>

            {/* SPLIT: GDT IFRAME (LEFT) + GUIDE (RIGHT) */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT: GDT PORTAL IFRAME */}
                <div className="flex-1 relative overflow-hidden border-r border-white/5">
                    <iframe
                        src="https://owp.tax.gov.kh/gdtowpcoreweb/login"
                        className="absolute inset-0 w-full h-full border-none bg-white"
                        title="GDT e-Tax Portal"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                    />
                    {/* Subtle hint at bottom */}
                    <div className="absolute bottom-2 left-2 right-80 pointer-events-none">
                        <div className="bg-black/70 backdrop-blur border border-white/10 rounded-lg px-3 py-1 flex items-center gap-2">
                            <span className="text-slate-400 text-[9px]">If portal shows "Cookies disabled" \u2192 follow the link in that message, or</span>
                            <button className="pointer-events-auto text-green-400 text-[9px] font-bold underline cursor-pointer"
                                onClick={() => window.open('https://owp.tax.gov.kh/gdtowpcoreweb/login', '_blank')}>
                                open in new tab \u2197
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: AGENT CONTROL PANEL */}
                <div className="w-[310px] shrink-0 flex flex-col bg-[#090d18] overflow-y-auto">

                    {/* ── PHASE: IDLE ─────────────────── */}
                    {filingPhase === 'idle' && (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 text-center">
                                <div className="text-4xl mb-3">\u{1F916}</div>
                                <div className="text-green-400 font-black text-sm mb-1">BA Filing Agent</div>
                                <div className="text-slate-400 text-xs leading-relaxed mb-4">
                                    Agent will open the GDT e-Tax portal in a new browser tab, then guide you to fill your credentials. You only need to enter the OTP code sent to your email.
                                </div>
                                {gdtCreds.username ? (
                                    <button onClick={launchGdtSession}
                                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-sm rounded-xl border border-green-500 shadow-lg shadow-green-900/30 transition active:scale-[0.98]">
                                        \u{1F680} Launch Filing Session
                                    </button>
                                ) : (
                                    <div className="w-full py-3 bg-slate-800/50 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-xl text-center">
                                        \u26A0 Set GDT credentials first (top bar above)
                                    </div>
                                )}
                            </div>

                            {/* What happens next */}
                            <div className="rounded-xl border border-white/5 bg-slate-900/40 p-4">
                                <div className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-3">What Happens</div>
                                <div className="space-y-2">
                                    {[
                                        { step: '1', text: 'Agent opens GDT login page in new tab', icon: '\u{1F310}', c: 'text-blue-400' },
                                        { step: '2', text: 'You paste username (one click)', icon: '\u{1F464}', c: 'text-violet-400' },
                                        { step: '3', text: 'You paste password (one click)', icon: '\u{1F511}', c: 'text-violet-400' },
                                        { step: '4', text: 'GDT sends OTP to company email', icon: '\u{1F4E7}', c: 'text-amber-400' },
                                        { step: '5', text: 'You type OTP \u2192 Land on dashboard', icon: '\u2705', c: 'text-emerald-400' },
                                    ].map(item => (
                                        <div key={item.step} className="flex items-start gap-2.5">
                                            <span className={item.c + ' text-base shrink-0'}>{item.icon}</span>
                                            <span className="text-slate-400 text-[10px] leading-relaxed">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* BA Guide */}
                            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                                <div className="text-indigo-400 font-black text-[9px] uppercase mb-2">\u{1F916} BA-1 &amp; BA-2 Note</div>
                                <div className="text-slate-500 text-[9px] leading-relaxed space-y-1">
                                    <p>GDT uses a 3-factor login: Username \u2192 Password \u2192 OTP Email. The OTP is sent to the company owner's registered email and is required every session.</p>
                                    <p className="text-slate-600 pt-1">After login, navigate to: <b className="text-slate-400">Tax on Income - ToI E-Filing</b></p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PHASE: USERNAME ─────────────── */}
                    {filingPhase === 'username' && (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-blue-900/30 border-blue-500/20 text-blue-400">
                                <span className="text-xl">\u{1F464}</span>
                                <div>
                                    <div className="text-[8px] font-black uppercase opacity-60">Step 1 of 3</div>
                                    <div className="font-black text-xs">Enter Username / TIN</div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/60">
                                <div className="px-3 py-1.5 bg-white/5 text-[8px] font-black text-slate-500 uppercase border-b border-white/5">GDT Username / TIN</div>
                                <div className="px-3 py-2.5 flex items-center gap-2">
                                    <span className="text-white font-mono text-sm font-black flex-1">{gdtCreds.username || '—'}</span>
                                    <button onClick={() => copyToClip(gdtCreds.username, 'username')}
                                        className={\`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition active:scale-95 \${
                                            copiedField === 'username' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-blue-700 hover:bg-blue-600 border-blue-600 text-white'}\`}>
                                        {copiedField === 'username' ? '\u2713 Copied!' : '\u2398 Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-slate-600 text-[8px] font-black uppercase tracking-widest">Steps in the GDT Tab:</div>
                                {[
                                    'In the GDT tab that just opened, select the TIN tab (or MOH ID)',
                                    'Click the username / TIN field',
                                    'Press Ctrl+V to paste the copied value',
                                    'Click \u1794\u1793\u17D2\u178F (Continue) to proceed to password',
                                ].map((t, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <div className="w-4 h-4 rounded-full bg-blue-400 text-blue-900 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">{i+1}</div>
                                        <span className="text-slate-400 text-[10px] leading-relaxed">{t}</span>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => setFilingPhase('password')}
                                className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-black text-xs rounded-xl border border-blue-600 transition active:scale-[0.98]">
                                Done \u2014 Move to Password \u2192
                            </button>
                            <button onClick={() => setFilingPhase('idle')} className="w-full py-1.5 text-slate-600 hover:text-slate-400 text-[10px] transition">\u2190 Back</button>
                        </div>
                    )}

                    {/* ── PHASE: PASSWORD ─────────────── */}
                    {filingPhase === 'password' && (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-violet-900/30 border-violet-500/20 text-violet-400">
                                <span className="text-xl">\u{1F511}</span>
                                <div>
                                    <div className="text-[8px] font-black uppercase opacity-60">Step 2 of 3</div>
                                    <div className="font-black text-xs">Enter Password</div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/60">
                                <div className="px-3 py-1.5 bg-white/5 text-[8px] font-black text-slate-500 uppercase border-b border-white/5">GDT Password</div>
                                <div className="px-3 py-2.5 flex items-center gap-2">
                                    <span className="text-white font-mono text-sm font-black flex-1">
                                        {showGdtPass ? (gdtCreds.password || '—') : '\u2022'.repeat(Math.min((gdtCreds.password || '').length || 8, 12))}
                                    </span>
                                    <button onClick={() => setShowGdtPass(p => !p)} className="text-slate-500 hover:text-white text-xs px-1">{showGdtPass ? '\u{1F648}' : '\u{1F441}\uFE0F'}</button>
                                    <button onClick={() => copyToClip(gdtCreds.password, 'password')}
                                        className={\`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition active:scale-95 \${
                                            copiedField === 'password' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-violet-700 hover:bg-violet-600 border-violet-600 text-white'}\`}>
                                        {copiedField === 'password' ? '\u2713 Copied!' : '\u2398 Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-slate-600 text-[8px] font-black uppercase tracking-widest">Steps in the GDT Tab:</div>
                                {[
                                    'GDT now shows the password input field',
                                    'Click the password field',
                                    'Press Ctrl+V to paste the copied password',
                                    'Click \u1785\u17BC\u179B (Login) — GDT will send OTP to company email',
                                ].map((t, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <div className="w-4 h-4 rounded-full bg-violet-400 text-violet-900 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">{i+1}</div>
                                        <span className="text-slate-400 text-[10px] leading-relaxed">{t}</span>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => setFilingPhase('otp')}
                                className="w-full py-2.5 bg-violet-700 hover:bg-violet-600 text-white font-black text-xs rounded-xl border border-violet-600 transition active:scale-[0.98]">
                                Logged In \u2014 Enter OTP \u2192
                            </button>
                            <button onClick={() => setFilingPhase('username')} className="w-full py-1.5 text-slate-600 hover:text-slate-400 text-[10px] transition">\u2190 Back</button>
                        </div>
                    )}

                    {/* ── PHASE: OTP ──────────────────── */}
                    {filingPhase === 'otp' && (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-amber-900/30 border-amber-500/20 text-amber-400">
                                <span className="text-xl">\u{1F4E7}</span>
                                <div>
                                    <div className="text-[8px] font-black uppercase opacity-60">Step 3 of 3 — Manual</div>
                                    <div className="font-black text-xs">Enter OTP from Email</div>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl text-center">
                                <div className="text-3xl mb-2">\u{1F4EC}</div>
                                <div className="text-amber-400 font-black text-sm mb-1">Check Company Email</div>
                                <div className="text-slate-400 text-xs leading-relaxed">
                                    GDT has sent a One-Time Password to the company owner's registered email address
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-slate-600 text-[8px] font-black uppercase tracking-widest">Do This Now:</div>
                                {[
                                    'Open the company email inbox (registered with GDT)',
                                    'Find the email from GDT / tax.gov.kh with subject "OTP" or "Verification"',
                                    'Copy the 4-6 digit OTP code from the email',
                                    'Switch to the GDT tab and enter the OTP in the verification field',
                                    'Click Confirm (\u1794\u1789\u17D2\u1787\u17B6\u1780\u17CB)',
                                ].map((t, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <div className="w-4 h-4 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">{i+1}</div>
                                        <span className="text-slate-400 text-[10px] leading-relaxed">{t}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 bg-slate-800/40 border border-white/5 rounded-xl">
                                <div className="text-slate-500 text-[9px] leading-relaxed">
                                    \u{1F552} OTP expires in <b className="text-amber-400">5 minutes</b>. If it expires, refresh the GDT page and repeat from Step 1.
                                </div>
                            </div>

                            <button onClick={() => setFilingPhase('inside')}
                                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl border border-amber-500 transition active:scale-[0.98]">
                                \u2705 OTP Entered \u2014 I'm In!
                            </button>
                            <button onClick={() => setFilingPhase('password')} className="w-full py-1.5 text-slate-600 hover:text-slate-400 text-[10px] transition">\u2190 Back</button>
                        </div>
                    )}

                    {/* ── PHASE: INSIDE ───────────────── */}
                    {filingPhase === 'inside' && (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="p-5 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl text-center">
                                <div className="text-4xl mb-2">\u{1F389}</div>
                                <div className="text-emerald-400 font-black text-sm mb-1">Logged In!</div>
                                <div className="text-slate-400 text-xs">You are now inside the GDT e-Tax portal</div>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-slate-900/40 p-4">
                                <div className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-3">Now File Your TOI Return:</div>
                                <div className="space-y-2">
                                    {[
                                        { icon: '\u{1F4C4}', text: 'Click "Tax on Income - ToI E-Filing"', c: 'text-rose-400' },
                                        { icon: '\u{1F4C5}', text: 'Select Tax Year ' + currentFilingYear, c: 'text-blue-400' },
                                        { icon: '\u{1F4CE}', text: 'Attach TOI 01 form PDF + financial statements', c: 'text-violet-400' },
                                        { icon: '\u{1F4E4}', text: 'Click Submit (\u178A\u17B6\u1780\u179F\u17D2\u1793\u17BE)', c: 'text-green-400' },
                                        { icon: '\u{1F4CB}', text: 'Save the acknowledgement / reference number', c: 'text-amber-400' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <span className={item.c + ' text-base shrink-0'}>{item.icon}</span>
                                            <span className="text-slate-300 text-[11px] leading-relaxed">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => setView('toi_acar')}
                                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl border border-rose-500 transition active:scale-[0.98]">
                                \u{1F4CB} Open TOI &amp; ACAR Workspace
                            </button>
                            <button onClick={() => setFilingPhase('idle')}
                                className="w-full py-1.5 text-slate-600 hover:text-slate-400 text-[10px] transition">\u21BA Reset Session</button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );

`;

const newContent = beforeSection + newSection + afterSection;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('SUCCESS: File updated');
console.log('Old:', content.length, '-> New:', newContent.length);
