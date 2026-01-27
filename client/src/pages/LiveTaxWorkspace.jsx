import React, { useState, useEffect } from 'react';
import DynamicForm from '../components/DynamicForm';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, RefreshCw, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INITIAL_SCHEMA = {
    title: "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED",
    description: "Form TOI 01 - Page 1 (General Information)",
    status: "active",
    sections: [
        {
            id: "header",
            // title: "Header", 
            fields: [
                { key: "taxYear", label: "For The Year Ended (DD-MM-YYYY)", type: "text", colSpan: 4 },
                { key: "periodFrom", label: "From (DD-MM-YYYY)", type: "text", colSpan: 4, colStart: 6 },
                { key: "periodTo", label: "Until (DD-MM-YYYY)", type: "text", colSpan: 3 }
            ]
        },
        {
            id: "identification_1",
            // title: "1. Enterprise Identification", 
            fields: [
                { key: "tin", label: "1. Tax Identification Number (TIN)", type: "text", readOnly: true, colSpan: 3 },
                { key: "enterpriseName", label: "2. Name of Enterprise", type: "text", readOnly: true, colSpan: 9 },
                { key: "vat_id", label: "3. VAT TIN (if different)", type: "text", colSpan: 6 },
                { key: "registrationDate", label: "4. Date of Tax Registration", type: "text", colSpan: 6 },
                { key: "directorName", label: "5. Name of Director/Manager/Owner", type: "text", colSpan: 12 },
                { key: "mainActivity", label: "6. Main Business Activities", type: "text", colSpan: 12 },
                { key: "accountantName", label: "7. Name of Accountant / Tax Service Agent", type: "text", colSpan: 8 },
                { key: "licenseNumber", label: "Tax Service Agent License Number", type: "text", colSpan: 4 },
                { key: "registeredAddress", label: "8. Current Registered Office Address", type: "textarea", colSpan: 6 },
                { key: "establishmentAddress", label: "9. Current Principal Establishment Address", type: "textarea", colSpan: 6 },
                { key: "warehouseAddress", label: "10. Warehouse Address", type: "textarea", colSpan: 12 }
            ]
        },
        {
            id: "accounting_records",
            fields: [
                {
                    key: "accounting_records",
                    label: "11. Accounting Records",
                    type: "checkbox-group",
                    colSpan: 12,
                    options: [
                        { value: "software", label: "Using Accounting Software" },
                        { value: "manual", label: "Not Using Accounting Software" }
                    ]
                }
            ]
        },
        {
            id: "compliance_status",
            fields: [
                {
                    key: "complianceStatus",
                    label: "12. Status of Tax Compliance",
                    type: "checkbox-group",
                    colSpan: 12,
                    options: [
                        { value: "gold", label: "Gold" },
                        { value: "silver", label: "Silver" },
                        { value: "bronze", label: "Bronze" }
                    ]
                },
                {
                    key: "audit_req",
                    label: "13. Statutory Audit Requirement",
                    type: "checkbox-group",
                    colSpan: 12,
                    options: [
                        { value: "required", label: "Required" },
                        { value: "not_required", label: "Not Required" }
                    ]
                }
            ]
        },
        {
            id: "legal_form",
            fields: [
                {
                    key: "legalForm",
                    label: "14. Legal Form of Business",
                    type: "checkbox-group",
                    colSpan: 12,
                    options: [
                        { value: "sole_prop", label: "Sole Proprietorship" },
                        { value: "partnership", label: "General Partnership" },
                        { value: "private_limited", label: "Private Limited Company" },
                        { value: "public_limited", label: "Public Limited Company" },
                        { value: "subsidary", label: "Foreign Company Branch" },
                        { value: "ngo", label: "Non-Government Organization" }
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
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 print:bg-white print:text-black">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-40 px-6 py-4 flex justify-between items-center print:hidden">
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
                    <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition">
                        Print / PDF
                    </button>
                    <button
                        onClick={handleSimulateAgent}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                    >
                        <RefreshCw size={16} /> Auto-Fill (AI)
                    </button>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="pt-28 pb-20 px-6 max-w-[1200px] mx-auto print:pt-0 print:px-0 print:max-w-full">
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
