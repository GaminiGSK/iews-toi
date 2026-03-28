const fs = require('fs');
let c = fs.readFileSync('client/src/components/AIAssistant.jsx', 'utf8');

const replacement = `
                                {/* Tool Action: Propose Reclassifications */}
                                {msg.toolAction && msg.toolAction.tool_use === 'propose_reclassifications' && msg.toolAction.suggestions && (
                                    <div className="w-[95%] bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl mt-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                        <div className="bg-amber-900/40 px-6 py-3 border-b border-amber-500/30 flex justify-between items-center text-amber-300">
                                            <span className="text-lg font-bold uppercase tracking-widest flex items-center gap-2 font-mono"><Sparkles size={16} /> Audit Suggestions</span>
                                            <span className="text-xs bg-amber-500/20 px-2 py-1 rounded-full text-amber-400 font-bold border border-amber-500/30">{msg.toolAction.suggestions.length} Discrepancies</span>
                                        </div>
                                        <div className="p-4 overflow-x-auto">
                                            <table className="w-full text-left text-sm whitespace-nowrap">
                                                <thead className="text-gray-400 text-xs border-b border-slate-700 uppercase tracking-wider">
                                                    <tr>
                                                        <th className="pb-3 px-2 font-medium">Description Match</th>
                                                        <th className="pb-3 px-2 font-medium">Current</th>
                                                        <th className="pb-3 px-2 font-medium">Suggestion</th>
                                                        <th className="pb-3 px-2 font-medium w-full">Reasoning</th>
                                                        <th className="pb-3 px-2 font-medium text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {msg.toolAction.suggestions.map((sug, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-800/30 transition group">
                                                            <td className="py-3 px-2 text-white font-medium max-w-[200px] truncate" title={sug.description_match}>{sug.description_match}</td>
                                                            <td className="py-3 px-2 font-mono text-xs text-red-400 line-through opacity-70">{sug.current_code}</td>
                                                            <td className="py-3 px-2 font-mono text-xs font-bold text-emerald-400"><span className="bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">{sug.suggested_code}</span></td>
                                                            <td className="py-3 px-2 text-gray-400 text-xs whitespace-normal max-w-[250px] leading-relaxed group-hover:text-gray-300 transition" title={sug.reasoning}>{sug.reasoning}</td>
                                                            <td className="py-3 px-2 text-right">
                                                                <button
                                                                    onClick={() => handleApproveAction({ action: 'bulk_tag_ledger', params: { targetCode: sug.suggested_code, description_match: sug.description_match, condition: 'all' } })}
                                                                    className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] uppercase tracking-wider font-bold px-4 py-2 rounded-lg transition active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                                                >
                                                                    APPROVE FIX
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
`;

// Match the end of the generate_chart block DIVs
const newC = c.replace(/\{\/\* Tool Action: Chart Visualization \*\/\}[\s\S]*?<\/[bB]arChart>\s*<\/ResponsiveContainer>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>/g, match => match + replacement);
fs.writeFileSync('client/src/components/AIAssistant.jsx', newC);
