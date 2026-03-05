                    {activePage === 9 && (
                        <div className="animate-fade-in relative px-10 py-16 flex flex-col items-center">
                            {/* TIN HEADER ANCHORED MATCH */}
                            <div className="w-full flex justify-between items-start mb-8">
                                <div className="flex items-center gap-6 bg-[#020617] p-4 rounded-xl shadow-xl border border-white/20">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-bold text-white px-2" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN) :</span>
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Tax Identification Number (TIN)</span>
                                    </div>
                                    <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg shadow-inner">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow">
                                                <input
                                                    type="text"
                                                    maxLength="1"
                                                    className="w-full h-full text-center bg-transparent border-none outline-none text-xl font-black text-white"
                                                    value={(formData.tin || "")[i] || ""}
                                                    onChange={(e) => {
                                                        const current = (formData.tin || "             ").split('');
                                                        current[i] = e.target.value;
                                                        handleFormChange('tin', current.join(''));
                                                    }}
                                                />
                                            </div>
                                        ))}
                                        <div className="w-4 h-[2px] bg-white opacity-40 mx-2 self-center" />
                                        {Array.from({ length: 9 }).map((_, i) => (
                                            <div key={i + 4} className="w-10 h-10 border border-white/20 flex items-center justify-center bg-slate-800/90 rounded shadow">
                                                <input
                                                    type="text"
                                                    maxLength="1"
                                                    className="w-full h-full text-center bg-transparent border-none outline-none text-xl font-black text-white"
                                                    value={(formData.tin || "")[i + 4] || ""}
                                                    onChange={(e) => {
                                                        const current = (formData.tin || "             ").split('');
                                                        current[i + 4] = e.target.value;
                                                        handleFormChange('tin', current.join(''));
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* PAGE HEADER */}
                            <div className="w-full bg-slate-900/40 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl mb-10 flex justify-between items-center">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ការគណនាពន្ធលើប្រាក់ចំណូល</h2>
                                    <h1 className="text-slate-400 font-black text-sm uppercase tracking-widest">TABLE OF INCOME TAX CALCULATION</h1>
                                </div>
                                <div className="flex flex-col items-end gap-2 bg-black/20 p-4 rounded-xl border border-white/10 shadow-inner">
                                    <div className="flex gap-1.5">
                                        {(formData.untilDate?.slice(-4) || "2026").split('').map((char, i) => (
                                            <div key={i} className="w-10 h-12 border-2 border-slate-600 flex items-center justify-center bg-slate-800 rounded">
                                                <input
                                                    type="text"
                                                    maxLength="1"
                                                    className="w-full h-full text-center bg-transparent border-none outline-none text-2xl font-black text-white"
                                                    value={char || ""}
                                                    onChange={(e) => {
                                                        const newDate = (formData.untilDate || "31122026").split('');
                                                        newDate[4 + i] = e.target.value;
                                                        handleFormChange('untilDate', newDate.join(''));
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tax Period Year</div>
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-10 items-start">
                                {/* LEFT COLUMN: PROFIT & NON-DEDUCTIBLE EXPENSES */}
                                <div className="flex flex-col gap-8">
                                    {/* SECTION: INITIAL PROFIT/LOSS */}
                                    <div className="border hover:border-indigo-400 transition-colors border-white/20 h-20 bg-indigo-500/20 rounded-2xl flex items-center shadow-xl overflow-hidden backdrop-blur-sm">
                                        <div className="w-[60%] border-r border-white/20 px-8">
                                            <span className="text-base font-bold block leading-tight text-white mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ប្រាក់ចំណេញ/(ខាត) មុនបង់ពន្ធ (E1 = B46)</span>
                                            <span className="text-xs block text-indigo-300 font-bold uppercase tracking-widest">Accounting Profit / (Loss)</span>
                                        </div>
                                        <div className="w-[10%] border-r border-white/20 flex items-center justify-center font-black text-base text-indigo-400/50">E 1</div>
                                        <div className="flex-1 flex items-center justify-end px-8 text-xl font-black text-white">
                                            {formData.e1_amount || '0.00'}
                                        </div>
                                    </div>

                                    {/* SECTION: NON-DEDUCTIBLE EXPENSES */}
                                    <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 rounded-2xl shadow-xl backdrop-blur-sm">
                                        <div className="flex bg-slate-800 border-b-2 border-white/20 py-4 px-6 gap-6 items-center">
                                            <div className="bg-rose-600 px-3 py-1 text-xs font-black uppercase rounded shadow-lg text-white">Add</div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយមិនអាចកាត់កងបាន</span>
                                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Non-Deductible Expenses</span>
                                            </div>
                                        </div>
                                        {[
                                            { ref: "E 2", kh: "ចំណាយរំលស់តាមគណនេយ្យ", en: "Accounting amortisation, depletion and depreciation", key: "e2" },
                                            { ref: "E 3", kh: "ចំណាយលើការកម្សាន្តសប្បាយ ការរាំរែកកម្សាន្ត និងការទទួលភ្ញៀវ", en: "Amusement, recreation and entertainment expenses", key: "e3" },
                                            { ref: "E 4", kh: "ការកើនឡើងខ្ពស់នៃសំវិធានធន", en: "Increase in provisions", key: "e4" },
                                            { ref: "E 5", kh: "អំណោយ ជំនួយឧបត្ថម្ភផ្សេងៗ", en: "Donations, grants and subsidies", key: "e5" },
                                            { ref: "E 6", kh: "ខាតពីការលក់ទ្រព្យសកម្មថេរតាមបញ្ជីគណនេយ្យ", en: "Loss on disposal of fixed assets (as per accounting book)", key: "e6" },
                                            { ref: "E 7", kh: "ចំណាយមហាសាលៈ ស្តុក សម្ភារៈសម្រាប់កម្សាន្តផ្សេងៗ", en: "Extravagant expenses", key: "e7" },
                                            { ref: "E 8", kh: "ចំណាយមិនបម្រើឱ្យសកម្មភាពអាជីវកម្ម", en: "Non-business related expenses", key: "e8" },
                                            { ref: "E 9", kh: "ខាតលើប្រតិបត្តិការជាមួយបុគ្គលជាប់ទាក់ទង", en: "Losses on transactions with related parties", key: "e9" },
                                            { ref: "E 10", kh: "ចំណាយលើការកាត់ពិន័យ និងទោសទណ្ឌផ្សេងៗ", en: "Fines and other penalties", key: "e10" },
                                            { ref: "E 11", kh: "ចំណាយនៃកាលបរិច្ឆេទមុន", en: "Expenses related to previous period", key: "e11" },
                                            { ref: "E 12", kh: "ចំណាយពន្ធអាករដែលមិនអាចកាត់កងបាន", en: "Other non-deductible tax expenses", key: "e12" },
                                            { ref: "E 13", kh: "លាភការរបស់ម្ចាស់អាជីវកម្ម និងគ្រួសារ", en: "Remuneration of owners and families", key: "e13" },
                                            { ref: "E 14", kh: "ផលប្រយោជន៍របស់ម្ចាស់អាជីវកម្ម និងគ្រួសារ", en: "Benefits of owners and families", key: "e14" },
                                            { ref: "E 15", kh: "ចំណាយបៀវត្សដែលមិនទាន់បានបង់ក្នុងរយៈពេល ១៨០ថ្ងៃនៃឆ្នាំបន្ទាប់", en: "Salary unpaid within 180 days of next tax year", key: "e15" },
                                            { ref: "E 16", kh: "ចំណាយដល់បុគ្គលជាប់ទាក់ទងដែលមិនទាន់បានបង់ក្នុងរយៈពេល ១៨០ថ្ងៃនៃឆ្នាំបន្ទាប់", en: "Related-party expenses unpaid within 180 days of next tax year", key: "e16" },
                                            { ref: "E 17", kh: "ចំណាយផ្សេងៗមិនអាចកាត់កងបានដទៃទៀត", en: "Other non-deductible expenses", key: "e17" },
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 min-h-[3.5rem] py-2 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[60%] border-r border-white/10 px-6 flex flex-col justify-center">
                                                    <span className="font-bold text-xs leading-tight mb-1 text-white" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-tight">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 bg-white/5 self-stretch">{row.ref}</div>
                                                <div className="flex-1 flex items-center justify-end px-6 font-black text-sm">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-transparent text-right outline-none text-white focus:text-indigo-300 transition-colors"
                                                        value={formData[row.key + '_amount'] || ""}
                                                        onChange={(e) => handleFormChange(row.key + '_amount', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex bg-rose-500/20 py-4 items-center font-black border-t-2 border-rose-500/50 shadow-[0_-10px_20px_-5px_rgba(225,29,72,0.2)]">
                                            <div className="w-[70%] border-r-2 border-rose-500/50 px-6 text-sm uppercase text-rose-200">សរុប [E18 = សរុប(E2:E17)] / Total</div>
                                            <div className="flex-1 flex items-center justify-end px-6 text-rose-400 text-base">{formData.e18_amount || '0.00'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: TAXABLE INCOME & TAX DEDUCTIBLE EXPENSES */}
                                <div className="flex flex-col gap-8">
                                    {/* SECTION: TAXABLE INCOME NOT IN BOOKS */}
                                    <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 shadow-xl rounded-2xl backdrop-blur-sm">
                                        <div className="flex bg-indigo-500/30 border-b-2 border-white/20 py-4 px-6 gap-6 items-center">
                                            <div className="bg-indigo-500 px-3 py-1 text-xs font-black uppercase rounded shadow-lg text-white">Add</div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណូលជាប់ពន្ធដែលមិនបានកត់ត្រា...</span>
                                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Taxable incomes not recorded</span>
                                            </div>
                                        </div>
                                        {[
                                            { ref: "E 19", kh: "ការផ្គត់ផ្គង់ទំនិញ និងសេវាដោយឥតគិតថ្លៃ", en: "Supplies of goods and services free of charge", key: "e19" },
                                            { ref: "E 20", kh: "ការដាក់ឱ្យប្រើប្រាស់ទ្រព្យសកម្មថេរផ្ទាល់ខ្លួនដោយឥតគិតថ្លៃ", en: "Granting fixed assets for users free of charge", key: "e20" },
                                            { ref: "E 21", kh: "ការកែលម្អទ្រព្យសកម្មថេរដោយភតិកៈដោយឥតបង់ថ្លៃឱ្យភតិកភារ", en: "Improvement of fixed assets made by lessee without charge to lessor", key: "e21" },
                                            { ref: "E 22", kh: "អំណោយ ជំនួយឧបត្ថម្ភផ្សេងៗដែលមិនបានទទួលស្គាល់ក្នុងបញ្ជីគណនេយ្យ", en: "Donations, grants and subsidies not recorded in the accounting book", key: "e22" },
                                            { ref: "E 23", kh: "ផលចំណេញ / កម្រៃពីការលក់ទ្រព្យសកម្មថេរតាមច្បាប់ស្តីពីសារពើពន្ធ", en: "Gain on disposal of fixed assets as per LOT", key: "e23" },
                                            { ref: "E 24", kh: "ចំណូលផ្សេងៗទៀតដែលមិនបានកត់ត្រាក្នុងបញ្ជីគណនេយ្យ", en: "Other incomes not recorded in the accounting book", key: "e24" },
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 min-h-[4rem] py-2 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[60%] border-r border-white/10 px-6 flex flex-col justify-center">
                                                    <span className="font-bold text-xs leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-tight">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 self-stretch">{row.ref}</div>
                                                <div className="flex-1 flex items-center justify-end px-6 font-black text-sm">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-transparent text-right outline-none text-white"
                                                        value={formData[row.key + '_amount'] || ""}
                                                        onChange={(e) => handleFormChange(row.key + '_amount', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex bg-indigo-500/20 py-4 items-center font-black border-t-2 border-indigo-500/50 shadow-[0_-10px_20px_-5px_rgba(99,102,241,0.2)]">
                                            <div className="w-[70%] border-r-2 border-indigo-500/50 px-6 text-sm uppercase text-indigo-200">សរុប [E25 = សរុប(E19:E24)] / Total</div>
                                            <div className="flex-1 flex items-center justify-end px-6 text-indigo-400 text-base">{formData.e25_amount || '0.00'}</div>
                                        </div>
                                    </div>

                                    {/* SECTION: DEDUCTIBLE EXPENSES NOT IN BOOKS */}
                                    <div className="border border-white/20 overflow-hidden text-white bg-slate-900/40 shadow-xl rounded-2xl backdrop-blur-sm">
                                        <div className="flex bg-emerald-500/30 border-b-2 border-white/20 py-4 px-6 gap-6 items-center">
                                            <div className="bg-emerald-500 px-3 py-1 text-xs font-black uppercase text-white rounded shadow-lg">Less</div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាយមិនកត់ត្រាក្នុងបញ្ជីគណនេយ្យ...</span>
                                                <span className="text-xs font-black uppercase tracking-widest text-emerald-200">Deductible expenses not in books</span>
                                            </div>
                                        </div>
                                        {[
                                            { ref: "E 26", kh: "រំលស់អនុញ្ញាតតាមច្បាប់ស្តីពីសារពើពន្ធ", en: "Deductible amortisation, depletion and depreciation as per LOT", key: "e26" },
                                            { ref: "E 27", kh: "រំលស់ពិសេសអនុញ្ញាតតាមច្បាប់ស្តីពីសារពើពន្ធ", en: "Special depreciation as per LOT", key: "e27" },
                                        ].map((row, idx) => (
                                            <div key={idx} className="flex border-b border-white/10 min-h-[4rem] py-2 items-center last:border-0 hover:bg-white/5 transition-colors">
                                                <div className="w-[60%] border-r border-white/10 px-6 flex flex-col justify-center">
                                                    <span className="font-bold text-xs leading-tight mb-1" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{row.kh}</span>
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase leading-tight">{row.en}</span>
                                                </div>
                                                <div className="w-[10%] border-r border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 self-stretch">{row.ref}</div>
                                                <div className="flex-1 flex items-center justify-end px-6 font-black text-sm">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-transparent text-right outline-none text-white focus:text-emerald-300 transition-colors"
                                                        value={formData[row.key + '_amount'] || ""}
                                                        onChange={(e) => handleFormChange(row.key + '_amount', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* DECORATIVE FOOTER */}
                            <div className="flex justify-between items-center opacity-40 mt-12 mb-8 w-full">
                                <div className="text-sm uppercase tracking-widest font-black">Tax Calculation Schedule</div>
                                <div className="flex-1 mx-8 h-[2px] bg-white/30"></div>
                                <div className="text-sm uppercase tracking-widest font-black">Page 09</div>
                            </div>
                        </div>
                    )}
