import React, { useState, useEffect } from 'react';
import DynamicForm from '../components/DynamicForm';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, RefreshCw, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INITIAL_SCHEMA = {
    title: "Monthly Tax Return (Prepayment of Profit Tax)",
    description: "Form T-01: Declaration for the Prepayment of Profit Tax",
    status: "draft",
    sections: [
        {
            id: "company_info",
            title: "Taxpayer Information",
            fields: [
                { key: "companyName", label: "Company Name", type: "text", readOnly: true, placeholder: "Loading..." },
                { key: "taxId", label: "Tax Identification Number (TIN)", type: "text", readOnly: true, placeholder: "Loading..." },
                { key: "period", label: "Tax Period", type: "text", placeholder: "e.g. June 2024" }
            ]
        },
        {
            id: "calculation",
            title: "Tax Calculation",
            icon: "calc",
            fields: [
                { key: "turnover", label: "Total Turnover (Inclusive of Taxes)", type: "currency", required: true },
                { key: "taxableBase", label: "Taxable Turnover", type: "currency", readOnly: true, help: "Calculated from Ledger" },
                { key: "taxDue", label: "Prepayment of Profit Tax (1%)", type: "currency", readOnly: true, fullWidth: true }
            ]
        }
    ]
};

const LiveTaxWorkspace = () => {
    const navigate = useNavigate();
    const socket = useSocket();

    const [schema, setSchema] = useState(INITIAL_SCHEMA);
    const [formData, setFormData] = useState({});
    const [status, setStatus] = useState('Idle');

    useEffect(() => {
        if (!socket) return;

        // Listen for "Mind Updates"
        socket.on('form:schema', (newSchema) => {
            console.log("Received Schema Update", newSchema);
            setSchema(newSchema);
            setStatus('Agent Updated Form Structure');
        });

        socket.on('form:data', (newData) => {
            console.log("Received Data Update", newData);
            setFormData(prev => ({ ...prev, ...newData }));
            setStatus('Agent Filled Data');
        });

        return () => {
            socket.off('form:schema');
            socket.off('form:data');
        };
    }, [socket]);

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));

        // Simple Client-Side Calc for Demo (Real logic should be hybrid)
        if (key === 'turnover') {
            const tax = (value || 0) * 0.01;
            setFormData(prev => ({
                ...prev,
                [key]: value,
                taxableBase: value,
                taxDue: tax
            }));
        }
    };

    const handleSimulateAgent = () => {
        // DEV ONLY: Trigger a simulate event to the server to start the "Show"
        // In reality, we'd call an API endpoint `/api/agent/start-task`
        if (socket) {
            socket.emit('dev:simulate_fill');
            setStatus('Requesting Agent...');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-40 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-full transition">
                        <ArrowLeft size={24} className="text-slate-400" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-lg tracking-wide">Live Form Workspace</h1>
                        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                            <Radio size={12} className="animate-pulse" /> Real-Time Neural Link Active
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-slate-500 text-sm font-mono">{status}</span>
                    <button
                        onClick={handleSimulateAgent}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                    >
                        <RefreshCw size={16} /> Auto-Fill (AI)
                    </button>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="pt-28 pb-20 px-6">
                <DynamicForm
                    schema={schema}
                    data={formData}
                    onChange={handleChange}
                    onSubmit={() => alert('Submit To Backend')}
                />
            </div>
        </div>
    );
};

export default LiveTaxWorkspace;
