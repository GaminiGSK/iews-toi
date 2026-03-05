import React, { useState } from 'react';
import { Layers, Plus, FolderUp, ArrowLeft } from 'lucide-react';

export default function BankStatementV2Workspace({ onBack }) {
    // Scaffold state for the multi-basket setup
    const [baskets, setBaskets] = useState([]);
    const [activeBasketId, setActiveBasketId] = useState(null);

    const handleCreateBasket = () => {
        if (baskets.length >= 10) {
            alert("Maximum 10 baskets allowed.");
            return;
        }
        const newBasket = {
            id: Date.now().toString(),
            name: `New Basket ${baskets.length + 1}`,
            bankName: null,
            accountNo: null,
            files: [],
            status: 'empty'
        };
        setBaskets([...baskets, newBasket]);
    };

    const renderDashboard = () => (
        <div className="w-full h-[calc(100vh-80px)] pt-6 pl-10 pr-[100px] animate-fade-in flex flex-col overflow-y-auto">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition shadow-lg shrink-0 border border-white/5"
                        title="Back to Main Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Bank Statements V2 (Multi-Account)</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Create isolated statement baskets for exact synchronization to Google Drive.</p>
                    </div>
                </div>

                <button
                    onClick={handleCreateBasket}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2 border border-emerald-400/30"
                >
                    <Plus size={20} />
                    CREATE BASKET
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {baskets.map(basket => (
                    <div
                        key={basket.id}
                        onClick={() => setActiveBasketId(basket.id)}
                        className="group p-8 bg-slate-900 border border-white/10 hover:border-emerald-500/50 rounded-3xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-emerald-500/10 flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/5 group-hover:bg-emerald-500/10 group-hover:text-emerald-400">
                            <FolderUp size={28} className="text-slate-400 group-hover:text-emerald-400" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">{basket.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{basket.status.toUpperCase()}</p>
                    </div>
                ))}

                {baskets.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-slate-900/40">
                        <Layers size={64} className="text-slate-700 mb-6" />
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">No Baskets Found</h3>
                        <p className="text-slate-400 font-medium text-sm">Click 'Create Basket' to initialize a new isolated bank statement sync zone.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderActiveBasket = () => (
        <div className="w-full h-[calc(100vh-80px)] pt-6 pl-10 pr-[100px] animate-fade-in flex flex-col overflow-y-auto">
            <div className="mb-8 flex items-center gap-4">
                <button
                    onClick={() => setActiveBasketId(null)}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition shadow-lg shrink-0 border border-white/5"
                    title="Back to Baskets"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Basket Workspace</h1>
                    <p className="text-emerald-400 font-bold text-sm mt-1 uppercase tracking-widest">{baskets.find(b => b.id === activeBasketId)?.name}</p>
                </div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-3xl border border-white/5 border-dashed flex items-center justify-center p-12 text-center">
                <div>
                    <h2 className="text-2xl font-black text-white mb-4">Under Construction</h2>
                    <p className="text-slate-400">This is where the drag-and-drop system and Table will go for this specific isolated basket. <br /> The "Save All" button here will rename the basket and generate the specific Google Drive folder.</p>
                </div>
            </div>
        </div>
    );

    return activeBasketId ? renderActiveBasket() : renderDashboard();
}
