#!/usr/bin/env python3
"""
Replace ONLY the interior content of Page 2 shareholder tables.
Strategy: delete lines 1585..1787 (0-indexed 1584..1786) and insert new dynamic content
that ends with the EXACT same 3 closing divs as the original (lines 1785-1787):
  '                  </div>\n'   (18 spaces)
  '                </div>\n'     (16 spaces) 
  '              </div>\n'       (14 spaces)
"""
path = r'client/src/pages/LiveTaxWorkspace.jsx'

with open(path, encoding='utf-8') as f:
    raw = f.read()

# Normalize line endings to \n for processing, remember original had \r\n
had_crlf = '\r\n' in raw
content = raw.replace('\r\n', '\n')
lines = content.split('\n')

print(f'Input: {len(lines)} lines, CRLF={had_crlf}')
print(f'L1785: {repr(lines[1784][:50])}')
print(f'L1786: {repr(lines[1785][:50])}')
print(f'L1787: {repr(lines[1786][:50])}')

# Validate we are cutting the right thing
assert 'bg-white/[0.04] border-b border-white/10 px-4' in lines[1584], f"Unexpected line 1585: {lines[1584][:80]}"
assert '</div>' in lines[1786] and lines[1786].startswith('              </div>'), f"Unexpected line 1787: {lines[1786]}"

START = 1584  # 0-indexed inclusive
END   = 1786  # 0-indexed inclusive

NEW = """\
                  {/* SECTION A: REGISTERED CAPITAL — dynamic */}
                  <div className="bg-emerald-950/30 border-b border-white/10 px-4 py-2 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-xs" style={{ fontFamily: 'Kantumruy Pro, sans-serif' }}>
                        ក. មូលធន/មូលធនភាគហ៊ុនចុះបញ្ជី
                      </span>
                      <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider">A. Registered Capital / Share Capital</span>
                    </div>
                    {(formData.shareholders?.length > 0) && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ✦ {formData.shareholders.length} shareholder{formData.shareholders.length > 1 ? 's' : ''} auto-detected
                      </span>
                    )}
                  </div>
                  {(formData.shareholders?.length > 0 ? formData.shareholders : [{ name:'', address:'', position:'', pctStart:'', amtStart:'', pctEnd:'', amtEnd:'' }]).map((sh, i) => (
                    <div key={i} className="flex border-b border-white/10 min-h-[40px] hover:bg-white/[0.04] transition-colors group">
                      <div className="w-[20%] border-r border-white/10 p-1 flex items-center gap-1">
                        <span className="text-slate-600 text-[10px] font-mono w-4 shrink-0 text-center">{i+1}</span>
                        <input type="text" className="w-full bg-transparent outline-none text-white text-xs font-bold" placeholder="Name..."
                          value={sh.name || ''}
                          onChange={(e) => { const a=[...(formData.shareholders||[{}])]; a[i]={...a[i],name:e.target.value}; handleFormChange('shareholders',a); }}
                        />
                      </div>
                      <div className="w-[18%] border-r border-white/10 p-1">
                        <input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs px-1" placeholder="Address / Country..."
                          value={sh.address || ''}
                          onChange={(e) => { const a=[...(formData.shareholders||[{}])]; a[i]={...a[i],address:e.target.value}; handleFormChange('shareholders',a); }}
                        />
                      </div>
                      <div className="w-[12%] border-r border-white/10 p-1">
                        <input type="text" className="w-full h-full bg-transparent outline-none text-white text-xs text-center" placeholder="Role..."
                          value={sh.position || ''}
                          onChange={(e) => { const a=[...(formData.shareholders||[{}])]; a[i]={...a[i],position:e.target.value}; handleFormChange('shareholders',a); }}
                        />
                      </div>
                      <div className="flex-1 flex">
                        <div className="w-1/2 flex border-r border-white/10">
                          <div className="w-[30%] border-r border-white/10 flex items-center justify-center">
                            <input type="text" className="w-full bg-transparent outline-none text-white text-center text-xs" placeholder="%"
                              value={sh.pctStart || ''}
                              onChange={(e) => { const a=[...(formData.shareholders||[{}])]; a[i]={...a[i],pctStart:e.target.value}; handleFormChange('shareholders',a); }}
                            />
                          </div>
                          <div className="flex-1 p-1">
                            <input type="text" className="w-full h-full bg-transparent outline-none text-emerald-300 text-xs text-right font-bold" placeholder="0.00"
                              value={sh.amtStart || ''}
                              onChange={(e) => { const a=[...(formData.shareholders||[{}])]; a[i]={...a[i],amtStart:e.target.value}; handleFormChange('shareholders',a); }}
                            />
                          </div>
                        </div>
                        <div className="flex-1 flex">
                          <div className="w-[30%] border-r border-white/10 flex items-center justify-center">
                            <input type="text" className="w-full bg-transparent outline-none text-white text-center text-xs" placeholder="%"
                              value={sh.pctEnd || ''}
                              onChange={(e) => { const a=[...(formData.shareholders||[{}])]; a[i]={...a[i],pctEnd:e.target.value}; handleFormChange('shareholders',a); }}
                            />
                          </div>
                          <div className="flex-1 p-1 flex items-center gap-0.5">
                            <input type="text" className="flex-1 h-full bg-transparent outline-none text-emerald-300 text-xs text-right font-bold" placeholder="0.00"
                              value={sh.amtEnd || ''}
                              onChange={(e) => { const a=[...(formData.shareholders||[{}])]; a[i]={...a[i],amtEnd:e.target.value}; handleFormChange('shareholders',a); }}
                            />
                            {(formData.shareholders?.length > 1) && (
                              <button onClick={() => handleFormChange('shareholders',(formData.shareholders||[]).filter((_,idx)=>idx!==i))}
                                className="opacity-0 group-hover:opacity-100 text-rose-500 text-[10px] font-black transition-opacity shrink-0 px-0.5">✕</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex border-b border-white/10 h-7 bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer transition-colors"
                    onClick={() => handleFormChange('shareholders', [...(formData.shareholders||[]), {name:'',address:'',position:'Shareholder',pctStart:'',amtStart:'',pctEnd:'',amtEnd:''}])}>
                    <div className="w-full flex items-center justify-center text-slate-700 hover:text-slate-400 text-[10px] font-black uppercase tracking-widest transition-colors">
                      + Add Shareholder Row
                    </div>
                  </div>
                  <div className="flex h-10 bg-white/[0.04] border-b border-white/10">
                    <div className="w-[50%] border-r border-white/10 flex items-center px-4 gap-2">
                      <span className="text-white font-bold text-xs" style={{ fontFamily: 'Kantumruy Pro, sans-serif' }}>សរុប</span>
                      <span className="text-slate-500 text-[9px] font-black uppercase">Total</span>
                    </div>
                    <div className="flex-1 flex">
                      <div className="w-1/2 flex border-r border-white/10">
                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center font-black text-rose-400 text-[10px]">100%</div>
                        <div className="flex-1 p-2 flex items-center justify-end font-black text-emerald-400 text-[10px]">{formData.share_capital_total || '-'}</div>
                      </div>
                      <div className="flex-1 flex font-black">
                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center text-rose-400 text-[10px]">100%</div>
                        <div className="flex-1 p-2 flex items-center justify-end text-emerald-400 text-[10px]">{formData.share_capital_total || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION B: PAID-UP CAPITAL — mirrors Section A */}
                  <div className="bg-sky-950/20 border-y border-white/10 px-4 py-2 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-xs" style={{ fontFamily: 'Kantumruy Pro, sans-serif' }}>ខ. មូលធន/មូលធនភាគហ៊ុន (បានបង់)</span>
                      <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider">B. Paid up Capital / Share Capital</span>
                    </div>
                    <span className="text-[9px] text-slate-600 italic font-bold">↑ auto-mirrors Section A</span>
                  </div>
                  {(formData.shareholders?.length > 0 ? formData.shareholders : [{}]).map((sh, i) => (
                    <div key={i} className="flex border-b border-white/10 min-h-[40px] bg-sky-950/10">
                      <div className="w-[20%] border-r border-white/10 p-1 flex items-center gap-1">
                        <span className="text-slate-700 text-[10px] font-mono w-4 shrink-0 text-center">{i+1}</span>
                        <span className="text-slate-300 text-xs font-bold truncate">{sh.name || '—'}</span>
                      </div>
                      <div className="w-[18%] border-r border-white/10 p-1 flex items-center"><span className="text-slate-500 text-xs truncate">{sh.address || '—'}</span></div>
                      <div className="w-[12%] border-r border-white/10 p-1 flex items-center justify-center"><span className="text-slate-500 text-xs">{sh.position || '—'}</span></div>
                      <div className="flex-1 flex">
                        <div className="w-1/2 flex border-r border-white/10">
                          <div className="w-[30%] border-r border-white/10 flex items-center justify-center text-slate-500 text-xs">{sh.pctStart || '—'}</div>
                          <div className="flex-1 p-1 flex items-center justify-end text-emerald-400 text-xs font-bold">{sh.amtStart || '—'}</div>
                        </div>
                        <div className="flex-1 flex">
                          <div className="w-[30%] border-r border-white/10 flex items-center justify-center text-slate-500 text-xs">{sh.pctEnd || '—'}</div>
                          <div className="flex-1 p-1 flex items-center justify-end text-emerald-400 text-xs font-bold">{sh.amtEnd || '—'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex h-10 bg-white/[0.04]">
                    <div className="w-[50%] border-r border-white/10 flex items-center px-4 gap-2">
                      <span className="text-white font-bold text-xs" style={{ fontFamily: 'Kantumruy Pro, sans-serif' }}>សរុប</span>
                      <span className="text-slate-500 text-[9px] font-black uppercase">Total</span>
                    </div>
                    <div className="flex-1 flex font-black">
                      <div className="w-1/2 flex border-r border-white/10">
                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center text-rose-400 text-[10px]">100%</div>
                        <div className="flex-1 p-2 flex items-center justify-end text-emerald-400 text-[10px]">{formData.share_capital_total || '-'}</div>
                      </div>
                      <div className="flex-1 flex">
                        <div className="w-[30%] border-r border-white/10 flex items-center justify-center text-rose-400 text-[10px]">100%</div>
                        <div className="flex-1 p-2 flex items-center justify-end text-emerald-400 text-[10px]">{formData.share_capital_total || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>"""


new_lines = NEW.split('\n')
result = lines[:START] + new_lines + lines[END+1:]

out = ('\r\n' if had_crlf else '\n').join(result)
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(out)

print(f'Output: {len(result)} lines. Done.')
print(f'Join area: {repr(result[START-1][-40:])} | {repr(result[START][:40])}')
print(f'Close area: {repr(result[START+len(new_lines)-3][-40:])}')
print(f'After close: {repr(result[START+len(new_lines)][:60])}')
