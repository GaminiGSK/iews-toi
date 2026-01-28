import React, { useState, useEffect } from 'react';
import DynamicForm from '../components/DynamicForm';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, RefreshCw, Radio } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const INITIAL_SCHEMA = {
    title: "លិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ",
    titleKh: "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED",
    status: "active",
    sections: [
        {
            id: "header_period",
            fields: [
                {
                    key: "taxYear",
                    label: "Tax Period (Number of Month)",
                    labelKh: "ការបរិច្ឆេទសារពើពន្ធ (ចំនួនខែ)",
                    type: "boxes",
                    length: 2,
                    colSpan: 3,
                    layout: "horizontal"
                },
                {
                    key: "periodFrom",
                    label: "From",
                    labelKh: "ចាប់ពីថ្ងៃទី",
                    type: "boxes",
                    length: 8,
                    format: "2-2-4",
                    noDash: true,
                    prefix: true,
                    colSpan: 4.5,
                    layout: "horizontal"
                },
                {
                    key: "periodTo",
                    label: "Until",
                    labelKh: "ដល់ថ្ងៃទី",
                    type: "boxes",
                    length: 8,
                    format: "2-2-4",
                    noDash: true,
                    colSpan: 4.5,
                    layout: "horizontal"
                }
            ]
        },
        {
            id: "identification",
            fields: [
                {
                    key: "tin",
                    number: "1",
                    label: "Tax Identification Number (TIN)",
                    labelKh: "លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (TIN)",
                    type: "boxes",
                    length: 12,
                    format: "3-9",
                    colSpan: 12,
                    layout: "horizontal"
                },
                {
                    key: "enterpriseName",
                    number: "2",
                    label: "Name of Enterprise",
                    labelKh: "ឈ្មោះសហគ្រាស",
                    type: "text",
                    readOnly: true,
                    colSpan: 12
                }
            ]
        }
    ]
};

const LiveTaxWorkspace = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const yearParam = searchParams.get('year');
    const socket = useSocket();

    const [schema, setSchema] = useState(INITIAL_SCHEMA);
    const [formData, setFormData] = useState({});
    const [status, setStatus] = useState('Idle');

    // Auto-Fill Year Logic
    useEffect(() => {
        if (yearParam) {
            setFormData(prev => ({
                ...prev,
                taxYear: yearParam,
                periodFrom: `01-01-${yearParam}`,
                periodTo: `31-12-${yearParam}`
            }));
            setStatus('Fiscal Context Applied');
        }
    }, [yearParam]);

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSimulateAgent = () => {
        if (socket) {
            socket.emit('dev:simulate_fill');
            setStatus('Requesting Agent...');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 font-sans selection:bg-blue-200">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 shadow-sm z-40 px-6 py-4 flex justify-between items-center print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-lg tracking-wide text-slate-900">Live Form Workspace</h1>
                        <div className="flex items-center gap-2 text-xs font-mono text-emerald-600">
                            <Radio size={12} className="animate-pulse" /> TOI 01 Replica Mode (Beta)
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-slate-500 text-sm font-mono">{status}</span>
                    <button onClick={() => window.print()} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition">
                        Print / PDF
                    </button>
                    <button
                        onClick={handleSimulateAgent}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-blue-200 shadow-lg"
                    >
                        <RefreshCw size={16} /> Auto-Fill (AI)
                    </button>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="pt-28 pb-20 px-6 w-full flex justify-center items-start overflow-x-auto print:pt-0 print:px-0">
                <div className="transition-all duration-300 ease-in-out">
                    <DynamicForm
                        schema={schema}
                        data={formData}
                        onChange={handleChange}
                        onSubmit={() => alert('Submit To Backend')}
                    />
                </div>
            </div>
        </div>
    );
};

export default LiveTaxWorkspace;
