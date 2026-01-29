import React, { useState, useEffect } from 'react';
import DynamicForm from '../components/DynamicForm';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, RefreshCw, Radio, AlertTriangle } from 'lucide-react';
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
                },
                {
                    key: "directorName",
                    number: "5",
                    label: "Name of Director/Manager/Owner",
                    labelKh: "ឈ្មោះនាយកសហគ្រាស / អ្នកគ្រប់គ្រង / ម្ចាស់",
                    type: "text",
                    colSpan: 12
                },
                {
                    key: "mainActivity",
                    number: "6",
                    label: "Main Business Activities",
                    labelKh: "សកម្មភាពអាជីវកម្មចម្បង",
                    type: "text",
                    colSpan: 12
                },
                {
                    key: "registeredAddress",
                    number: "8",
                    label: "Current Registered Office Address",
                    labelKh: "អាសយដ្ឋានចុះបញ្ជីបច្ចុប្បន្នរបស់សហគ្រាស",
                    type: "textarea",
                    colSpan: 12
                }
            ]
        }
    ]
};

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 bg-red-50 border-2 border-red-200 rounded-3xl m-10 text-center">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <h1 className="text-xl font-bold text-red-900 mb-2">Workspace Component Crashed</h1>
                    <p className="text-red-700 text-sm mb-4">{this.state.error?.message}</p>
                    <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold">Reload Workspace</button>
                </div>
            );
        }
        return this.props.children;
    }
}

const LiveTaxWorkspace = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const yearParam = searchParams.get('year');
    const socket = useSocket();

    const [schema, setSchema] = useState(INITIAL_SCHEMA);
    const [formData, setFormData] = useState({
        taxYear: '2023',
        periodFrom: '01012023',
        periodTo: '31122023'
    });
    const [status, setStatus] = useState('System Initialized');

    // Auto-Fill Year Logic
    useEffect(() => {
        if (yearParam) {
            setFormData(prev => ({
                ...prev,
                taxYear: yearParam,
                periodFrom: `0101${yearParam}`,
                periodTo: `3112${yearParam}`
            }));
            setStatus('Fiscal Context Applied');
        }
    }, [yearParam]);

    // Neural Link Connection
    useEffect(() => {
        if (!socket) return;

        // Fetch Initial Package Data from Server
        const fetchPackage = async () => {
            try {
                const res = await axios.get(`/api/tax/packages/${yearParam}`);
                if (res.data.data) {
                    // Convert Map to Object
                    const dbData = res.data.data;
                    setFormData(prev => ({ ...prev, ...dbData }));
                }
            } catch (e) {
                console.warn("No existing package found, using defaults.");
            }
        };
        fetchPackage();

        // Join Workspace
        socket.emit('workspace:join', { packageId: yearParam });

        // Listen for AI Operations
        socket.on('form:data', (newData) => {
            console.log("[Neural Link] Applied AI Patch:", newData);
            setFormData(prev => ({ ...prev, ...newData }));
            setStatus('AI Patch Applied');
        });

        socket.on('form:schema', (newSchema) => {
            setSchema(newSchema);
            setStatus('Form Layout Updated');
        });

        return () => {
            socket.off('form:data');
            socket.off('form:schema');
        };
    }, [socket, yearParam]);

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        // Logic to save to DB (Debounced) can be added here
    };

    const handleSave = async () => {
        try {
            await axios.put(`/api/tax/packages/${yearParam}`, { data: formData });
            setStatus('Work Saved');
        } catch (e) {
            console.error("Save Error", e);
        }
    };

    return (
        <ErrorBoundary>
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
                            data={formData || {}}
                            onChange={handleChange}
                            onSubmit={() => alert('Submit To Backend')}
                        />
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default LiveTaxWorkspace;
