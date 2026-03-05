const fs = require('fs');
let code = fs.readFileSync('src/pages/LiveTaxWorkspace.jsx', 'utf8');

const START = '{activePage === 9 && (';
const END = '{activePage === 10 && (';
const startIdx = code.indexOf(START);
const endIdx = code.indexOf(END, startIdx);
if (startIdx === -1 || endIdx === -1) {
    console.log("Could not find the block");
    process.exit(1);
}

let page9 = fs.readFileSync('page9.tmp.jsx', 'utf8');

const normalizedHeader = `
                        <div className="animate-fade-in relative px-10 xl:px-24 py-16 flex flex-col items-center overflow-x-auto min-w-[1200px]">
                            {/* TIN HEADER ANCHORED MATCH */}
                            <div className="w-full max-w-[1400px] flex justify-end items-start mb-8">
                                <div className="flex items-center gap-6 bg-[#020617] p-4 rounded-xl shadow-xl border border-white/20">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តញ្ញាណកម្មសារពើពន្ធ (TIN) :</span>
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Tax Identification Number (TIN)</span>
                                    </div>
                                    <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg shadow-inner">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow">
                                                <span className="text-xl font-black text-white">{(formData.tin || "")[i]}</span>
                                            </div>
                                        ))}
                                        <div className="w-4 h-[2px] bg-white opacity-40 mx-2 self-center" />
                                        {Array.from({ length: 9 }).map((_, i) => (
                                            <div key={i + 4} className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow">
                                                <span className="text-xl font-black text-white">{(formData.tin || "")[i + 4]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* PAGE HEADER */}
                            <div className="w-full max-w-[1400px] bg-slate-900/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-12 flex justify-between items-center text-center xs:text-left">
                                <div className="flex flex-col max-w-[70%] gap-2 items-start justify-center text-left">
                                    <h2 className="text-2xl font-bold text-white leading-tight uppercase" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                        ការគណនាពន្ធលើប្រាក់ចំណូល
                                    </h2>
                                    <h1 className="text-slate-400 font-black text-sm uppercase tracking-widest mt-2">
                                        TABLE OF INCOME TAX CALCULATION
                                    </h1>
                                </div>
                                <div className="flex flex-col items-end gap-2 bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                                    <div className="flex gap-1.5">
                                        {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                            <div key={i} className="w-10 h-12 border-2 border-slate-600 flex items-center justify-center bg-slate-800 rounded">
                                                <span className="text-2xl font-black text-white">{char}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tax Period Year</div>
                                </div>
                            </div>
`;

const gridStartIdx = page9.indexOf('<div className="w-full grid grid-cols-2 gap-10 items-start">');
let gridSection = page9.substring(gridStartIdx);

gridSection = gridSection.replace(/min-h-\[3\.5rem\]/g, 'h-auto py-3');
gridSection = gridSection.replace(/min-h-\[4rem\]/g, 'h-auto py-3');

gridSection = gridSection.replace(
    /className="font-bold text-xs leading-tight mb-1 text-white"/g,
    'className="font-bold text-xs leading-relaxed mb-1 text-white break-words whitespace-normal"'
);
gridSection = gridSection.replace(
    /className="font-bold text-xs leading-tight mb-1"/g,
    'className="font-bold text-xs leading-relaxed mb-1 break-words whitespace-normal"'
);
gridSection = gridSection.replace(
    /className="text-\[10px\] font-bold text-emerald-400 uppercase leading-tight"/g,
    'className="text-[10px] font-bold text-emerald-400 uppercase leading-relaxed break-words whitespace-normal"'
);
gridSection = gridSection.replace(
    /className="text-\[10px\] font-bold text-slate-400 uppercase leading-tight"/g,
    'className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed break-words whitespace-normal"'
);


const newPage9 = START + '\n' + normalizedHeader + '\n' + gridSection;

code = code.substring(0, startIdx) + newPage9 + code.substring(endIdx);
fs.writeFileSync('src/pages/LiveTaxWorkspace.jsx', code);
console.log("Rewrite applied successfully!");
