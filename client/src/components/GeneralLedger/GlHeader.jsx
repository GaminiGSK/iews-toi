import React from 'react';

const GlHeader = ({ codes }) => {
    // Categorize codes for the summary board
    const assets = codes.filter(c => c.code && c.code.startsWith('1'));
    const liabilities = codes.filter(c => c.code && c.code.startsWith('2'));
    const equity = codes.filter(c => c.code && c.code.startsWith('3'));
    const revenue = codes.filter(c => c.code && c.code.startsWith('4'));
    const expenses = codes.filter(c => c.code && c.code.startsWith('6'));
    
    // Fallbacks to match mockup if DB is empty
    const directCosts = codes.filter(c => c.code && c.code.startsWith('5')); // E.g. COGS
    const operatingExpenses = codes.filter(c => c.code && c.code.startsWith('17')); // Matching the '17100 Operating Expenses' anomaly in the mockup

    const renderCodeItem = (codeList, fallbackText, fallbackCode) => {
        if (codeList.length === 0) return <div><span className="font-mono text-gray-500 mr-2">{fallbackCode}</span>{fallbackText}</div>;
        const c = codeList[0];
        return <div><span className="font-mono text-gray-500 mr-2">{c.code}</span>{c.description || fallbackText}</div>;
    };

    return (
        <div className="bg-[#e4eff6] text-xs pb-4 border-2 border-slate-400">
            {/* Dark Blue Mockup Header Bar */}
            <div className="bg-[#2a4e7e] text-white p-2 text-center border-b-2 border-slate-400 font-bold text-lg mb-2">
                GK SMART General Ledger - Sample Report (FY2025)
            </div>
            
            <div className="px-4 flex justify-between">
                <div className="flex gap-12 font-medium">
                    <div className="font-bold whitespace-nowrap">COA:</div>
                    <div>
                        <div className="font-bold mb-1">Consultancy / Tech Service Company</div>
                        <div className="grid grid-cols-[auto_auto] gap-x-8 gap-y-1">
                            <div>Assets</div>
                            {renderCodeItem(assets, 'Assets', '10000')}
                            
                            <div>Liabilities</div>
                            {renderCodeItem(liabilities, 'Liabilities', '20000')}
                            
                            <div>Equity</div>
                            {renderCodeItem(equity, 'Equity', '30000')}
                            
                            <div>Revenue</div>
                            {renderCodeItem(revenue, 'Revenue', '40000')}
                            
                            <div>Direct Costs</div>
                            {renderCodeItem(directCosts, 'Direct Costs', '50000')}
                            
                            <div>Operating Expenses</div>
                            {renderCodeItem(operatingExpenses, 'Operating Expenses', '60000')}
                        </div>
                    </div>
                    {/* Mockup Center Column */}
                    <div className="ml-8">
                        <div className="h-[20px]"></div> {/* spacer */}
                        <div className="grid grid-cols-1 gap-y-1">
                           {expenses.slice(0, 3).map(e => <div key={e._id}><span className="font-mono text-gray-500 mr-2">{e.code}</span>{typeof e.description === 'object' ? JSON.stringify(e.description) : String(e.description || '')}</div>)}
                           {expenses.length === 0 && (
                               <>
                                   <div><span className="font-mono text-gray-500 mr-2">60100</span>Depenice</div>
                                   <div><span className="font-mono text-gray-500 mr-2">60100</span>Software Expenses</div>
                                   <div><span className="font-mono text-gray-500 mr-2">60200</span>Rent Expense</div>
                                   <div><span className="font-mono text-gray-500 mr-2">60300</span>Software Subscription</div>
                               </>
                           )}
                        </div>
                    </div>
                </div>

                {/* Right Side Guide Notes */}
                <div className="w-[450px] flex justify-between pr-8">
                    <div className="text-[11px] leading-relaxed pt-8">
                        <span className="font-bold">Special:</span> Project Tag:<br/>
                        Coreos: Proj_ _MobileApp<br/>
                        coders (Project : Platform)
                    </div>
                    <div className="text-[11px] leading-relaxed pt-8 font-bold text-wrap w-20 text-center">
                        Key Features: Often <br/>profitability of inrrent column.
                    </div>
                    <div className="text-[11px] leading-relaxed pt-8 font-bold text-wrap w-24">
                        Key Project Hours <br/>to-assigned coding.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlHeader;
