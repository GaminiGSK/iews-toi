import React, { useState, useEffect } from 'react';
import DynamicForm from '../components/DynamicForm';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, RefreshCw, Radio, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const INITIAL_SCHEMA = {
    title: "Annual Income Tax Return",
    titleKh: "ANNUAL INCOME TAX RETURN FOR THE YEAR ENDED",
    status: "active",
    sections: [
        {
            id: "header_period",
            fields: [
                {
                    key: "taxYear",
                    label: "Tax Period (Number of Month)",
                    labelKh: "Period",
                    type: "boxes",
                    length: 2,
                    colSpan: 3,
                    layout: "horizontal"
                },
                {
                    key: "periodFrom",
                    label: "From",
                    labelKh: "From",
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
                    labelKh: "Until",
                    type: "boxes",
                    length: 8,
                    format: "2-2-4",
                    noDash: true,
                    colSpan: 4.5,
                    layout: "horizontal"
                }
            ]
        }
    ]
};

const LiveTaxWorkspace = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const packageId = searchParams.get('packageId') || searchParams.get('year');
    const socket = useSocket();
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (socket && packageId) {
            socket.emit('workspace:join', { packageId });
        }
    }, [socket, packageId]);

    return (
        <div className="min-h-screen bg-slate-900">
            <div className="max-w-[1700px] mx-auto px-10 py-8">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="flex items-center gap-4">
                        {isSyncing && (
                            <div className="flex items-center gap-2 text-blue-400 font-medium">
                                <RefreshCw size={16} className="animate-spin" />
                                <span>Syncing with GGMT Agent...</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm border border-green-500/20">
                            <Radio size={14} className="animate-pulse" />
                            <span>Neural Link Connected</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-3xl">
                    <DynamicForm schema={INITIAL_SCHEMA} packageId={packageId} />
                </div>
            </div>
        </div>
    );
};

export default LiveTaxWorkspace;
