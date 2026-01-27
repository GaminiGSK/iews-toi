import React, { useState, useEffect } from 'react';
import DynamicForm from '../components/DynamicForm';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, RefreshCw, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INITIAL_SCHEMA = {
    title: "លិខិតប្រកាសពន្ធលើប្រាក់ចំណូលប្រចាំឆ្នាំ",
    titleKh: "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED",
    status: "active",
    sections: [
        {
            id: "header",
            fields: [
                { key: "taxYear", label: "Tax Period (Number of Month)", labelKh: "ការបរិច្ឆេទសារពើពន្ធ (ចំនួនខែ)", type: "text", colSpan: 4 },
                { key: "periodFrom", label: "From (DD-MM-YYYY)", labelKh: "ចាប់ពីថ្ងៃទី", type: "text", colSpan: 4, colStart: 6 },
                { key: "periodTo", label: "Until (DD-MM-YYYY)", labelKh: "ដល់ថ្ងៃទី", type: "text", colSpan: 3 }
            ]
        },
        {
            id: "identification",
            fields: [
                {
                    key: "tin",
                    number: "1",
                    label: "Tax Identification Number (TIN)",
                    labelKh: "លេខអត្តសញ្ញាណកម្មសារពើពន្ធ (VATTIN)",
                    type: "text",
                    readOnly: true,
                    colSpan: 4
                },
                {
                    key: "enterpriseName",
                    number: "2",
                    label: "Name of Enterprise",
                    labelKh: "ឈ្មោះសហគ្រាស",
                    type: "text",
                    readOnly: true,
                    colSpan: 8
                },
                {
                    key: "vat_id",
                    number: "3",
                    label: "VAT TIN (if different)",
                    labelKh: "លេខអត្តសញ្ញាណកម្ម អតប (VATTIN) បើខុសពីខាងលើ",
                    type: "text",
                    colSpan: 6
                },
                {
                    key: "registrationDate",
                    number: "4",
                    label: "Date of Tax Registration",
                    labelKh: "កាលបរិច្ឆេទចុះបញ្ជីពន្ធដារ",
                    type: "text",
                    colSpan: 6
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
                    key: "accountantName",
                    number: "7",
                    label: "Name of Accountant / Tax Service Agent",
                    labelKh: "ឈ្មោះគណនេយ្យករ / ភ្នាក់ងារសេវាកម្មពន្ធដារ",
                    type: "text",
                    colSpan: 8
                },
                {
                    key: "licenseNumber",
                    label: "Tax Service Agent License Number",
                    labelKh: "លេខប័ណ្ណអនុញ្ញាតភ្នាក់ងារសេវាកម្មពន្ធដារ",
                    type: "text",
                    colSpan: 4
                },
                {
                    key: "registeredAddress",
                    number: "8",
                    label: "Current Registered Office Address",
                    labelKh: "អាសយដ្ឋានចុះបញ្ជីបច្ចុប្បន្នរបស់សហគ្រាស",
                    type: "textarea",
                    colSpan: 6
                },
                {
                    key: "establishmentAddress",
                    number: "9",
                    label: "Current Principal Establishment Address",
                    labelKh: "អាសយដ្ឋានទីតាំងអាជីវកម្មបច្ចុប្បន្ន",
                    type: "textarea",
                    colSpan: 6
                },
                {
                    key: "warehouseAddress",
                    number: "10",
                    label: "Warehouse Address",
                    labelKh: "អាសយដ្ឋានឃ្លាំងទំនិញ",
                    type: "textarea",
                    colSpan: 12
                },
                {
                    key: "accounting_records",
                    number: "11",
                    label: "Accounting Records",
                    labelKh: "ការកាន់កាប់បញ្ជីគណនេយ្យ",
                    type: "checkbox-group",
                    colSpan: 12,
                    options: [
                        { value: "software", label: "Using Accounting Software", labelKh: "ប្រើប្រាស់កម្មវិធីគណនេយ្យកុំព្យូទ័រ" },
                        { value: "manual", label: "Not Using Accounting Software", labelKh: "មិនប្រើប្រាស់កម្មវិធីគណនេយ្យ" }
                    ]
                },
                {
                    key: "complianceStatus",
                    number: "12",
                    label: "Status of Tax Compliance",
                    labelKh: "កម្រិតអនុលោមភាពសារពើពន្ធ",
                    type: "checkbox-group",
                    colSpan: 6,
                    options: [
                        { value: "gold", label: "Gold", labelKh: "មាស" },
                        { value: "silver", label: "Silver", labelKh: "ប្រាក់" },
                        { value: "bronze", label: "Bronze", labelKh: "សំរិទ្ធ" }
                    ]
                },
                {
                    key: "audit_req",
                    number: "13",
                    label: "Statutory Audit Requirement",
                    labelKh: "សវនកម្មឯករាជ្យ",
                    type: "checkbox-group",
                    colSpan: 6,
                    options: [
                        { value: "required", label: "Required", labelKh: "ត្រូវការត្រួតពិនិត្យ" },
                        { value: "not_required", label: "Not Required", labelKh: "មិនត្រូវការ" }
                    ]
                },
                {
                    key: "legalForm",
                    number: "14",
                    label: "Legal Form of Business",
                    labelKh: "ទម្រង់គតិយុត្ត ឬ ទម្រង់នៃប្រតិបត្តិការអាជីវកម្ម",
                    type: "checkbox-group",
                    colSpan: 12,
                    options: [
                        { value: "sole_prop", label: "Sole Proprietorship", labelKh: "សហគ្រាសឯកបុគ្គល" },
                        { value: "partnership", label: "General Partnership", labelKh: "សហកម្មសិទ្ធិទូទៅ" },
                        { value: "private_limited", label: "Private Limited Company", labelKh: "ក្រុមហ៊ុនឯកជនទទួលខុសត្រូវមានកម្រិត" },
                        { value: "public_limited", label: "Public Limited Company", labelKh: "ក្រុមហ៊ុនមហាជនទទួលខុសត្រូវមានកម្រិត" },
                        { value: "subsidary", label: "Foreign Company Branch", labelKh: "សាខាក្រុមហ៊ុនបរទេស" },
                        { value: "ngo", label: "NGO / Association", labelKh: "អង្គការមិនមែនរដ្ឋាភិបាល / សមាគម" }
                    ]
                }
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
            <div className="pt-28 pb-20 px-6 flex justify-center print:pt-0 print:px-0">
                {/* Paper Shadow Effect */}
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
