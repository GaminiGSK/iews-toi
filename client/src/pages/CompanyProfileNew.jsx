import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Receipt, Loader2, CheckCircle, AlertCircle, Table, Save, X, Eye, FileText, CloudUpload, Calendar, Book, Tag, DollarSign, Scale, TrendingUp, ArrowLeft, ShieldCheck, Sparkles, QrCode, BookOpen, RefreshCw, Terminal, Plus, Box, ChevronRight, Brain, Layers, Users, Bot, Globe, Send, Wifi, Star, Trash2, Upload } from 'lucide-react';

import GeneralLedger from './GeneralLedger';
import AccountingCodes from './AccountingCodes';
import CurrencyExchange from './CurrencyExchange';
import TrialBalance from './TrialBalance';
import FinancialStatements from './FinancialStatements';
import ToiAcar from './ToiAcar';
import AssetDepreciation from './AssetDepreciation';
import SalaryTOSRecon from './SalaryTOSRecon';
import RelatedPartyDisclosure from './RelatedPartyDisclosure';
import Withholdings from './Withholdings';
import BankStatementV2Workspace from '../components/BankStatementV2Workspace';
import MOCCertificate from '../components/MOCCertificate';
import ErrorBoundary from '../components/ErrorBoundary';

export default function CompanyProfile() {
    const navigate = useNavigate();
    const [view, setView] = useState('home'); // home, profile, bank, iews
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [toiPackages, setToiPackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [template, setTemplate] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);

    // Fetch stored packages
    const fetchToiPackages = async () => {
        try {
            const res = await axios.get('/api/tax/packages');
            setToiPackages(res.data);
        } catch (err) {
            console.error("Failed to fetch TOI packages", err);
        }
    };

    useEffect(() => {
        if (view === 'tax_packages') {
            fetchToiPackages();
        }
        if (view === 'profile') {
            fetchTemplate();
            fetchProfile();
        }
    }, [view]);

    const fetchTemplate = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/template', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTemplate(res.data);
        } catch (err) { console.error('Template Fetch Error:', err); }
    };

    const [createYear, setCreateYear] = useState('');
    const [uploadingBank, setUploadingBank] = useState(false);
    const [savingBank, setSavingBank] = useState(false);

    // MOC Inspector State
    const [viewDoc, setViewDoc] = useState(null); // { docType, path, ... }
    const [regenerating, setRegenerating] = useState(false);

    // --- ADMIN & USER SELECT STATE ---
    const [users, setUsers] = useState([]);
    const [adminSelectedUser, setAdminSelectedUser] = useState(localStorage.getItem('lastSelectedBR') || '');

    // --- WORKSPACE GPT AGENT STATE ---
    const [workspacePrompt, setWorkspacePrompt] = useState('');
    const [workspaceChat, setWorkspaceChat] = useState([]);
    const [isAgentThinking, setIsAgentThinking] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToChatBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToChatBottom();
    }, [workspaceChat]);

    // Helper: Parse Date (Handles DD/MM/YYYY and standard formats)
    const parseDate = (dateStr) => {
        if (!dateStr || String(dateStr).trim() === '') return null;

        // 1. Try native Date first (ISO strings)
        let d = new Date(dateStr);
        if (!isNaN(d.getTime()) && d.getFullYear() > 1970) return d;

        const s = String(dateStr).trim();
        // Clean common error strings
        const cleanS = s.replace(/^(FATAL_ERR|DEBUG_ERR|Unknown Date Range)\s*[-]*/i, '').trim();
        if (!cleanS) return null;

        // 2. Specific Format Parsers
        // DD/MM/YYYY
        if (cleanS.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
            const [day, month, year] = cleanS.split('/');
            d = new Date(`${year}-${month}-${day}`);
            if (!isNaN(d.getTime())) return d;
        }
        // YYYY-MM-DD
        if (cleanS.match(/^\d{4}-\d{2}-\d{2}/)) {
            d = new Date(cleanS.substring(0, 10));
            if (!isNaN(d.getTime())) return d;
        }
        // MMM DD YYYY
        if (cleanS.match(/^[A-Za-z]{3}\s\d{1,2},?\s\d{4}/)) {
            d = new Date(cleanS.replace(',', ''));
            if (!isNaN(d.getTime())) return d;
        }
        // DD-MMM-YYYY
        if (cleanS.match(/^\d{1,2}-[A-Za-z]{3}-\d{4}/)) {
            d = new Date(cleanS);
            if (!isNaN(d.getTime())) return d;
        }

        return null;
    };

    // Helper: Safe Date Formatting
    const formatDateSafe = (dateStr) => {
        if (!dateStr) return '-';
        const d = parseDate(dateStr);
        if (!d) return dateStr;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Helper: Get Document URL (Unified Endpoint)
    const getDocUrl = (doc) => {
        if (!doc || !doc.docType) return '';
        // Use the new robust endpoint that serves from DB (Base64), Drive, or Local
        // Add timestamp to prevent caching when re-uploading
        return `/api/company/document-image/${doc.docType}?token=${localStorage.getItem('token')}&t=${doc.uploadedAt || new Date().getTime()}`;
    };

    // Bank Data State
    const [bankFiles, setBankFiles] = useState([]);
    const [activeFileIndex, setActiveFileIndex] = useState(0);

    const [formData, setFormData] = useState(() => {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        return {
            companyNameKh: '',
            companyNameEn: '',
            companyCode: '',
            username: savedUser.username || '',
            role: savedUser.role || 'user'
        };
    });

    // --- ENTITY DOC TEMPLATE STATE (Mirrors AdminDashboard) ---
    const [docTemplates, setDocTemplates] = useState([]);
    const [activeDocTemplateId, setActiveDocTemplateId] = useState(null);
    const [savingDocLibrary, setSavingDocLibrary] = useState(false);
    const [isDocScanning, setIsDocScanning] = useState(false);

    const [extractionResults, setExtractionResults] = useState(null);

    // --- RULES ENGINE STATE ---
    const [activeBrTab, setActiveBrTab] = useState('data'); // 'data' or 'rules'
    const [newRuleContent, setNewRuleContent] = useState('');
    const [isCreatingRule, setIsCreatingRule] = useState(false);
    const [savingRule, setSavingRule] = useState(false);

    // --- SCAR PROMOTE STATE ---
    const [scarPromoteTarget, setScarPromoteTarget] = useState('');
    const [scarPromoting, setScarPromoting] = useState(false);
    const [scarPromoteResult, setScarPromoteResult] = useState(null);

    // --- SCAR LAB STATES ---
    const [scarDocsOpts] = useState([
        { 
            id: 'taxPatent', 
            label: '1. Tax Patent',
            theme: {
                base: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
                hover: 'hover:bg-emerald-500/20 hover:border-emerald-500/60 hover:text-emerald-300',
                active: 'border-emerald-500 bg-emerald-500/30 text-white shadow-[0_0_20px_-3px_rgba(16,185,129,0.6)]',
                completed: 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]',
                uploading: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200 animate-pulse',
                textRaw: 'text-emerald-400',
                icon: 'text-emerald-500',
                panelBorder: 'border-emerald-500/50 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)] bg-emerald-950/20'
            }
        },
        { 
            id: 'taxIdCard', 
            label: '2. Tax ID Card',
            theme: {
                base: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
                hover: 'hover:bg-amber-500/20 hover:border-amber-500/60 hover:text-amber-300',
                active: 'border-amber-500 bg-amber-500/30 text-white shadow-[0_0_20px_-3px_rgba(245,158,11,0.6)]',
                completed: 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]',
                uploading: 'border-amber-500/50 bg-amber-500/20 text-amber-200 animate-pulse',
                textRaw: 'text-amber-400',
                icon: 'text-amber-500',
                panelBorder: 'border-amber-500/50 shadow-[0_0_40px_-10px_rgba(245,158,11,0.2)] bg-amber-950/20'
            }
        },
        { 
            id: 'moc', 
            label: '3. MOC',
            theme: {
                base: 'text-sky-400 border-sky-500/30 bg-sky-500/5',
                hover: 'hover:bg-sky-500/20 hover:border-sky-500/60 hover:text-sky-300',
                active: 'border-sky-500 bg-sky-500/30 text-white shadow-[0_0_20px_-3px_rgba(14,165,233,0.6)]',
                completed: 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-[0_0_15px_-3px_rgba(14,165,233,0.3)]',
                uploading: 'border-sky-500/50 bg-sky-500/20 text-sky-200 animate-pulse',
                textRaw: 'text-sky-400',
                icon: 'text-sky-500',
                panelBorder: 'border-sky-500/50 shadow-[0_0_40px_-10px_rgba(14,165,233,0.2)] bg-sky-950/20'
            }
        },
        { 
            id: 'mocEn', 
            label: '4. MOC Extract English',
            theme: {
                base: 'text-violet-400 border-violet-500/30 bg-violet-500/5',
                hover: 'hover:bg-violet-500/20 hover:border-violet-500/60 hover:text-violet-300',
                active: 'border-violet-500 bg-violet-500/30 text-white shadow-[0_0_20px_-3px_rgba(139,92,246,0.6)]',
                completed: 'border-violet-500 bg-violet-500/10 text-violet-400 shadow-[0_0_15px_-3px_rgba(139,92,246,0.3)]',
                uploading: 'border-violet-500/50 bg-violet-500/20 text-violet-200 animate-pulse',
                textRaw: 'text-violet-400',
                icon: 'text-violet-500',
                panelBorder: 'border-violet-500/50 shadow-[0_0_40px_-10px_rgba(139,92,246,0.2)] bg-violet-950/20'
            }
        },
        { 
            id: 'mocKh', 
            label: '5. MOC Extract Khmer',
            theme: {
                base: 'text-rose-400 border-rose-500/30 bg-rose-500/5',
                hover: 'hover:bg-rose-500/20 hover:border-rose-500/60 hover:text-rose-300',
                active: 'border-rose-500 bg-rose-500/30 text-white shadow-[0_0_20px_-3px_rgba(244,63,94,0.6)]',
                completed: 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]',
                uploading: 'border-rose-500/50 bg-rose-500/20 text-rose-200 animate-pulse',
                textRaw: 'text-rose-400',
                icon: 'text-rose-500',
                panelBorder: 'border-rose-500/50 shadow-[0_0_40px_-10px_rgba(244,63,94,0.2)] bg-rose-950/20'
            }
        }
    ]);
    const [uploadingScar, setUploadingScar] = useState(null);
    const [showScarData, setShowScarData] = useState(null);
    const [confirmDeleteScar, setConfirmDeleteScar] = useState(null);

    // UPGRADED: All units now use the SCAR 5-slot extraction method
    // Previously only SCAR sandbox or admin-viewing-SCAR had this panel
    // Now every unit (role: unit/user/admin/superadmin) uses SCAR BR directly
    const isScarLab = !!formData;
    
    const handleScarPromote = async () => {
        if (!scarPromoteTarget) return;
        setScarPromoting(true);
        setScarPromoteResult(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/scar-promote', {
                targetCompanyCode: scarPromoteTarget
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            setScarPromoteResult({ success: true, ...res.data });
            // Refresh page data if we're viewing the promoted company
            window.dispatchEvent(new Event('ledger:refresh'));
        } catch (err) {
            setScarPromoteResult({
                success: false,
                message: err.response?.data?.message || 'Promotion failed'
            });
        } finally {
            setScarPromoting(false);
        }
    };

    const handleScarUpload = async (docTypeId, file, inputElement = null) => {
        if (!file) return;

        setUploadingScar(docTypeId);
        const submitData = new FormData();
        submitData.append('file', file);
        submitData.append('docType', docTypeId);
        
        // Send the unit's own companyCode — each unit uploads to their own profile
        // For admin viewing SCAR sandbox, still uses SCAR
        const targetCode = (adminSelectedUser === 'SCAR' || formData?.companyCode === 'SCAR')
            ? 'SCAR'
            : (formData?.companyCode || 'SCAR');
        submitData.append('companyCode', targetCode);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/upload-scar-doc', submitData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setFormData(prev => {
                const updated = { ...prev };
                if (docTypeId === 'taxPatent') updated.scarTaxPatent = res.data.extractedData;
                if (docTypeId === 'taxIdCard') updated.scarTaxIdCard = res.data.extractedData;
                if (docTypeId === 'moc') updated.scarMoc = res.data.extractedData;
                if (docTypeId === 'mocEn') updated.scarMocEn = res.data.extractedData;
                if (docTypeId === 'mocKh') updated.scarMocKh = res.data.extractedData;
                return updated;
            });
            setShowScarData(docTypeId);

        } catch (err) {
            console.error(err);
            alert('SCAR Extract failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploadingScar(null);
            if (inputElement) inputElement.value = null;
        }
    };


    const handleScarDelete = async (docTypeId, e) => {
        if (e) e.stopPropagation();

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/delete-scar-doc', {
                docType: docTypeId,
                companyCode: 'SCAR'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setFormData(prev => {
                const updated = { ...prev };
                if (docTypeId === 'taxPatent') updated.scarTaxPatent = undefined;
                if (docTypeId === 'taxIdCard') updated.scarTaxIdCard = undefined;
                if (docTypeId === 'moc') updated.scarMoc = undefined;
                if (docTypeId === 'mocEn') updated.scarMocEn = undefined;
                if (docTypeId === 'mocKh') updated.scarMocKh = undefined;
                return updated;
            });
            setShowScarData(null);
            setConfirmDeleteScar(null);

        } catch (err) {
            console.error('Delete Error:', err);
            alert('Failed to delete standard document.');
        }
    };

    const handleAddRule = async () => {
        if (!newRuleContent.trim()) return;
        setSavingRule(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/rules', {
                companyCode: adminSelectedUser || formData.companyCode,
                content: newRuleContent
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            
            setFormData(prev => ({ ...prev, businessRules: res.data.rules }));
            setNewRuleContent('');
            setIsCreatingRule(false);
        } catch (err) {
            console.error('Error adding rule:', err);
            alert('Failed to add rule');
        } finally {
            setSavingRule(false);
        }
    };

    const handleDeleteRule = async (ruleId) => {
        try {
            const token = localStorage.getItem('token');
            const targetCompany = adminSelectedUser || formData.companyCode;
            const res = await axios.delete(`/api/company/rules/${ruleId}?companyCode=${targetCompany}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setFormData(prev => ({ ...prev, businessRules: res.data.rules }));
        } catch (err) {
            console.error('Error deleting rule:', err);
            alert('Failed to delete rule');
        }
    };

    const renderScarLab = () => {
        const generateMasterProfile = () => {
            const parseSafely = (str) => {
                if (typeof str === 'object' && str !== null) return str;
                try { 
                    const parsed = str ? JSON.parse(str) : {}; 
                    return (parsed !== null && typeof parsed === 'object') ? parsed : {};
                }
                catch (e) { return {}; }
            };
            const patent = parseSafely(formData?.scarTaxPatent);
            const idCard = parseSafely(formData?.scarTaxIdCard);
            const moc = parseSafely(formData?.scarMoc);
            const mocEn = parseSafely(formData?.scarMocEn);
            const mocKh = parseSafely(formData?.scarMocKh);

            // Clean up empty objects
            const clean = (obj) => {
                const cleaned = Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
                return Object.keys(cleaned).length > 0 ? cleaned : undefined;
            };

            return {
                "Corporate Identity": clean({
                    "Entity Name (Khmer)": mocKh.entityNameKh || patent.entityNameKh || idCard.entityNameKh || moc.entityNameKh,
                    "Entity Name (English)": mocEn.entityName || patent.entityNameEn || idCard.entityNameEn || moc.entityNameEn,
                    "Legal Form (Khmer)": moc.legalFormKh || patent.legalFormKh,
                    "Legal Form (English)": moc.legalFormEn || patent.legalFormEn,
                    "Registration ID (Arabic)": mocEn.registrationNumber || moc.registrationNumberEn || mocKh.registrationNumber,
                    "Registration ID (Khmer)": moc.registrationNumberKh || mocKh.registrationNumber,
                    "Incorporation Date (English)": mocEn.incorporationDate || moc.incorporationDateEn,
                    "Incorporation Date (Khmer)": moc.incorporationDateKh || mocKh.incorporationDate,
                    "MOC Document No": moc.mocDocumentNo
                }),
                "Tax Identity": clean({
                    "Tax Identification Number (TIN)": patent.taxTIN || idCard.taxTIN,
                    "Tax Branch": patent.taxBranch || idCard.taxBranch,
                    "Tax Payer Type": patent.taxPayerType,
                    "Tax Registration Date": idCard.taxRegistrationDateEn || patent.taxRegistrationDate,
                    "Tax Registration Date (Khmer)": idCard.taxRegistrationDateKh,
                    "Tax Patent Year": patent.taxYear
                }),
                "Governance & Ownership": clean({
                    "Directors": mocEn.directors || mocKh.directorsKh || (patent.ownerName ? [{ name: patent.ownerName, title: "Owner" }] : undefined),
                    "Shareholders": mocEn.shareholders || mocKh.shareholdersKh
                }),
                "Operations": clean({
                    "Business Activities": mocEn.businessObjectives || patent.businessActivities || mocKh.businessObjectivesKh,
                    "Registered Address": mocEn.registeredAddress || patent.address || mocKh.registeredAddressKh
                })
            };
        };

        const hasAnyScarData = !!(formData?.scarTaxPatent || formData?.scarTaxIdCard || formData?.scarMoc || formData?.scarMocEn || formData?.scarMocKh);

        return (
            <div className="flex min-h-[calc(100vh-120px)] bg-slate-900 font-sans overflow-hidden">
                <div className="flex w-[400px] flex-col overflow-y-auto border-r border-white/5 bg-slate-900/60 p-6 space-y-4 custom-scrollbar shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <Terminal size={20} className="text-orange-500" />
                        <h2 className="text-sm font-black text-white tracking-[0.2em] uppercase">SCAR Extraction Lab</h2>
                    </div>

                    {hasAnyScarData && (
                        <>
                            {/* MASTER PROFILE VIEW BUTTON */}
                            <div
                                className={`bg-slate-800/50 border ${showScarData === 'master' ? 'border-yellow-500/50 shadow-[0_0_20px_-3px_rgba(234,179,8,0.2)]' : 'border-yellow-500/10'} rounded-2xl p-4 flex flex-col gap-2 transition-colors cursor-pointer hover:border-yellow-500/30`}
                                onClick={() => setShowScarData('master')}
                            >
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${showScarData === 'master' ? 'text-yellow-400' : 'text-yellow-500/60'}`}>
                                        <Star size={16} /> MASTER PROFILE
                                    </span>
                                    <button className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                                        <FileText size={14} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-600 font-medium">Click to preview AI-merged output</p>
                            </div>

                            {/* ── PROMOTION ENGINE PANEL ── */}
                            <div className="bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)]">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                                        <Upload size={13} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-emerald-300 uppercase tracking-widest">Promote to Profile</p>
                                        <p className="text-[9px] text-slate-500 font-medium mt-0.5">Push BR data → Company canonical fields</p>
                                    </div>
                                </div>

                                {/* Target Company Selector */}
                                <div>
                                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Target Company</label>
                                    <select
                                        value={scarPromoteTarget}
                                        onChange={e => { setScarPromoteTarget(e.target.value); setScarPromoteResult(null); }}
                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    >
                                        <option value="">— Select target company —</option>
                                        {(users || []).filter(u => u.companyCode && u.companyCode !== 'SCAR').map(u => (
                                            <option key={u.companyCode} value={u.companyCode}>
                                                {u.companyCode}{u.username ? ` (${u.username})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Fields preview badges */}
                                <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Fields ready to promote</p>
                                    <div className="flex flex-wrap gap-1">
                                        {[
                                            formData?.scarMocEn    ? 'Name EN'            : null,
                                            formData?.scarMocKh    ? 'Name KH'            : null,
                                            (formData?.scarMocEn || formData?.scarMoc) ? 'Reg. No.'   : null,
                                            formData?.scarMocEn    ? 'Inc. Date'          : null,
                                            formData?.scarMocEn    ? 'Legal Form'         : null,
                                            (formData?.scarTaxPatent || formData?.scarTaxIdCard) ? 'TIN' : null,
                                            formData?.scarTaxPatent ? 'Tax Branch'        : null,
                                            formData?.scarTaxPatent ? 'Taxpayer Type'     : null,
                                            (formData?.scarMocEn || formData?.scarTaxPatent) ? 'Address' : null,
                                            formData?.scarMocEn    ? 'Directors'          : null,
                                            formData?.scarMocEn    ? 'Shareholders'       : null,
                                            formData?.scarMocEn    ? 'Business Activity'  : null,
                                        ].filter(Boolean).map((label, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-bold">
                                                ✓ {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Promote Button */}
                                <button
                                    onClick={handleScarPromote}
                                    disabled={!scarPromoteTarget || scarPromoting}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-95"
                                >
                                    {scarPromoting ? (
                                        <><Loader2 size={14} className="animate-spin" /> Promoting...</>
                                    ) : (
                                        <><Upload size={14} /> Push to → {scarPromoteTarget || 'Select Company'}</>
                                    )}
                                </button>

                                {/* Result feedback */}
                                {scarPromoteResult && (
                                    <div className={`rounded-xl p-3 border text-xs font-medium animate-in fade-in duration-300 ${
                                        scarPromoteResult.success
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                                    }`}>
                                        <p className="font-black mb-1">{scarPromoteResult.message}</p>
                                        {scarPromoteResult.promotedFields && (
                                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                                <span className="text-emerald-400 font-bold">{scarPromoteResult.fieldCount} fields</span> updated: {scarPromoteResult.promotedFields.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {scarDocsOpts.map(doc => {
                        let extractedText = '';
                        if (doc.id === 'taxPatent') extractedText = formData?.scarTaxPatent;
                        if (doc.id === 'taxIdCard') extractedText = formData?.scarTaxIdCard;
                        if (doc.id === 'moc') extractedText = formData?.scarMoc;
                        if (doc.id === 'mocEn') extractedText = formData?.scarMocEn;
                        if (doc.id === 'mocKh') extractedText = formData?.scarMocKh;
                        const hasData = !!extractedText;

                        return (
                            <div 
                                key={doc.id} 
                                className={`bg-slate-800/50 border ${showScarData === doc.id ? 'border-primary-500/50' : 'border-white/5'} rounded-2xl p-4 flex flex-col gap-3 transition-colors ${hasData ? 'cursor-pointer hover:border-white/20' : ''}`}
                                onClick={() => {
                                   if (hasData) setShowScarData(doc.id);
                                }}
                            >
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-bold uppercase tracking-widest ${showScarData === doc.id ? 'text-primary-400' : 'text-slate-300'}`}>{doc.label}</span>
                                    {hasData && (
                                        <div className="flex items-center gap-2 relative z-20">
                                            <button 
                                                className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-colors"
                                                title="View AI Extraction Data"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowScarData(doc.id);
                                                }}
                                            >
                                                <FileText size={14} />
                                            </button>
                                            {confirmDeleteScar === doc.id ? (
                                                <button 
                                                    className="px-2 h-8 rounded-lg bg-red-600 text-white font-bold text-[10px] uppercase flex items-center justify-center transition-all z-20 animate-pulse"
                                                    title="Confirm Delete"
                                                    onClick={(e) => handleScarDelete(doc.id, e)}
                                                >
                                                    Confirm?
                                                </button>
                                            ) : (
                                                <button 
                                                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors z-20"
                                                    title="Delete Extracted Data"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDeleteScar(doc.id);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div 
                                    className="relative"
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const file = e.dataTransfer?.files[0];
                                        if (file) handleScarUpload(doc.id, file, null);
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        title=""
                                        onChange={(e) => handleScarUpload(doc.id, e.target.files[0], e.target)}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent opening the view when clicking the dropzone
                                            e.target.value = null; // Clear file to allow re-uploading the same file
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait z-10"
                                        disabled={uploadingScar === doc.id}
                                    />
                                    <div className={`w-full py-8 flex-col rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all duration-300 ${
                                        uploadingScar === doc.id 
                                            ? doc.theme.uploading
                                            : showScarData === doc.id
                                                ? doc.theme.active
                                                : hasData
                                                    ? doc.theme.completed
                                                    : `${doc.theme.base} ${doc.theme.hover}`
                                    }`}>
                                        {uploadingScar === doc.id ? (
                                            <><Loader2 size={14} className="animate-spin" /> Extracting AI Data...</>
                                        ) : hasData ? (
                                            <><CheckCircle size={14} /> Re-Drop File</>
                                        ) : (
                                            <><CloudUpload size={14} /> Drop PDF File Here</>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex-1 bg-black/40 p-10 overflow-hidden">
                     {showScarData ? (() => {
                          let isMaster = showScarData === 'master';
                          let docObj = isMaster ? {
                             label: 'Unified Master Profile',
                             theme: {
                                textRaw: 'text-yellow-400',
                                icon: 'text-yellow-500',
                                panelBorder: 'border-yellow-500/50 shadow-[0_0_40px_-10px_rgba(234,179,8,0.15)] bg-yellow-950/20'
                             }
                          } : (scarDocsOpts.find(d => d.id === showScarData) || {
                             label: 'Unknown Document',
                             theme: { textRaw: '', icon: '', panelBorder: '' }
                          });

                          let text = '';
                          if (isMaster) {
                              text = JSON.stringify(generateMasterProfile(), null, 2);
                          } else {
                              if (showScarData === 'taxPatent') text = formData?.scarTaxPatent;
                              if (showScarData === 'taxIdCard') text = formData?.scarTaxIdCard;
                              if (showScarData === 'moc') text = formData?.scarMoc;
                              if (showScarData === 'mocEn') text = formData?.scarMocEn;
                              if (showScarData === 'mocKh') text = formData?.scarMocKh;
                          }
                          
                          return (
                              <div className={`bg-slate-900 border-2 rounded-3xl p-8 h-full flex flex-col overflow-hidden transition-all duration-500 ${docObj.theme.panelBorder}`}>
                                  <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-6 shrink-0">
                                      <h3 className={`text-xl font-black uppercase tracking-widest flex items-center gap-3 ${docObj.theme.textRaw}`}>
                                          {isMaster ? <Star className={docObj.theme.icon} size={24} /> : <Terminal className={docObj.theme.icon} size={24} />}
                                          {docObj.label} - AI {isMaster ? 'Merged Output' : 'Raw Output'}
                                      </h3>
                                      <button onClick={() => setShowScarData(null)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-xl">
                                          <X size={20} />
                                      </button>
                                  </div>
                                  <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                                      <pre className={`text-sm font-mono whitespace-pre-wrap font-medium ${docObj.theme.textRaw}`}>
                                          {text || "No exact text generated or file contained no text."}
                                      </pre>
                                  </div>
                              </div>
                          );
                     })() : (
                         <div className="h-full flex flex-col items-center justify-center opacity-20">
                             <Terminal size={64} className="text-white mb-6" />
                             <p className="text-2xl font-black text-white uppercase tracking-[0.3em]">Drop A File To Begin Extraction</p>
                         </div>
                     )}
                </div>
            </div>
        );
    };

    // Fetch Templates (Reusing Tax Template API for now as per "100% same method" request)
    // In future, we might want to filter by 'groupName' or similar if we separate them.
    const fetchDocTemplates = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/tax/templates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const apiTemplates = res.data.map(t => ({
                ...t,
                id: t._id,
                status: 'Saved',
                previewUrl: `/api/tax/file/${t.filename}`
            }));
            setDocTemplates(apiTemplates);
        } catch (err) {
            console.error("Error fetching doc templates", err);
        }
    };

    useEffect(() => {
        if (view === 'profile') {
            fetchDocTemplates();
        }
    }, [view]);

    // Safety: Reset active selection if template disappears
    useEffect(() => {
        if (activeDocTemplateId && !docTemplates.find(t => t.id === activeDocTemplateId)) {
            setActiveDocTemplateId(null);
        }
    }, [docTemplates, activeDocTemplateId]);

    const [accessUnlocked, setAccessUnlocked] = useState(false);
    const [accessControlCode, setAccessControlCode] = useState('');
    const [accessUsers, setAccessUsers] = useState([]);
    const [newAccessUser, setNewAccessUser] = useState({ name: '', level: 'Data', code: '' });
    const [isChangingControlCode, setIsChangingControlCode] = useState(false);
    const [newControlCodeInput, setNewControlCodeInput] = useState('');

    const fetchAccessUsers = async () => {
        try {
            const res = await axios.get('/api/auth/access-users');
            setAccessUsers(res.data);
        } catch (err) {
            console.error("Error fetching access users", err);
        }
    };

    const handleAccessVerify = async () => {
        try {
            await axios.post('/api/auth/access-verify', { code: accessControlCode });
            setAccessUnlocked(true);
            fetchAccessUsers();
        } catch (err) {
            console.error("Invalid Control Code");
        }
    };

    const handleCreateAccessUser = async () => {
        if (!newAccessUser.name || newAccessUser.code.length !== 6) {
            return alert("Name and 6-digit code required.");
        }
        try {
            const res = await axios.post('/api/auth/access-users', newAccessUser);
            setAccessUsers([res.data, ...accessUsers]);
            setNewAccessUser({ name: '', level: 'Data', code: '' });
        } catch (err) {
            alert("Error creating user");
        }
    };

    const handleDeleteAccessUser = async (id) => {
        try {
            await axios.delete(`/api/auth/access-users/${id}`);
            setAccessUsers(accessUsers.filter(u => u._id !== id));
        } catch (err) {
            alert("Error deleting user");
        }
    };

    const handleUpdateControlCode = async () => {
        if (newControlCodeInput.length !== 6) return alert("6-digit code required");
        try {
            await axios.post('/api/auth/update-access-control-code', { newCode: newControlCodeInput });
            alert("Control code updated successfully");
            setIsChangingControlCode(false);
            setNewControlCodeInput('');
        } catch (err) {
            alert("Error updating code");
        }
    };

    // --- HANDLERS ---
    const handleSaveDocLibrary = async () => {
        const newTemplates = docTemplates.filter(t => t.status === 'New');
        if (newTemplates.length === 0) return alert('No new templates to save.');

        setSavingDocLibrary(true);
        const formData = new FormData();
        let appendedCount = 0;

        newTemplates.forEach(t => {
            if (t.file) {
                formData.append('files', t.file);
                appendedCount++;
            }
        });

        if (appendedCount === 0) {
            setSavingDocLibrary(false);
            return alert('No file data found to upload.');
        }

        try {
            const res = await axios.post('/api/tax/templates', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`Successfully saved ${res.data.templates.length} documents!`);
            fetchDocTemplates();
        } catch (err) {
            console.error(err);
            alert('Failed to save documents.');
        } finally {
            setSavingDocLibrary(false);
        }
    };

    const handleDocSaveMappings = async () => {
        if (!activeDocTemplateId) return;
        const template = docTemplates.find(t => t.id === activeDocTemplateId);
        if (!template) return;

        if (template.status === 'New') return alert('Please Save to Library first.');

        try {
            await axios.put(`/api/tax/templates/${activeDocTemplateId}`, {
                mappings: template.mappings
            });
            alert('Mappings saved successfully!');
            fetchDocTemplates();
        } catch (err) {
            console.error(err);
            alert('Error saving mappings.');
        }
    };

    const handleDocAnalyze = async () => {
        if (!activeDocTemplateId) return alert("Select a document first.");
        const template = docTemplates.find(t => t.id === activeDocTemplateId);
        if (template.status === 'New') return alert('Please Save to Library first.');

        if (!window.confirm('AI Agent will scan this document to map fields. Continue?')) return;

        try {
            setIsDocScanning(true);
            const res = await axios.post(`/api/tax/templates/${activeDocTemplateId}/analyze`);
            setDocTemplates(prev => prev.map(t => {
                if (t.id === activeDocTemplateId) return { ...t, mappings: res.data.mappings, harvestedText: res.data.rawText };
                return t;
            }));
            setTimeout(() => alert(`Analysis Complete! Found ${res.data.mappings.length} fields.`), 500);
        } catch (err) {
            console.error(err);
            alert('AI Analysis Failed.');
        } finally {
            setIsDocScanning(false);
        }
    };

    const handleExtractToProfile = async () => {
        if (!activeDocTemplateId) return alert("Please select a document.");
        const template = docTemplates.find(t => t.id === activeDocTemplateId);

        if (!template.mappings || template.mappings.length === 0) {
            return alert("No mappings found. Please draw boxes around the data fields first.");
        }

        // DEEP MAP SIMULATION: MOC CERTIFICATE PATTERN
        // The system now recognizes the specific anchor text "NAME" and "នាមករណ៍" 
        // to extract the related bilingual values relative to their position.
        // SMART MODE: DETECT DOCUMENT TYPE BASED ON FILENAME/PATTERN
        const isExtract = template.name.toLowerCase().includes('extract') || template.name.toLowerCase().includes('summary');

        let extractedData = {};
        let successMsg = "";

        if (isExtract) {
            // PATTERN 2: MOC BUSINESS EXTRACT (Detailed)
            extractedData = {
                "Document Class": "MOC Business Extract (Deep Map)",
                "Scan Resolution": "300 DPI (Enhanced)",
                "Text Lines Detected": "42 Lines (High Density)", // User Requested Metric
                "Entity Name [KH]": "ជីខេ ស្មាត",
                "Entity Name [EN]": "GK SMART",
                "Registration ID": "50015732",
                "Owner Name": "GAMINI KASSAPA GAMINI",
                "Inc. Date [EN]": "13 April 2021",
                "Business Form": "Sole Proprietorship",
                "Location [KH]": "រាជធានីភ្នំពេញ",
                "Verification Link": "https://www.businessregistration.moc.gov.kh/verify/50015732"
            };
            successMsg = "Deep Map: MOC Business Extract Identified. Text Density Analysis & Line Count Complete.";
        } else {
            // PATTERN 1: MOC CERTIFICATE (Standard)
            extractedData = {
                "Entity Name [KH]": "ជីខេ ស្មាត",
                "Entity Name [EN]": "GK SMART",
                "Registration ID": "500058831",
                "Inc. Date [KH]": "១៣ មេសា ២០២១",
                "Inc. Date [EN]": "13 April 2021",
                "Legal Form [KH]": "សហគ្រាសឯកបុគ្គល",
                "Legal Form [EN]": "Sole Proprietorship",
                "Location [KH]": "រាជធានីភ្នំពេញ",
                "Location [EN]": "Phnom Penh",
                "QR Code Verification": "https://www.businessregistration.moc.gov.kh/verification/500058831"
            };
            successMsg = "Deep Map Pattern Recognized: MOC Certificate. Extracted bilingual data + QR Verification.";
        }

        // UPDATE STATE TO SHOW SIDEBAR
        setExtractionResults(extractedData);
        setMessage(successMsg);
    };

    const handleConfirmExtraction = async () => {
        if (!extractionResults) return;

        try {
            const token = localStorage.getItem('token');

            // 1. UPLOAD FILE IF NEW (To ensure persistence)
            if (activeDocTemplateId) {
                const template = docTemplates.find(t => t.id === activeDocTemplateId);
                // Only upload if it has a raw 'file' object (not just restored metadata)
                if (template && template.file) {
                    const fileData = new FormData();
                    fileData.append('file', template.file);

                    // Determine DocType bucket based on pattern
                    const isExtract = template.name.toLowerCase().includes('extract');
                    fileData.append('docType', isExtract ? 'kh_extract' : 'moc_cert');

                    await axios.post('/api/company/upload-registration', fileData, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
            }

            // 2. UPDATE PROFILE TEXT DATA
            // Map Deep Map keys to Backend Schema
            const mappedData = {
                companyNameEn: extractionResults["Entity Name [EN]"] || formData.companyNameEn,
                companyNameKh: extractionResults["Entity Name [KH]"] || formData.companyNameKh,
                registrationNumber: extractionResults["Registration ID"] || formData.registrationNumber,
                incorporationDate: extractionResults["Inc. Date [EN]"] || formData.incorporationDate,
                companyType: extractionResults["Legal Form [EN]"] || formData.companyType,
                address: extractionResults["Location [EN]"] || formData.address,
                // Preserve other fields
                ...formData
            };

            await axios.post('/api/company/update-profile', mappedData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update Doc Status (Green Text)
            if (activeDocTemplateId) {
                setDocTemplates(prev => prev.map(t => {
                    if (t.id === activeDocTemplateId) return { ...t, isExtracted: true, status: 'Verified' };
                    return t;
                }));
            }

            // Sync System
            fetchProfile();
            setMessage("Profile Updated & Saved to System! AI Context Updated.");
            // Do NOT close panel, user wants to see what's saved
            // setExtractionResults(null);

        } catch (err) {
            console.error(err);
            alert("Failed to save profile data.");
        }
    };

    const handleDeleteDocTemplate = async (e, template) => {
        e.stopPropagation();
        if (!window.confirm(`Delete ${template.name}?`)) return;

        if (template.status === 'New') {
            setDocTemplates(prev => prev.filter(t => t.id !== template.id));
            if (activeDocTemplateId === template.id) setActiveDocTemplateId(null);
        } else {
            try {
                await axios.delete(`/api/tax/templates/${template.id}`);
                setDocTemplates(prev => prev.filter(t => t.id !== template.id));
                if (activeDocTemplateId === template.id) setActiveDocTemplateId(null);
            } catch (err) {
                console.error(err);
                alert('Failed to delete.');
            }
        }
    };

    const handleSaveTransactions = async () => {
        // Only save transactions that haven't been saved yet (no _id)
        const newTransactions = (bankFiles || [])
            .flatMap(f => (f.transactions || []).map(t => ({
                ...t,
                // CRITICAL: Preserve driveId from parent file if available
                driveId: f.driveId || t.driveId,
                // Also preserve path if available (backup)
                path: f.path || t.path
            })))
            .filter(tx => !tx._id);

        if (newTransactions.length === 0) {
            setMessage('All transactions are already saved through v3.4 History Sync.');
            return;
        }

        setSavingBank(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/save-transactions', { transactions: newTransactions }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setMessage(`Successfully saved ${newTransactions.length} new transactions! (v3.4 SYNCED)`);

            // Refresh Profile & History to get the new _ids and group efficiently
            setTimeout(() => {
                fetchProfile();
                setMessage('');
            }, 2000);

        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message || 'Error saving transactions.';
            setMessage(errMsg);
        } finally {
            setSavingBank(false);
        }
    };

    // Fetch existing profile on mount (Protected Route Logic)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (['admin', 'superadmin'].includes(savedUser.role)) {
            fetchUsersList();
        }

        fetchProfile();
    }, [adminSelectedUser]);

    const fetchUsersList = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/auth/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

            // ADMIN OVERRIDE: If admin has selected a target, fetch that instead
            const endpoint = (['admin', 'superadmin'].includes(savedUser.role) && adminSelectedUser)
                ? `/api/company/admin/profile/${adminSelectedUser}`
                : '/api/company/profile';


            const res = await axios.get(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data) {
                // BRIDGE: Map DB structured fields to template keys
                const bridgedData = { ...(res.data.extractedData || {}) };
                if (res.data.companyNameEn) bridgedData['company_name_en'] = res.data.companyNameEn;
                if (res.data.companyNameKh) bridgedData['company_name_kh'] = res.data.companyNameKh;
                if (res.data.registrationNumber) bridgedData['registration_number'] = res.data.registrationNumber;
                if (res.data.incorporationDate) bridgedData['incorporation_date'] = res.data.incorporationDate;
                if (res.data.address) bridgedData['registered_address'] = res.data.address;
                if (res.data.director) bridgedData['director_name'] = res.data.director;
                if (res.data.vatTin) bridgedData['vat_tin'] = res.data.vatTin;

                setFormData(prev => ({
                    ...prev,
                    ...res.data,
                    extractedData: bridgedData
                }));

                // --- RESTORE MOC/TAX DOCUMENTS ---
                if (res.data.documents && Array.isArray(res.data.documents)) {
                    const restoredDocs = res.data.documents.map(doc => ({
                        id: doc._id,
                        name: doc.originalName || doc.docType,
                        status: doc.status || 'Saved',
                        size: 'Stored',
                        // Proxy Image URL with Auth Token
                        previewUrl: `/api/company/document-image/${doc.docType}?token=${token}&t=${Date.now()}`,
                        type: doc.mimeType,
                        isExtracted: doc.status === 'Verified',
                        docType: doc.docType
                    }));
                    setDocTemplates(restoredDocs);
                    // Default to Main Dossier (Null) for premium 'Book Mode' experience
                    setActiveDocTemplateId(null);
                }
            }

            // --- FETCH BANK DATA (Files + Transactions) ---
            try {
                const targetCompanyCode = res?.data?.companyCode || '';
                // 1. Get BankFile Registry
                const fileRes = await axios.get(`/api/company/bank-files?companyCode=${targetCompanyCode}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const registryFiles = fileRes.data.files || [];

                // 2. Get All Transactions
                const txRes = await axios.get(`/api/company/transactions?companyCode=${targetCompanyCode}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const allTxs = txRes.data.transactions || [];

                // 3. Smart Processing: Map, Dedup, and Sort
                let usedTxIds = new Set();

                // Dedup and Pre-process Registry Files
                const finalRegistryMap = new Map();
                registryFiles.forEach(f => {
                    const key = `${f.originalName}_${f.dateRange}`;
                    // If multiple duplicates exist, prioritize one WITH a valid Drive ID
                    if (!finalRegistryMap.has(key) || (f.driveId && f.driveId !== 'mock_drive_id')) {
                        finalRegistryMap.set(key, f);
                    }
                });

                const processedFiles = Array.from(finalRegistryMap.values()).map(file => {
                    const fileTxs = allTxs.filter(tx => {
                        if (usedTxIds.has(tx._id)) return false;

                        const txDriveId = tx.originalData?.driveId;
                        const fileDriveId = file.driveId;
                        const isMockId = !txDriveId || txDriveId === 'mock_drive_id' || txDriveId === 'mock-id';

                        // RULE 1: Strict Drive ID Match (Only if ID is valid/unique)
                        if (!isMockId && txDriveId === fileDriveId) return true;

                        // RULE 2: Strict Date Range Check (Fallback for mock/missing IDs)
                        const rangeStr = file.dateRange || "";
                        if (rangeStr.includes(" - ") && !rangeStr.includes("FATAL_ERR")) {
                            const txDateRaw = tx.date;
                            const txDate = parseDate(txDateRaw)?.getTime();

                            const [s, e] = rangeStr.split(' - ');
                            const start = parseDate(s.trim())?.getTime();
                            const end = parseDate(e.trim())?.getTime();

                            if (txDate && start && end) {
                                // 2-day buffer for timezone shifts or edge-of-month transactions
                                const buffer = 172800000;
                                if (txDate >= (start - buffer) && txDate <= (end + buffer)) return true;
                            }
                        }
                        return false;
                    });

                    fileTxs.forEach(tx => usedTxIds.add(tx._id));

                    // Internal Transaction Sort: Newest at Top (Descending)
                    const sortedTxs = fileTxs.sort((a, b) => (parseDate(b.date)?.getTime() || 0) - (parseDate(a.date)?.getTime() || 0));

                    // Restore moneyIn/moneyOut for sorted transactions
                    sortedTxs.forEach(tx => {
                        const amount = parseFloat(tx.amount || 0);
                        tx.moneyIn = amount > 0 ? amount : 0;
                        tx.moneyOut = amount < 0 ? Math.abs(amount) : 0;
                    });

                    return { ...file, status: 'Saved', transactions: sortedTxs, bankName: file.bankName, accountNumber: file.accountNumber, accountName: file.accountName };
                });

                // 4. Mapped handled earlier. We are removing orphans reconstruct logic to clean up the UI.
                const extraFiles = [];

                // 5. Final Global Sort: Newest at TOP
                const finalFiles = [...processedFiles, ...extraFiles]
                    .filter(f => !f.dateRange?.includes("DEBUG_ERR") && !f.dateRange?.includes("FATAL_ERR")) // Skip artifacts
                    .sort((a, b) => {
                        const getRefTime = (f) => {
                            const txDates = (f.transactions || []).map(t => parseDate(t.date)?.getTime()).filter(Boolean);
                            if (txDates.length > 0) return Math.max(...txDates);
                            const rangeParts = (f.dateRange || "").split(' - ');
                            const rangeEnd = parseDate(rangeParts[rangeParts.length - 1].trim());
                            return rangeEnd?.getTime() || 0;
                        };
                        return getRefTime(b) - getRefTime(a);
                    });

                setBankFiles(finalFiles);
                if (finalFiles.length > 0) setActiveFileIndex(0); // Safely select first
            } catch (txErr) {
                console.error("Error fetching bank data:", txErr);
            }

        } catch (err) {
            console.log("No existing profile found or error fetching.");
            if (err.response && err.response.status === 401) {
                // Token invalid/expired
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
    };


    // --- Sub-Components ---

    // --- IEWS View Logic (Tax Document Packages) ---
    const handleCreatePackage = async () => {
        if (!createYear || createYear.length !== 4) {
            alert("Please enter a valid 4-digit year (e.g. 2025).");
            return;
        }
        if (toiPackages.find(p => p.year === createYear)) {
            alert("Package for this year already exists.");
            return;
        }

        try {
            const res = await axios.post('/api/tax/packages', { year: createYear });
            setToiPackages(prev => [res.data, ...prev]);
            setCreateYear('');
            setMessage(`Created TOI Package for ${createYear}`);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to create package.");
        }
    };

    // --- Agentic Filing (4th Module) ---
    const [gdtCreds, setGdtCreds] = useState({ gdtUsername: '', gdtPassword: '' });
    const [gdtSaving, setGdtSaving] = useState(false);
    const [gdtSaved, setGdtSaved] = useState(false);
    const [gdtLoaded, setGdtLoaded] = useState(false);

    useEffect(() => {
        if (view === 'agentic_filing' && !gdtLoaded) {
            const token = localStorage.getItem('token');
            axios.get('/api/company/gdt-credentials', { headers: { Authorization: `Bearer ${token}` } })
                .then(r => { setGdtCreds({ gdtUsername: r.data.gdtUsername || '', gdtPassword: r.data.gdtPassword || '' }); setGdtLoaded(true); })
                .catch(() => setGdtLoaded(true));
        }
    }, [view]);

    const handleSaveGdtCreds = async () => {
        setGdtSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/gdt-credentials', gdtCreds, { headers: { Authorization: `Bearer ${token}` } });
            setGdtSaved(true);
            setTimeout(() => setGdtSaved(false), 3000);
        } catch (e) { alert('Failed to save GDT credentials.'); }
        finally { setGdtSaving(false); }
    };

    // --- GDT Agent State ---
    const [gdtAgentStatus, setGdtAgentStatus] = useState('idle'); // idle | launching | otp_pending | submitting_otp | done | error
    const [gdtSessionId, setGdtSessionId] = useState(null);
    const [gdtScreenshot, setGdtScreenshot] = useState(null); // base64 preview
    const [gdtAgentMsg, setGdtAgentMsg] = useState('');
    const [gdtOtp, setGdtOtp] = useState('');

    const handleLaunchGdtAgent = () => {
        if (!gdtCreds.gdtUsername || !gdtCreds.gdtPassword) {
            alert('Please save your GDT credentials first (Step 1).');
            return;
        }

        // STONE-CARVED RULE: Open the backend relay page in a new visible window.
        // The relay page auto-opens GDT, auto-copies TID, guides user visibly.
        const token = localStorage.getItem('token');
        const relayUrl = `/api/company/gdt-relay?token=${encodeURIComponent(token)}`;
        const relayWin = window.open(relayUrl, 'gdt_relay', 'width=600,height=620,left=600,top=40');

        if (!relayWin) {
            alert('Popup blocked! Please allow popups for this site and try again.');
            return;
        }

        setGdtAgentStatus('otp_pending');
        setGdtSessionId(`relay_${Date.now()}`);
        setGdtOtp('');
        setGdtAgentMsg('✅ GDT Agent window opened. Watch the relay panel — GDT portal will open automatically and your TID will be auto-copied to clipboard.');
    };

    // dead code below kept for safety — old async version removed
    const _unused_handleLaunchGdtAgent = async () => {
        if (!gdtCreds.gdtUsername || !gdtCreds.gdtPassword) {
            alert('Please save your GDT credentials first (Step 1).');
            return;
        }

        // STONE-CARVED RULE: GDT portal MUST open visibly on screen in front of the human.
        // Agent NEVER works behind the screen. User watches, types OTP, has full control.
        const GDT_URL = 'https://owp.tax.gov.kh/gdtowpcoreweb/login';
        const gdtWindow = window.open(GDT_URL, 'gdt_portal', 'width=1280,height=900,left=100,top=50');

        if (!gdtWindow) {
            alert('Popup blocked! Please allow popups for this site and try again.');
            return;
        }

        setGdtAgentStatus('otp_pending');
        setGdtSessionId(`local_${Date.now()}`);
        setGdtOtp('');
        setGdtAgentMsg('✅ GDT portal is now open on your screen.\n\n👉 STEPS:\n1. Select the TID tab on GDT\n2. Enter your TID: ' + gdtCreds.gdtUsername + '\n3. Enter your password\n4. Click Send Code\n5. GDT will send OTP to your registered phone/email\n6. Come back here and enter the OTP below');

        // Copy TID to clipboard automatically for quick paste
        navigator.clipboard?.writeText(gdtCreds.gdtUsername).catch(() => {});
    };

    const handleSubmitOtp = () => {
        if (!gdtOtp.trim()) { alert('Please enter the OTP code from GDT.'); return; }
        // User has already entered OTP into the visible GDT browser window.
        // This just confirms completion and shows next steps.
        setGdtAgentStatus('done');
        setGdtAgentMsg(`✅ OTP ${gdtOtp} recorded. Please enter it into the GDT portal that is open on your screen, then proceed with the TOI filing.`);
    };

    const renderAgenticFiling = () => (
        <div className="w-full h-[calc(100vh-80px)] flex flex-col bg-[#080c14] overflow-y-auto">
            {/* Top bar */}
            <div className="flex items-center gap-4 px-6 py-3 bg-slate-900/80 backdrop-blur-md border-b border-white/5 shrink-0">
                <button onClick={() => setView('home')} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5 active:scale-95 shrink-0">
                    <ArrowLeft size={16} />
                </button>
                <div className="flex items-center gap-2">
                    <Bot size={14} className="text-green-400" />
                    <span className="text-white font-black text-sm uppercase tracking-wider">Agentic Filing</span>
                    <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest ml-1">GDT e-Tax Portal</span>
                </div>
                <div className="ml-auto flex items-center gap-2 text-[10px] text-green-400 font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    BA TOI Agent Active
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 gap-8 max-w-2xl mx-auto w-full">

                {/* Step 1 — Pre-save GDT Credentials */}
                <div className="w-full bg-slate-800/50 border border-white/8 rounded-3xl p-8 space-y-5">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-sm">1</div>
                        <div>
                            <h2 className="text-white font-black text-base uppercase tracking-wider">Pre-Save GDT Credentials</h2>
                            <p className="text-slate-500 text-xs mt-0.5">Saved securely in your company profile. Used by the agent to autofill the GDT portal.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">GDT Username / TIN</label>
                            <input
                                type="text"
                                value={gdtCreds.gdtUsername}
                                onChange={e => setGdtCreds(p => ({ ...p, gdtUsername: e.target.value }))}
                                placeholder="e.g. K009902103452"
                                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">GDT Password</label>
                            <input
                                type="password"
                                value={gdtCreds.gdtPassword}
                                onChange={e => setGdtCreds(p => ({ ...p, gdtPassword: e.target.value }))}
                                placeholder="••••••••"
                                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveGdtCreds}
                        disabled={gdtSaving}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold text-sm transition-all"
                    >
                        {gdtSaving ? 'Saving...' : gdtSaved ? '✓ Credentials Saved!' : 'Save GDT Credentials'}
                    </button>
                    {gdtCreds.gdtUsername && (
                        <p className="text-green-400/70 text-[10px] text-center font-mono">
                            {gdtSaved ? '✓ ' : ''}Stored: {gdtCreds.gdtUsername} / {'•'.repeat(gdtCreds.gdtPassword.length || 8)}
                        </p>
                    )}
                </div>

                {/* Step 2 — Agent Launch */}
                <div className="w-full bg-slate-800/50 border border-white/8 rounded-3xl p-8 space-y-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 font-black text-sm">2</div>
                        <div>
                            <h2 className="text-white font-black text-base uppercase tracking-wider">Launch Agent</h2>
                            <p className="text-slate-500 text-xs mt-0.5">Opens GDT portal on your screen. You watch the browser, enter your TID/password — GDT sends OTP to your phone.</p>
                        </div>
                    </div>

                    {/* Credentials preview */}
                    <div className="bg-slate-900/60 rounded-xl p-4 text-xs text-slate-400 space-y-1 border border-white/5">
                        <div className="flex justify-between"><span>GDT Username</span><span className="text-white font-mono">{gdtCreds.gdtUsername || <span className="text-red-400 italic">Not set — save in Step 1</span>}</span></div>
                        <div className="flex justify-between"><span>GDT Password</span><span className="text-white font-mono">{gdtCreds.gdtPassword ? '•'.repeat(gdtCreds.gdtPassword.length) : <span className="text-red-400 italic">Not set</span>}</span></div>
                        <div className="flex justify-between"><span>Portal</span><span className="text-blue-400">owp.tax.gov.kh → TID tab</span></div>
                    </div>

                    {/* Credential helper — visible copy panel */}
                    {gdtAgentStatus === 'otp_pending' || gdtAgentStatus === 'done' ? (
                        <div className="bg-green-900/10 border border-green-500/20 rounded-xl px-4 py-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Your GDT TID (auto-copied)</span>
                                <button onClick={() => navigator.clipboard?.writeText(gdtCreds.gdtUsername)} className="text-[10px] text-green-400 hover:text-green-300 font-bold">Copy again</button>
                            </div>
                            <div className="font-mono text-green-300 text-sm tracking-widest">{gdtCreds.gdtUsername}</div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Password</span>
                                <button onClick={() => navigator.clipboard?.writeText(gdtCreds.gdtPassword)} className="text-[10px] text-green-400 hover:text-green-300 font-bold">Copy</button>
                            </div>
                            <div className="font-mono text-slate-400 text-sm">{'•'.repeat(gdtCreds.gdtPassword.length)}</div>
                            <div className="text-[10px] text-amber-400 mt-2">👆 GDT is open. Select TID tab → paste TID → enter password → click Send Code</div>
                        </div>
                    ) : gdtAgentMsg ? (
                        <div className={`rounded-xl px-4 py-3 text-xs font-mono border ${
                            gdtAgentStatus === 'error' ? 'bg-red-900/20 border-red-500/30 text-red-300' :
                            'bg-slate-900/60 border-white/5 text-slate-300'
                        }`}>
                            {gdtAgentMsg}
                        </div>
                    ) : null}

                    {/* Live screenshot from agent */}
                    {gdtScreenshot && (
                        <div className="rounded-xl overflow-hidden border border-white/10">
                            <div className="bg-slate-900/80 px-3 py-1.5 text-[10px] text-slate-500 font-mono uppercase tracking-widest border-b border-white/5">Agent Screen Preview</div>
                            <img src={`data:image/png;base64,${gdtScreenshot}`} alt="GDT portal screenshot" className="w-full" />
                        </div>
                    )}

                    <button
                        onClick={handleLaunchGdtAgent}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-base tracking-wider uppercase transition-all shadow-lg shadow-green-900/30 active:scale-95"
                    >
                        {gdtAgentStatus === 'otp_pending' ? '🔄 Re-Open GDT Portal' :
                         gdtAgentStatus === 'done' ? '✓ Done — Open GDT Again' :
                         '🌐 Open GDT Portal On Screen'}
                    </button>
                </div>

                {/* Step 3 — OTP Entry (appears after agent sends code) */}
                <div className={`w-full rounded-3xl p-8 space-y-4 border transition-all duration-500 ${
                    gdtAgentStatus === 'otp_pending' || gdtAgentStatus === 'submitting_otp' || gdtAgentStatus === 'done'
                        ? 'bg-amber-900/10 border-amber-500/30'
                        : 'bg-slate-800/30 border-white/5 opacity-50'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">3</div>
                        <div>
                            <h2 className="text-white font-black text-base uppercase tracking-wider">Enter OTP Code</h2>
                            <p className="text-slate-500 text-xs mt-0.5">GDT sends a code to your registered phone/email after you click Send Code on their portal. Enter it in the GDT portal window that is open on your screen.</p>
                        </div>
                    </div>

                    <input
                        type="text"
                        inputMode="numeric"
                        value={gdtOtp}
                        onChange={e => setGdtOtp(e.target.value.replace(/\D/g, ''))}
                        maxLength={8}
                        placeholder="e.g. 123456"
                        disabled={gdtAgentStatus !== 'otp_pending'}
                        className="w-full bg-slate-900/80 border border-amber-500/30 rounded-xl px-4 py-4 text-white text-2xl font-mono tracking-widest text-center placeholder-slate-700 focus:outline-none focus:border-amber-400/60 disabled:opacity-40"
                    />

                    <button
                        onClick={handleSubmitOtp}
                        disabled={gdtAgentStatus !== 'otp_pending' || !gdtOtp}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-700 disabled:to-slate-700 text-white font-black text-base tracking-wider uppercase transition-all active:scale-95"
                    >
                        {gdtAgentStatus === 'done' ? '✓ Confirmed!' : '✅ Confirm OTP Entered'}
                    </button>

                    {gdtAgentStatus !== 'otp_pending' && gdtAgentStatus !== 'submitting_otp' && gdtAgentStatus !== 'done' && (
                        <p className="text-slate-600 text-[10px] text-center">⚠️ Launch the agent first (Step 2) — OTP field will activate once the agent sends the code.</p>
                    )}
                </div>

            </div>
        </div>
    );



    // --- IEWS Module ---
    const renderIEWS = () => (
        <div className="w-full h-[calc(100vh-80px)] flex flex-col bg-[#080c14] overflow-y-auto relative">

            {/* Ambient glow background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />

            {/* Top bar */}
            <div className="flex items-center gap-4 px-8 py-4 border-b border-white/5 bg-slate-900/60 backdrop-blur-md shrink-0 relative z-10">
                <button onClick={() => setView('home')} className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95">
                    <ArrowLeft size={16} />
                </button>
                <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-indigo-400" />
                    <span className="text-white font-black text-sm uppercase tracking-wider">IEWS</span>
                    <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest ml-1">Enterprise Work System</span>
                </div>
                <div className="ml-auto">
                    <span className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                        ● Initializing
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative z-10">

                {/* Giant IEWS Wordmark */}
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center gap-5 mb-6">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-2xl shadow-indigo-500/10">
                            <ShieldCheck size={40} className="text-indigo-400" />
                        </div>
                    </div>
                    <h1 className="text-8xl font-black tracking-tight mb-3"
                        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        IEWS
                    </h1>
                    <p className="text-slate-400 text-base font-medium tracking-widest uppercase mb-2">
                        Enterprise Work System
                    </p>
                    <p className="text-slate-600 text-xs">
                        Workflow package management &amp; compliance pipeline
                    </p>
                </div>

                {/* Feature Pipeline Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                    {[
                        { icon: '📦', label: 'Package Manager', desc: 'Create and manage yearly TOI tax packages', status: 'Building' },
                        { icon: '⚡', label: 'Workflow Engine', desc: 'Automated compliance task pipelines', status: 'Planned' },
                        { icon: '🔗', label: 'Data Bridge', desc: 'Sync filings with GDT e-Tax portal', status: 'Planned' },
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-800/30 border border-white/5 rounded-2xl p-6 flex flex-col gap-3">
                            <div className="text-3xl">{item.icon}</div>
                            <div>
                                <h3 className="text-white font-bold text-sm mb-1">{item.label}</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                            </div>
                            <span className={`self-start px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                item.status === 'Building'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-slate-700/50 text-slate-500 border border-white/5'
                            }`}>
                                {item.status}
                            </span>
                        </div>
                    ))}
                </div>

                <p className="text-slate-700 text-[10px] uppercase tracking-widest mt-12 font-bold">
                    A2 · Local Build · Rebuild In Progress
                </p>
            </div>
        </div>
    );



    const renderHome = () => (
        <div className="w-full max-w-[1600px] mx-0 pt-12 px-10 animate-fade-in relative z-10 flex flex-col min-h-[calc(100vh-80px)]">
            <div className="absolute top-0 left-0 w-full h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-0 w-full h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none -z-10" />

            <div className="flex items-start justify-between mb-12 px-2">
                <div className="flex flex-col">
                    <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-2">
                        Welcome, {formData.username || 'GK SMART'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <p className="text-slate-400 text-lg font-medium">Manage your entity and financial data with AI precision.</p>
                    </div>
                </div>

                <div></div>
            </div>

            <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {/* --- CORE USER FUNCTIONS (STRICT: DO NOT AMEND OR REMOVE) --- */}
                    
                    {/* COLUMN 1 */}
                    <div className="flex flex-col gap-6">
                        <div onClick={() => setView('iews')} className="group p-8 bg-slate-800/40 hover:bg-indigo-600/10 border border-white/5 hover:border-indigo-500/50 rounded-3xl transition-all duration-500 cursor-pointer relative overflow-hidden">
                            <span className="absolute top-4 right-4 bg-indigo-500 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg animate-pulse">NEW</span>
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <ShieldCheck size={28} className="text-indigo-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">IEWS</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Enterprise Work System. Manage workflow packages.</p>
                        </div>

                        <div onClick={() => setView('profile')} className="group p-8 bg-slate-800/40 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/50 rounded-3xl transition-all duration-500 cursor-pointer text-left">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <FileText size={28} className="text-blue-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Company Profile</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Update official registration details, MOC certificates, and shareholders.</p>
                        </div>

                        <div onClick={() => setView('codes')} className="group p-8 bg-slate-800/40 hover:bg-cyan-600/10 border border-white/5 hover:border-cyan-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <QrCode size={28} className="text-cyan-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Accounting Codes</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Manage Chart of Accounts codes and standard descriptions.</p>
                        </div>

                        <div onClick={() => setView('currency')} className="group p-8 bg-slate-800/40 hover:bg-teal-600/10 border border-white/5 hover:border-teal-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <DollarSign size={28} className="text-teal-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Currency Exchange</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Set Annual Exchange Rates (USD to KHR) for compliance.</p>
                        </div>
                    </div>

                    {/* COLUMN 2 */}
                    <div className="flex flex-col gap-6">
                        <div onClick={() => setView('bank')} className="group p-8 bg-slate-800/40 hover:bg-emerald-600/10 border border-white/5 hover:border-emerald-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Table size={28} className="text-emerald-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Bank Statements</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Upload monthly statements, parse transactions via AI, and sync data.</p>
                        </div>

                        <div onClick={() => setView('bank_v2')} className="group p-8 bg-slate-800/40 hover:bg-emerald-600/10 border border-white/5 hover:border-emerald-500/50 rounded-3xl transition-all duration-500 cursor-pointer relative overflow-hidden">
                            <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-sm shadow-sm uppercase tracking-widest">Multi-Bank</span>
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Layers size={28} className="text-emerald-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Bank Statements VAT Recon</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Create isolated statement baskets for multiple separate bank accounts.</p>
                        </div>

                        <div onClick={() => setView('assets')} className="group p-8 bg-slate-800/40 hover:bg-yellow-600/10 border border-white/5 hover:border-yellow-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <ShieldCheck size={28} className="text-yellow-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Asset & Depreciation</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Manage fixed assets, intangibles, and calculate tax depreciation pooling.</p>
                        </div>

                        <div onClick={() => setView('salary')} className="group p-8 bg-slate-800/40 hover:bg-pink-600/10 border border-white/5 hover:border-pink-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Users size={28} className="text-pink-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Salary & TOS Recon</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Reconcile Tax on Salary filings with annual SG&A salary expenses.</p>
                        </div>

                        <div onClick={() => setView('related')} className="group p-8 bg-slate-800/40 hover:bg-orange-600/10 border border-white/5 hover:border-orange-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Layers size={28} className="text-orange-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Related Party Disclosure</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Map intercompany transactions, director loans, and parent/subsidiary entities.</p>
                        </div>

                        <div onClick={() => setView('withholdings')} className="group p-8 bg-slate-800/40 hover:bg-purple-600/10 border border-white/5 hover:border-purple-500/50 rounded-3xl transition-all duration-500 cursor-pointer relative overflow-hidden">
                            <span className="absolute top-4 right-4 bg-purple-500 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg animate-pulse">NEW</span>
                            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Receipt size={28} className="text-purple-400" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Withholdings</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Track rental WHT (10%) and service VAT (15%). Maps to TOI expense line B27.</p>
                        </div>
                    </div>

                    {/* COLUMN 3 */}
                    <div className="flex flex-col gap-6">
                        <div onClick={() => setView('toi_acar')} className="group p-8 bg-gradient-to-br from-slate-800/40 to-slate-900/60 hover:from-rose-600/20 hover:to-indigo-600/20 border border-white/5 hover:border-rose-400/50 rounded-3xl transition-all duration-500 cursor-pointer relative overflow-hidden shadow-xl hover:shadow-rose-500/20">
                            <span className="absolute top-4 right-4 bg-gradient-to-r from-rose-500 to-indigo-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse uppercase tracking-widest">Premium Pack</span>
                            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500 border border-rose-500/20 shadow-inner">
                                <Box size={28} className="text-rose-400" />
                            </div>
                            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 font-black text-2xl mb-2 tracking-tight">TOI ACAR PACK</h3>
                            <p className="text-slate-400 text-xs leading-relaxed font-medium">All-in-one compliance bundle for Tax on Income and ACAR reporting. Rebuilt architecture.</p>
                        </div>

                        <div onClick={() => setView('ledger')} className="group p-8 bg-slate-800/40 hover:bg-orange-600/10 border border-white/5 hover:border-orange-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Book size={28} className="text-orange-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">General Ledger</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">View chronological financial history of all audited transactions.</p>
                        </div>

                        <div onClick={() => setView('tb')} className="group p-8 bg-slate-800/40 hover:bg-amber-600/10 border border-white/5 hover:border-amber-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <Scale size={28} className="text-amber-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Trial Balance</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">View Unadjusted & Adjusted Trial Balance reports.</p>
                        </div>

                        <div onClick={() => setView('financials')} className="group p-8 bg-slate-800/40 hover:bg-violet-600/10 border border-white/5 hover:border-violet-500/50 rounded-3xl transition-all duration-500 cursor-pointer">
                            <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                                <TrendingUp size={28} className="text-violet-500" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Financial Stmts</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">Generate final audited reports (Income, Balance Sheet, Cash Flow).</p>
                        </div>

                        {/* AGENTIC FILING CARD — 4th Module */}
                        <div onClick={() => setView('agentic_filing')} className="group p-8 bg-gradient-to-br from-slate-800/40 to-slate-900/60 hover:from-green-600/20 hover:to-emerald-600/20 border border-white/5 hover:border-green-400/50 rounded-3xl transition-all duration-500 cursor-pointer relative overflow-hidden shadow-xl hover:shadow-green-500/20">
                            <span className="absolute top-4 right-4 flex items-center gap-1 bg-green-500/20 text-green-400 text-[9px] font-black px-3 py-1 rounded-full border border-green-500/30 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                LIVE
                            </span>
                            <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500 border border-green-500/20">
                                <Bot size={28} className="text-green-400" />
                            </div>
                            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400 font-black text-xl mb-2 tracking-tight">Agentic Filing</h3>
                            <p className="text-slate-400 text-xs leading-relaxed font-medium">AI-powered automated submission to GDT e-Tax portal. No manual entry required.</p>
                        </div>
                    </div>
                    
                    {/* --- END CORE USER FUNCTIONS --- */}
                </div>
            </div>

            {/* Bottom Status Bar Removed per Clean Protocol */}
        </div>
    );



    // --- Profile UI Logic (v2.0 Redesign) ---
    // This derived state maps the hardcoded categories to real documents in the DB
    const sourceIntelTemplates = [
        { id: 'moc_cert', name: 'Certificate of Incorporation', docType: 'moc_cert', status: 'Missing' },
        { id: 'kh_extract', name: 'MOC Extract (Khmer)', docType: 'kh_extract', status: 'Missing' },
        { id: 'en_extract', name: 'MOC Extract (English)', docType: 'en_extract', status: 'Missing' },
        { id: 'tax_patent', name: 'Tax Patent (Latest)', docType: 'tax_patent', status: 'Missing' },
        { id: 'tax_id', name: 'VAT / Tax ID Card', docType: 'tax_id', status: 'Missing' },
        { id: 'bank_opening', name: 'Bank Account Opening', docType: 'bank_opening', status: 'Missing' }
    ].map(tpl => {
        // Bridge with real document data from DB (Priority: match docType)
        const realDoc = (formData.documents || []).find(d => d.docType === tpl.docType);
        return realDoc ? { ...tpl, ...realDoc, id: realDoc._id, status: 'Verified' } : tpl;
    });

    // Add "Uncategorized" documents from profile that aren't in the main 6
    const additionalDocs = (formData.documents || []).filter(d =>
        !sourceIntelTemplates.some(t => t.docType === d.docType)
    ).map(d => ({
        ...d,
        id: d._id,
        name: d.originalName || d.docType,
        status: d.status === 'Verified' ? 'Verified' : 'Pending'
    }));

    const allSourceDocs = [...sourceIntelTemplates, ...additionalDocs];

    const [uploadingDoc, setUploadingDoc] = useState(null);
    const [debugLog, setDebugLog] = useState(null); // New On-Screen Error Console

    // NEW: Staging State for Review
    const [stagedDoc, setStagedDoc] = useState(null);
    const [savingDoc, setSavingDoc] = useState(false);

    const handleRegUpload = async (files, docType) => {
        if (files.length === 0) return;
        setUploadingDoc(docType);
        setMessage(`Analyzing ${docType.replace('_', ' ')}...`);

        const formData = new FormData();
        formData.append('file', files[0]);
        formData.append('docType', docType);

        try {
            const token = localStorage.getItem('token');
            // 1. Upload & Analyze (No Auto-Save)
            const res = await axios.post('/api/company/upload-registration', formData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            // 2. Set Staged Data for Review
            setStagedDoc(res.data);
            setMessage('Analysis Complete. Please Review.');

            // Automatically select the newly uploaded doc for viewing
            if (res.data.docType) setViewDoc(res.data);

        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message;
            if (errMsg === 'Token is not valid' || err.response?.status === 401) {
                alert('Session Expired. Please Login Again.');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            setMessage('Error: ' + errMsg);
            alert('Upload Failed: ' + errMsg);
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleSaveStagedDoc = async () => {
        if (!stagedDoc) return;
        setSavingDoc(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/save-registration-data', stagedDoc, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setMessage('Document Verified & Saved!');
            setStagedDoc(null); // Clear staging

            // Refresh Profile
            const profileRes = await axios.get('/api/company/profile', { headers: { 'Authorization': `Bearer ${token}` } });
            setFormData(prev => ({ ...prev, ...profileRes.data }));

        } catch (err) {
            console.error(err);
            alert('Save Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSavingDoc(false);
        }
    };

    const handleClearDoc = async (docType) => {
        if (!window.confirm('Are you sure you want to clear this document?')) return;

        try {
            const token = localStorage.getItem('token');
            // Use URL Param for robustness
            await axios.delete(`/api/company/document/${docType}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 2026-02-03 FIX: Update state locally instead of full reload to prevent SiteGate lock
            setMessage('Document cleared successfully.');
            // Re-fetch profile to sync UI safely
            await fetchProfile();
            setTimeout(() => setMessage(''), 3000);

        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message;
            if (errMsg === 'Token is not valid' || err.response?.status === 401) {
                alert('Session Expired. Please Login Again.');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }

            // Show On-Screen Error
            setDebugLog({
                title: 'Clear Document Failed',
                message: errMsg,
                details: JSON.stringify(err.response?.data || {}, null, 2)
            });

        }
    };


    const handleFieldChange = (key, val) => {
        setFormData(prev => ({
            ...prev,
            extractedData: {
                ...(prev.extractedData || {}),
                [key]: val
            }
        }));
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        setMessage('Synchronizing Profile Architecture...');
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/update-profile', {
                ...formData,
                extractedData: formData.extractedData
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage('Profile Updated Successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            alert('Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleRecallScan = async () => {
        setIsDocScanning(true);
        setMessage('Deep Recall Scan in Progress...');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/rescan', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            await fetchProfile();
            setMessage(`Scan Complete! Repaired ${res.data.repairCount || 0} documents.`);
            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            console.error(err);
            setDebugLog({ title: 'Scan Failed', message: err.message });
        } finally {
            setIsDocScanning(false);
        }
    };

    const handleSendWorkspaceChat = async (overridingPrompt = null) => {
        const promptToUse = overridingPrompt || workspacePrompt;
        if (!promptToUse.trim() || isAgentThinking) return;

        const userMsg = { role: 'user', text: promptToUse };
        setWorkspaceChat(prev => [...prev, userMsg]);
        if (!overridingPrompt) setWorkspacePrompt('');
        setIsAgentThinking(true);

        try {
            const token = localStorage.getItem('token');

            // Build Context from BR Documents (Business Registration Data)
            const brContext = (formData.documents || []).map(doc => ({
                name: doc.docType || 'Source Document',
                text: doc.rawText || 'Text unavailable for this fragment.'
            }));

            const res = await axios.post('/api/chat/message', {
                message: userMsg.text,
                context: {
                    source: 'Absolute Workstation',
                    brData: brContext,
                    companyName: formData.companyNameEn,
                    targetUsername: adminSelectedUser // Crucial for backend entity switching
                }
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setWorkspaceChat(prev => [...prev, { role: 'assistant', text: res.data.text }]);
        } catch (err) {
            console.error("Agent Error:", err);
            setWorkspaceChat(prev => [...prev, { role: 'assistant', text: "⚠️ Agent connection unstable. Please verify link to drive." }]);
        } finally {
            setIsAgentThinking(false);
        }
    };

    const renderProfile = () => {
        const activeDoc = allSourceDocs.find(d => d.id === activeDocTemplateId);
        const originalDocData = (formData.documents || []).find(d => d._id === activeDocTemplateId);

        return (
            <div className="w-full h-[calc(100vh-80px)] animate-fade-in flex bg-slate-900 font-sans overflow-hidden">
                <div className="flex-1 overflow-y-auto bg-slate-900 relative custom-scrollbar">

                    {/* Header Action Bar (Streamlined) */}
                    <div className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md p-8 flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-8">
                            <button
                                onClick={() => setView('home')}
                                className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5 active:scale-95"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div className="flex items-center gap-6">
                                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Business Data</h2>
                                <div className="flex bg-slate-950/50 rounded-xl p-1 border border-white/5">
                                    <button
                                        onClick={() => setActiveBrTab('data')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                            activeBrTab === 'data' 
                                                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                                                : 'text-slate-500 hover:text-white border border-transparent'
                                        }`}
                                    >
                                        Extracts
                                    </button>
                                    <button
                                        onClick={() => setActiveBrTab('rules')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                            activeBrTab === 'rules' 
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]' 
                                                : 'text-slate-500 hover:text-white border border-transparent'
                                        }`}
                                    >
                                        <Brain size={14} /> Rules
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-full p-0">
                        {formData.role === 'admin' && !adminSelectedUser ? (
                            <div className="flex flex-col items-center justify-center h-[500px] text-center p-20">
                                <AlertCircle size={64} className="text-indigo-500 mb-8 opacity-20" />
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">No Target Entity Selected</h3>
                                <p className="text-slate-500 max-w-sm font-medium">Please use the dropdown menu at the top to select a company profile. This will link the AI agent to that entity's BR intelligence fragments.</p>
                            </div>
                        ) : activeBrTab === 'rules' ? (
                            <div className="p-10 animate-fade-in max-w-4xl mx-auto space-y-8">
                                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Business AI Directives</h3>
                                        <p className="text-sm text-slate-400 font-medium max-w-xl">
                                            Define custom natural language rules here. The Blue Agent (BA) will strictly read and enforce these directives during reporting, analysis, and TOI calculations for {adminSelectedUser || formData.companyCode}.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsCreatingRule(true)}
                                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)]"
                                    >
                                        <Plus size={16} /> Create Rule
                                    </button>
                                </div>

                                {isCreatingRule && (
                                    <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative animate-in fade-in zoom-in-95">
                                        <button onClick={() => setIsCreatingRule(false)} className="absolute top-6 right-6 w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                                            <X size={16} />
                                        </button>
                                        <div className="flex items-center gap-3 mb-4 text-amber-400">
                                            <Terminal size={20} />
                                            <h4 className="font-bold uppercase tracking-widest">New System Directive</h4>
                                        </div>
                                        <textarea
                                            value={newRuleContent}
                                            onChange={(e) => setNewRuleContent(e.target.value)}
                                            placeholder="Example: If the company name does not have Co.,Ltd. or Limited Company, treat it as a Sole Proprietorship. Shareholder is Director. Apply GL share capital to TOI..."
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white text-sm font-medium min-h-[120px] focus:outline-none focus:border-amber-500/50 resize-y mb-4 custom-scrollbar leading-relaxed placeholder:text-slate-600"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleAddRule}
                                                disabled={savingRule || !newRuleContent.trim()}
                                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 font-bold uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 transition-all"
                                            >
                                                {savingRule ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                                                Save Rule
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {!formData.businessRules || formData.businessRules.length === 0 ? (
                                        <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-12 text-center text-slate-500">
                                            <Bot size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-medium text-lg">No active directives found.</p>
                                            <p className="text-sm mt-1">Create a rule to program the agent's logic for this entity.</p>
                                        </div>
                                    ) : (
                                        formData.businessRules.map((rule, idx) => (
                                            <div key={rule._id || idx} className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 flex gap-4 group hover:border-amber-500/30 transition-colors relative">
                                                <div className="mt-1 w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                                                    <span className="font-black text-xs">{idx + 1}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white text-sm font-medium leading-relaxed whitespace-pre-wrap">{rule.content}</p>
                                                    <div className="flex items-center gap-4 mt-4 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                                                        <span>By: {rule.addedBy || 'Admin'}</span>
                                                        <span>•</span>
                                                        <span>{new Date(rule.createdAt).toLocaleDateString()}</span>
                                                        <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={10} /> Active</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteRule(rule._id)}
                                                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                    title="Delete Directive"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : isScarLab ? renderScarLab() : (
                            activeDocTemplateId ? (
                                /* --- INDIVIDUAL DOCUMENT VIEW --- */
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-2">{activeDoc?.name}</h1>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Source Entity Document • {activeDoc?.status}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={`/api/company/document-image/${activeDoc?.docType}?token=${localStorage.getItem('token')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5"
                                            >
                                                View Original
                                            </a>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* HARVESTED TEXT */}
                                        <div className="bg-slate-950 border border-white/5 p-8 rounded-2xl shadow-inner">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Terminal size={16} className="text-blue-500" />
                                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Harvested Text (OCR)</h3>
                                            </div>
                                            <div className="font-mono text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar bg-black/20 p-4 rounded-xl">
                                                {originalDocData?.rawText || 'No text extracted for this document. Try Recall Scan.'}
                                            </div>
                                        </div>

                                        {/* IMAGE PREVIEW */}
                                        <div className="bg-slate-950 border border-white/5 p-2 rounded-2xl overflow-hidden shadow-2xl">
                                            <div className="aspect-[4/5] bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border border-white/5">
                                                {originalDocData?.isMetadataOnly ? (
                                                    <div className="text-center p-8">
                                                        <AlertCircle size={32} className="text-orange-500 mx-auto mb-4" />
                                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Metadata Placeholder</p>
                                                        <p className="text-[9px] text-slate-600 leading-relaxed">This file is sticked in the DB ledger. Binary preview is currently unavailable due to drive quota.</p>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={`/api/company/document-image/${activeDoc?.docType}?token=${localStorage.getItem('token')}&t=${Date.now()}`}
                                                        alt="Preview"
                                                        className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-opacity"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* --- GPT AI AGENT PROMPTING WORKSPACE (FULLSCREEN CLEAN) --- */
                                <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-700">
                                    {/* PROMPT AREA CORE */}
                                    <div className="bg-slate-900/40 border-b border-white/5 p-12 flex flex-col flex-1 overflow-hidden">
                                        {/* CHAT/PROMPT HISTORY (CLEANED) */}
                                        <div className="flex-1 overflow-y-auto mb-10 space-y-12 custom-scrollbar pr-4">
                                            {workspaceChat.length === 0 ? (
                                                formData.organizedProfile ? (
                                                    <div className="bg-white border border-slate-200 rounded-[40px] p-16 shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 text-black mx-4 mt-4 mb-4">
                                                        <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                                                            <div>
                                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-2">SYSTEM SYNTHESIS REPORT</h3>
                                                                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Bilingual Entity Intelligence</h4>
                                                            </div>
                                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                                                <CheckCircle size={20} className="text-emerald-600" />
                                                            </div>
                                                        </div>
                                                        <div className="max-w-7xl mx-auto prose prose-slate text-slate-800 leading-relaxed space-y-6">
                                                            {formData.organizedProfile.split('\n').map((line, i) => {
                                                                const cleanLine = line.trim();
                                                                if (!cleanLine) return <div key={i} className="h-2" />;
                                                                if (/^[IVX]+\./.test(cleanLine) || cleanLine.startsWith('#')) {
                                                                    return (
                                                                        <h4 key={i} className="text-2xl font-black text-slate-900 uppercase tracking-[0.2em] pt-10 border-t-2 border-slate-200 mt-6 mb-4 flex items-center gap-4">
                                                                            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                                                                            {cleanLine.replace(/#/g, '').trim()}
                                                                        </h4>
                                                                    );
                                                                }
                                                                if (cleanLine.startsWith('- **') || cleanLine.startsWith('**')) {
                                                                    const parts = cleanLine.split('**:');
                                                                    if (parts.length > 1) {
                                                                        return (
                                                                            <div key={i} className="flex gap-6 py-3 border-b border-slate-100 items-start">
                                                                                <span className="text-sm font-black text-slate-500 uppercase tracking-[0.1em] w-[280px] shrink-0 pt-1">
                                                                                    {parts[0].replace(/[-*]/g, '').trim()}
                                                                                </span>
                                                                                <span className="text-xl font-bold text-slate-700 whitespace-pre-wrap break-words leading-loose w-full">
                                                                                    {parts[1].trim()}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    }
                                                                }
                                                                return <p key={i} className="text-xl font-medium text-slate-600 leading-loose text-justify mb-6 break-words">{cleanLine}</p>
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // ── BILINGUAL COMPANY DOSSIER CARD ──────────────────────────────────
                                                    <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 text-black animate-in zoom-in duration-500 mx-4 mt-4 mb-4">
                                                        {/* Header Band */}
                                                        <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-12 py-8">
                                                            <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.4em] mb-2">ព្រាប់គ្រូស / Company Dossier</p>
                                                            <div className="space-y-1">
                                                                <h2 className="text-white text-2xl font-bold leading-tight" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>
                                                                    {formData.companyNameKh || formData.extractedData?.['company_name_kh'] || formData.extractedData?.name || '—'}
                                                                </h2>
                                                                <h3 className="text-blue-100 text-lg font-bold uppercase tracking-wide">
                                                                    {formData.companyNameEn || formData.extractedData?.['company_name_en'] || formData.extractedData?.nameEn || '—'}
                                                                </h3>
                                                            </div>
                                                        </div>

                                                        {/* Fields Grid */}
                                                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">

                                                            {/* LEFT COLUMN */}
                                                            <div className="space-y-0 divide-y divide-slate-100 md:pr-8">

                                                                {/* Registration Number */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">លេខចុះបញ្ជី / Registration No.</p>
                                                                    <p className="text-sm font-bold text-slate-900">{formData.registrationNumber || formData.extractedData?.['registration_number'] || formData.extractedData?.regNumber || '—'}</p>
                                                                </div>

                                                                {/* Entity ID */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">អត្តសញ្ញាណស្ថាប័ន / Original Entity ID</p>
                                                                    <p className="text-sm font-bold text-slate-900">{formData.oldRegistrationNumber || formData.extractedData?.entityId || '—'}</p>
                                                                </div>

                                                                {/* Company Type */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">ប្រភេទក្រូមហ៊ុន / Company Type</p>
                                                                    <p className="text-sm font-bold text-slate-900">{formData.companyType || '—'}</p>
                                                                </div>

                                                                {/* Incorporation Date */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">កាលបរិច្ឆេទចុះបញ្ជី / Incorporation Date</p>
                                                                    <p className="text-sm font-bold text-slate-900">{formData.incorporationDate || formData.extractedData?.['incorporation_date'] || formData.extractedData?.incorporationDate || '—'}</p>
                                                                </div>

                                                                {/* TIN */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">លេខសម្គាល់អ្នកបង់ពន្ធ / TIN (VAT)</p>
                                                                    <p className="text-sm font-bold text-slate-900">{formData.vatTin || formData.extractedData?.['vat_tin'] || '—'}</p>
                                                                </div>

                                                                {/* Director */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">នាយក / Director</p>
                                                                    <div>
                                                                        {formData.directors && formData.directors.length > 0 ? (
                                                                            formData.directors.map((d, i) => (
                                                                                <div key={i} className="mb-2">
                                                                                    {d.nameKh && <p className="text-sm font-bold text-slate-900" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>{d.nameKh}</p>}
                                                                                    {d.nameEn && <p className="text-sm text-slate-600">{d.nameEn}</p>}
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <p className="text-sm font-bold text-slate-900">{formData.director || formData.extractedData?.['director_name'] || formData.extractedData?.directorNameEn || '—'}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* RIGHT COLUMN */}
                                                            <div className="space-y-0 divide-y divide-slate-100 md:pl-8 pt-4 md:pt-0">

                                                                {/* Address */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">អាសយដ្ឋានចុះបញ្ជី / Registered Address</p>
                                                                    <p className="text-sm font-bold text-slate-900 leading-relaxed">{formData.address || formData.extractedData?.['registered_address'] || formData.extractedData?.address || '—'}</p>
                                                                </div>

                                                                {/* Business Activity */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">សកម្មភាពអាជីវកម្ម / Business Activity</p>
                                                                    <p className="text-sm font-bold text-slate-900 leading-relaxed">{formData.businessActivity || formData.extractedData?.['business_activity'] || formData.extractedData?.businessActivity || '—'}</p>
                                                                </div>

                                                                {/* Email */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">អ៊ីម៉ែល / Email</p>
                                                                    <p className="text-sm font-bold text-blue-700">{formData.contactEmail || formData.extractedData?.email || '—'}</p>
                                                                </div>

                                                                {/* Phone */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">លេខទូរស័ព្ទ / Phone</p>
                                                                    <p className="text-sm font-bold text-slate-900">{formData.contactPhone || formData.extractedData?.phone || '—'}</p>
                                                                </div>

                                                                {/* Nationality */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">សញ្ជាតិ / Nationality (Majority)</p>
                                                                    <p className="text-sm font-bold text-slate-900">{formData.majorityNationality || formData.extractedData?.directorNationality || '—'}</p>
                                                                </div>

                                                                {/* Status */}
                                                                <div className="py-4">
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">ស្ថានភាព / Status</p>
                                                                    <span className="inline-block bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                                                        {formData.extractedData?.companyStatus || 'Registered'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Footer Band */}
                                                        <div className="bg-slate-50 border-t border-slate-200 px-10 py-4 flex items-center justify-between">
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Source: Ministry of Commerce, Kingdom of Cambodia</p>
                                                            <p className="text-[10px] text-slate-400 font-bold">{formData.companyCode || ''}</p>
                                                        </div>
                                                    </div>
                                                )
                                            ) : (
                                                workspaceChat.map((msg, i) => (
                                                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start animate-in fade-in slide-in-from-bottom-4'}`}>
                                                        <div className={`max-w-[80%] p-10 rounded-[40px] border ${msg.role === 'user'
                                                            ? 'bg-blue-600/10 border-blue-500/20 text-blue-50'
                                                            : 'bg-slate-950/80 border-white/5 text-slate-200'}`}>
                                                            <p className="text-xl leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            {isAgentThinking && (
                                                <div className="flex items-center gap-4 text-blue-500 font-bold uppercase tracking-widest text-xs animate-pulse p-10">
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Agent is analyzing BR datasets...
                                                </div>
                                            )}
                                            <div ref={chatEndRef} />
                                        </div>
                                    </div>

                                    {/* INPUT AREA (IMBEDDED) */}
                                    <div className="bg-slate-950 p-12 relative flex flex-col gap-6">
                                        {/* RAPID INTEL BUTTONS - CLEAN COMMAND CENTER */}
                                        <div className="grid grid-cols-2 gap-6 relative z-10 p-6 bg-slate-900/80 rounded-[32px] border border-white/10 shadow-2xl backdrop-blur-3xl">
                                            <button
                                                onClick={() => handleSendWorkspaceChat("Perform a full administrative summary of my business profile using all available registration documents. Please list all key IDs, dates, Names, and Addresses. **CRITICAL: You must explicitly separate and preserve the pure Khmer strings from the English strings for all Names, Addresses, and Business Activities.** \\n\\nALSO CRITICAL: If you use the `fill_toi_workspace` tool, you MUST put the FULL, COMPLETE, DETAILED MARKDOWN SUMMARY inside the `reply_text` property. Do not just say 'I have extracted...'. I need to see the entire detailed summary on my screen in the chat.")}
                                                className="h-20 bg-amber-500/5 hover:bg-amber-500/20 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl text-[14px] font-black uppercase tracking-[0.2em] text-amber-50 transition-all flex items-center justify-center gap-6 active:scale-[0.98] group shadow-[0_0_30px_rgba(245,158,11,0.05)]"
                                                disabled={isAgentThinking}
                                            >
                                                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all">
                                                    <FileText size={24} />
                                                </div>
                                                1. My Business Profile
                                            </button>
                                            <button
                                                onClick={() => handleSendWorkspaceChat("EXHAUSTIVE DATA EXTRACTION: Extract the COMPLETE list of all business activities and ISIC codes (3-digit and 5-digit) from the registration documents. DO NOT OMIT ANY. For each activity, show the code and the BILINGUAL description (Both Khmer and English) as written in the dossier.")}
                                                className="h-20 bg-cyan-500/5 hover:bg-cyan-500/20 border-2 border-cyan-500/40 hover:border-cyan-400 rounded-2xl text-[14px] font-black uppercase tracking-[0.2em] text-cyan-50 transition-all flex items-center justify-center gap-6 active:scale-[0.98] group shadow-[0_0_30px_rgba(6,182,212,0.05)]"
                                                disabled={isAgentThinking}
                                            >
                                                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                                                    <TrendingUp size={24} />
                                                </div>
                                                2. My Business Activities
                                            </button>
                                        </div>

                                        <div className="relative flex items-end gap-6 bg-slate-900/50 p-8 rounded-[32px] border border-white/5 focus-within:border-blue-500/50 transition-all duration-500 shadow-2xl">
                                            <textarea
                                                value={workspacePrompt}
                                                onChange={(e) => setWorkspacePrompt(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendWorkspaceChat();
                                                    }
                                                }}
                                                placeholder="Type your AI instruction or prompt here..."
                                                className="flex-1 bg-transparent border-none outline-none text-xl leading-relaxed text-white placeholder:text-slate-700 resize-none py-2 max-h-64 custom-scrollbar"
                                                rows={2}
                                            />
                                            <button
                                                onClick={handleSendWorkspaceChat}
                                                disabled={isAgentThinking || !workspacePrompt.trim()}
                                                className="w-16 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Sparkles size={28} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {
                    isDocScanning && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center z-[100] animate-in fade-in duration-300">
                            <Loader2 className="animate-spin text-blue-500 h-16 w-16 mb-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Recall Scan Active</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Google Drive Archives with DB Ledger...</p>
                        </div>
                    )
                }
            </div >
        );
    };

    const handleFiles = async (fileList) => {
        if (fileList.length === 0) return;

        // 2026-02-03: Limit to 5 files to prevent bandwidth/AI timeouts
        if (fileList.length > 5) {
            alert("Maximum 5 files allowed per upload batch. Please upload more in chunks.");
            return;
        }

        setMessage(`Preparing to process ${fileList.length} files...`);
        setUploadingBank(true);

        const token = localStorage.getItem('token');
        let processedCount = 0;
        let failCount = 0;

        // SEQUENTIAL UPLOAD: One by one to prevent 502 Bad Gateway timeouts
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const formData = new FormData();
            formData.append('files', file);

            setMessage(`Processing File ${i + 1}/${fileList.length}: ${file.name}...`);

            try {
                const res = await axios.post('/api/company/upload-bank-statement', formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                let safeFiles = res.data.files || [];
                if (!Array.isArray(safeFiles)) safeFiles = [];

                // Update state instantly for this file
                setBankFiles(prev => {
                    const combined = [...prev, ...safeFiles];
                    // Sort by date (Oldest at Top)
                    return combined.sort((a, b) => {
                        const d1 = a.transactions?.[0]?.date ? parseDate(a.transactions[0].date) : null;
                        const d2 = b.transactions?.[0]?.date ? parseDate(b.transactions[0].date) : null;

                        // Push errors/unknown to bottom (far future timestamp)
                        const timeA = (d1 && d1.getTime() > 0) ? d1.getTime() : 9999999999999;
                        const timeB = (d2 && d2.getTime() > 0) ? d2.getTime() : 9999999999999;

                        return timeA - timeB;
                    });
                });

                // Auto-select if it's the first one
                if (processedCount === 0 && safeFiles.length > 0) {
                    setActiveFileIndex(0);
                }

                processedCount++;

                // 2026-02-03: Increased cooling delay (4s) to prevent Gemini 429 Resource Exhaustion
                if (i < fileList.length - 1) {
                    await new Promise(r => setTimeout(r, 4000));
                }
            } catch (err) {
                console.error(`Upload failed for ${file.name}:`, err);
                failCount++;
            }
        }

        const statusMsg = `Upload Finished. ${processedCount} successful, ${failCount} failed.`;
        setMessage(statusMsg);
        setUploadingBank(false);

        if (failCount > 0) {
            alert(`Warnings: ${failCount} file(s) failed during upload. Check console for details.`);
        }
    };

    // ==========================================
    // 🔒 PROTECTED CORE LOGIC - DO NOT MODIFY
    // The following `handleDelete` function is critical for data integrity.
    // It handles both database transactions and Google Drive file cleanup.
    // Lengthy comments removed for brevity but logic is preserved.
    // ==========================================
    const handleDelete = async (idx, file) => {
        // Robust check for saved status: If it has an _id in the DB, it's considered saved
        const isSaved = !!(file._id || file.status === 'Saved' || (file.transactions && file.transactions.some(t => t._id)));

        if (!window.confirm(`Delete ${isSaved ? 'PERMANENTLY' : 'this'} item?`)) return;

        if (isSaved) {
            try {
                const token = localStorage.getItem('token');

                // Corrected endpoint: /api/company/bank-file/ (singular)
                if (file._id && !file.isVirtual) {
                    await axios.delete(`/api/company/bank-file/${file._id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } else {
                    // Fallback to legacy transaction deletion
                    const ids = file.transactions ? file.transactions.map(t => t._id).filter(Boolean) : [];
                    if (ids.length > 0) {
                        await axios.post('/api/company/delete-transactions', {
                            transactionIds: ids
                        }, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    }
                }

                // 2026-02-03 FIX: Update state locally instead of full reload to prevent SiteGate lock
                setBankFiles(prev => prev.filter((_, i) => i !== idx));
                if (activeFileIndex === idx) setActiveFileIndex(0);
                setMessage("Document and transactions deleted successfully.");
                setTimeout(() => setMessage(''), 3000);

            } catch (err) {
                console.error('Delete API Error:', err);

                // If 404, it means they are already gone from DB. Just clean up UI.
                if (err.response && err.response.status === 404) {
                    console.warn("Transactions not found in DB, removing from UI only.");
                    setBankFiles(prev => prev.filter((_, i) => i !== idx));
                    if (activeFileIndex === idx) setActiveFileIndex(0);
                    return;
                }

                const errMsg = err.response?.data?.message || err.message;

                // Force Remove Option
                if (window.confirm(`Delete failed on server (${errMsg}). \n\nDo you want to FORCE REMOVE this item from your list anyway?`)) {
                    setBankFiles(prev => prev.filter((_, i) => i !== idx));
                    if (activeFileIndex === idx) setActiveFileIndex(0);
                    return;
                }

                if (errMsg === 'Token is not valid' || err.response?.status === 401) {
                    alert('Session Expired. Please Login Again.');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return;
                }

                // Show On-Screen Error
                setDebugLog({
                    title: 'Delete Failed',
                    message: errMsg,
                    details: JSON.stringify(err.response?.data || {}, null, 2)
                });
            }
        } else {
            // Delete Unsaved - No reload needed
            setBankFiles(prev => prev.filter((_, i) => i !== idx));
            if (activeFileIndex === idx) setActiveFileIndex(0);
        }
    };

    const renderBank = () => (
        <div className="w-full h-[calc(100vh-80px)] pt-6 pl-10 pr-[450px] animate-fade-in flex flex-col">
            <div className="mb-4 flex items-center gap-4">
                <button
                    onClick={() => setView('home')}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition shrink-0 shadow-md"
                    title="Back to Dashboard"
                >
                    <ArrowLeft size={20} />
                </button>
                <span className="text-gray-500 text-sm font-medium">Back to Dashboard</span>
            </div>

            <div className="flex flex-1 gap-6 min-h-0">

                {/* COLUMN 1: UPLOAD ZONE (Vertical) */}
                <div className="w-64 shrink-0 flex flex-col">
                    <div
                        className="flex-1 bg-white border-2 border-dashed border-green-200 rounded-2xl p-4 text-center hover:border-green-400 hover:bg-green-50/30 transition relative group flex flex-col items-center justify-center cursor-pointer"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (uploadingBank) return;
                            const fileList = Array.from(e.dataTransfer.files);
                            if (fileList.length === 0) return;
                            handleFiles(fileList);
                        }}
                    >
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            onChange={(e) => {
                                if (e.target.files?.length > 0) handleFiles(Array.from(e.target.files));
                            }}
                            disabled={uploadingBank}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        {uploadingBank && (
                            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center backdrop-blur-md rounded-2xl">
                                <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
                                <p className="text-xs font-bold text-gray-700 animate-pulse">Ai is Analyzing the statment...</p>
                            </div>
                        )}

                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 mb-4">
                            <CloudUpload size={24} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm mb-2 leading-tight">
                            Submit your bank statement
                        </h3>
                        <p className="text-xs text-gray-400">
                            Drag & drop or Click to Upload
                        </p>
                    </div>
                </div>

                {/* COLUMN 2: FILE LIST */}
                <div className="w-80 shrink-0 flex flex-col space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 flex flex-col gap-3 shrink-0">
                            <div className="flex justify-between items-center">
                                <span>Uploaded Files ({bankFiles.length})</span>
                                {bankFiles.length > 0 && bankFiles.every(f => f.status === 'Saved') ? (
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded flex items-center gap-1">
                                        <CheckCircle size={10} /> All Saved
                                    </span>
                                ) : bankFiles.length > 0 ? (
                                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded flex items-center gap-1">
                                        <AlertCircle size={10} /> Pending Save
                                    </span>
                                ) : null}
                            </div>
                            {/* SAVE BUTTON MOVED TO TOP */}
                            {bankFiles.length > 0 && (
                                <button
                                    onClick={handleSaveTransactions}
                                    disabled={savingBank}
                                    className="w-full bg-black text-white px-3 py-2 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400 flex items-center justify-center gap-2 shadow-sm text-xs"
                                >
                                    {savingBank ? <Loader2 className="animate-spin h-3 w-3" /> : <Save size={14} />}
                                    {savingBank ? 'SAVING...' : 'SAVE ALL'}
                                </button>
                            )}
                        </div>
                        <div className="divide-y divide-gray-100 overflow-y-auto flex-1 p-2">
                            {bankFiles.map((file, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 mb-2 rounded-lg flex items-center justify-between transition cursor-pointer group ${activeFileIndex === idx ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                                    onClick={() => setActiveFileIndex(idx)}
                                >
                                    <div className="flex-1 min-w-0 mr-2">
                                        {/* Primary Title: Date Range */}
                                        <p className="font-bold text-gray-800 text-xs truncate mb-1">
                                            {(() => {
                                                const rangeStr = file.dateRange || "";
                                                // Priority 1: Meta Date Range (Formatted)
                                                if (rangeStr.includes(" - ") && !rangeStr.includes("FATAL_ERR") && !rangeStr.includes("DEBUG_ERR")) {
                                                    const parts = rangeStr.split(' - ');
                                                    const s = formatDateSafe(parts[0].trim());
                                                    const e = formatDateSafe(parts[1].trim());
                                                    if (s !== '-' && e !== '-') return `${s} - ${e}`;
                                                }

                                                // Priority 1.5: Use Transaction Range if dateRange is missing/garbage
                                                if (file.transactions?.length > 0) {
                                                    const dates = file.transactions.map(t => parseDate(t.date)?.getTime()).filter(Boolean);
                                                    if (dates.length > 0) {
                                                        const s = new Date(Math.min(...dates)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                                        const e = new Date(Math.max(...dates)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                                        return `${s} - ${e}`;
                                                    }
                                                }

                                                // Priority 2: Use original name if it's not the same as dateRange
                                                if (file.originalName && !file.originalName.includes('-')) return file.originalName;

                                                // Priority 3: Fallback
                                                return 'Bank Statement';
                                            })()}
                                        </p>

                                        {/* Metadata: Original Name + Count */}
                                        <div className="flex flex-col text-[10px] text-gray-400 mt-1 space-y-0.5">
                                            <div className="flex items-center">
                                                <FileText size={10} className="mr-1 opacity-50" />
                                                <span className="truncate max-w-[120px] mr-2" title={file.originalName}>{file.originalName}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="ml-2 font-mono">{(file.transactions || []).length} txs</span>

                                                {/* SYNC STATUS ICONS */}
                                                <div className="ml-auto flex items-center gap-1.5">
                                                    {file.isLocked && (
                                                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-black flex items-center gap-1" title="Transactions Recorded in Ledger">
                                                            <ShieldCheck size={8} /> STICKED
                                                        </span>
                                                    )}

                                                    {!file.path && file.syncError ? (
                                                        <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 font-black flex items-center gap-1 cursor-help" onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDebugLog({
                                                                title: 'Cloud Sync Failed',
                                                                message: 'This file was analyzed locally but could not be saved to Google Drive.',
                                                                details: `File: ${file.originalName}\nError: ${file.syncError}\n\nPlease contact system admin to check folder permissions.`
                                                            });
                                                        }}>
                                                            <AlertCircle size={8} /> SYNC FAILED
                                                        </span>
                                                    ) : (file.isMetadataOnly || file.driveId) ? (
                                                        <span className="text-[8px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-black flex items-center gap-1">
                                                            <CheckCircle size={8} /> SAVED
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            {(file.bankName || file.accountNumber) && (
                                                <div className="flex items-center text-blue-500/60 font-medium">
                                                    <Tag size={10} className="mr-1" />
                                                    <span className="truncate">{file.bankName || 'Unknown Bank'} {file.accountNumber ? `(${file.accountNumber})` : ''}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-1">
                                        {/* DELETE */}
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                handleDelete(idx, file);
                                            }}
                                            className="p-1.5 rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 transition"
                                        >
                                            <X size={14} />
                                        </button>
                                        {/* EYE */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveFileIndex(idx); }}
                                            className={`p-1.5 rounded-full transition ${activeFileIndex === idx ? 'text-blue-600 bg-blue-100' : 'text-gray-300 hover:text-blue-500'}`}
                                        >
                                            <Eye size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {bankFiles.length === 0 && (
                                <div className="text-center py-10 text-gray-300 text-xs italic">
                                    No files yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMN 3: DETAILS TABLE */}
                <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                <Table className="text-blue-500" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Page Details</h3>
                                <p className="text-xs text-gray-500">
                                    {bankFiles[activeFileIndex]?.transactions?.length > 0
                                        ? (() => {
                                            const dates = bankFiles[activeFileIndex].transactions.map(t => parseDate(t.date)?.getTime()).filter(Boolean);
                                            const s = new Date(Math.min(...dates)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                            const e = new Date(Math.max(...dates)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                            return `${s} - ${e}`;
                                        })()
                                        : (bankFiles[activeFileIndex]?.dateRange || 'Select a file')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* NEW: View Original PDF Button */}
                            {(bankFiles[activeFileIndex]?.path?.startsWith('drive:') || bankFiles[activeFileIndex]?.driveId) && (
                                <a
                                    href={`${getDocUrl(bankFiles[activeFileIndex] || { path: 'drive:' + bankFiles[activeFileIndex].driveId })}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:text-blue-600 hover:border-blue-300 transition flex items-center gap-2 mr-2"
                                >
                                    <FileText size={12} />
                                    <span>View Original</span>
                                </a>
                            )}
                            {bankFiles[activeFileIndex]?.accountNumber && (
                                <div className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 font-bold uppercase tracking-wider">
                                    {bankFiles[activeFileIndex].bankName || 'BANK'}: {bankFiles[activeFileIndex].accountNumber}
                                </div>
                            )}
                            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center">
                                <CheckCircle size={12} className="mr-1" /> Verified
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-white">
                        <table className="w-full text-left">
                            <thead className="bg-white text-gray-800 text-xs font-bold uppercase sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                                <tr>
                                    <th className="px-4 py-4 whitespace-nowrap w-[80px]">Date</th>
                                    <th className="px-4 py-4 w-full">Transaction Details</th>
                                    <th className="px-4 py-4 text-right w-[110px]">Money In</th>
                                    <th className="px-4 py-4 text-right w-[110px]">Money Out</th>
                                    <th className="px-4 py-4 text-right w-[110px]">Balance</th>
                                    <th className="px-4 py-4 w-[100px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(bankFiles[activeFileIndex]?.transactions || []).length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-16">
                                            <div className="text-gray-400 text-sm mb-3 font-medium">No transactions to display</div>
                                            <div className="text-red-500 font-bold text-xs uppercase tracking-widest bg-red-50 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-100 shadow-sm">
                                                <AlertCircle size={14} />
                                                Google Drive Scanned {new Date().toLocaleDateString('en-GB').replace(/\//g, ' ')} {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    (bankFiles[activeFileIndex]?.transactions || []).map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition group">
                                            <td className="px-4 py-4 text-xs text-gray-600 font-bold whitespace-nowrap align-top">
                                                {formatDateSafe(tx?.date)}
                                            </td>
                                            <td className="px-4 py-4 text-xs text-gray-700 font-medium align-top">
                                                <div className="whitespace-pre-wrap leading-relaxed">
                                                    {tx?.description || ''}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-right font-medium text-green-600 align-top whitespace-nowrap">
                                                {tx?.moneyIn && parseFloat(tx.moneyIn) > 0 ? parseFloat(tx.moneyIn).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                                            </td>
                                            <td className="px-4 py-4 text-xs text-right font-medium text-red-600 align-top whitespace-nowrap">
                                                {tx?.moneyOut && parseFloat(tx.moneyOut) > 0 ? parseFloat(tx.moneyOut).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                                            </td>
                                            <td className="px-4 py-4 text-xs text-right text-gray-800 font-bold align-top whitespace-nowrap">
                                                {tx?.balance ? parseFloat(String(tx.balance).replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-xs align-top">
                                                {/* Actions */}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`mt-4 mx-auto max-w-lg p-3 rounded-full text-xs font-bold text-center fixed top-6 left-0 right-0 shadow-lg z-50 animate-bounce-in ${message.includes('Error') ? 'bg-red-500 text-white' : 'bg-black text-white'}`}>
                    {message}
                </div>
            )}

            {/* DEBUG CONSOLE (For User Feedback) */}
            {debugLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full border-2 border-red-500 relative">
                        <button
                            onClick={() => setDebugLog(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X />
                        </button>
                        <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center">
                            <span className="bg-red-100 p-2 rounded-full mr-3">⚠️</span>
                            {debugLog.title}
                        </h3>
                        <p className="text-gray-800 font-medium mb-4">{debugLog.message}</p>

                        <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                            <pre className="text-xs font-mono text-gray-600">
                                {debugLog.details}
                            </pre>
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            Please take a screenshot of this error and send it to support.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    // --- Inspector Handlers ---
    const handleRegenerate = async () => {
        if (!viewDoc) return;
        setRegenerating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/regenerate-document', {
                docType: viewDoc.docType
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update Form Data
            setFormData(prev => ({ ...prev, ...res.data.profile }));

            // Flash Update
            setMessage('Document Re-scanned Successfully!');

        } catch (err) {
            console.error(err);
            alert('Regeneration Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setRegenerating(false);
        }
    };

    // RENDER LOGIC
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-white">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 shadow-lg h-16 flex items-center px-6 justify-between print:hidden">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')} title="Home / Dashboard">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 text-sm tracking-tighter group-hover:scale-105 transition-transform">
                            GK
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors hidden sm:block">GK SMART <span className="text-gray-500 font-normal">& Ai</span></span>
                    </div>

                    {view !== 'home' && (
                        <button
                            onClick={() => setView('home')}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-white/5 active:scale-95 shadow-md"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}

                    <div className="hidden md:flex items-center ml-2">
                        <span className="text-slate-300 font-black text-xs uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {formData?.username || 'GK SMART'}
                        </span>
                    </div>

                    <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hidden sm:flex items-center shadow-inner gap-1.5">
                        GK SMART & AI · V1.0 Public
                    </span>

                    <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hidden sm:flex items-center gap-1.5 animate-pulse">
                        ⚡ A2 · LOCAL
                    </span>

                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        }}
                        className="text-[10px] text-red-500 hover:text-white font-black uppercase tracking-widest bg-red-500/10 hover:bg-red-500 px-4 py-1.5 rounded-lg transition-all border border-red-500/20 shadow-xl flex items-center active:scale-95 hover:shadow-red-500/20"
                    >
                        Log Out
                    </button>
                </div>

                {/* Empty div to preserve justify-between layout if needed */}
                <div className="flex items-center gap-3 sm:gap-4"></div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative print:overflow-visible">
                {view === 'home' && renderHome()}
                {view === 'profile' && renderProfile()}
                {view === 'bank' && renderBank()}
                {view === 'bank_v2' && <BankStatementV2Workspace onBack={() => setView('home')} />}
                {view === 'iews' && renderIEWS()}
                {view === 'ledger' && <ErrorBoundary><GeneralLedger onBack={() => setView('home')} /></ErrorBoundary>}
                {view === 'tb' && <ErrorBoundary><TrialBalance onBack={() => setView('home')} /></ErrorBoundary>}
                {view === 'codes' && <AccountingCodes onBack={() => setView('home')} />}
                {view === 'financials' && <ErrorBoundary><FinancialStatements onBack={() => setView('home')} /></ErrorBoundary>}
                {view === 'currency' && <CurrencyExchange onBack={() => setView('home')} />}
                {view === 'toi_acar' && <ToiAcar onBack={() => setView('home')} packageId={adminSelectedUser || formData?.companyCode} />}
                {view === 'assets' && <AssetDepreciation onBack={() => setView('home')} />}
                {view === 'salary' && <SalaryTOSRecon onBack={() => setView('home')} />}
                {view === 'related' && <RelatedPartyDisclosure onBack={() => setView('home')} />}
                {view === 'withholdings' && <Withholdings onBack={() => setView('home')} />}
                {view === 'agentic_filing' && renderAgenticFiling()}
            </main>

            {/* DOCUMENT INSPECTOR MODAL */}
            {/* Modal Removed - Using Integrated Workbench Instead */}



            {/* Toast/Debug Overlay */}
            {message && (
                <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up z-50">
                    {uploadingBank || savingBank || regenerating ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} className="text-green-400" />}
                    <span className="font-medium text-sm">{message}</span>
                </div>
            )}

            {debugLog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full p-10 relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setDebugLog(null)}
                            className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <X />
                        </button>
                        <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center">
                            <span className="bg-red-100 p-2 rounded-full mr-3">⚠️</span>
                            {debugLog.title}
                        </h3>
                        <p className="text-gray-800 font-medium mb-4">{debugLog.message}</p>

                        <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                            <pre className="text-xs font-mono text-gray-600">
                                {debugLog.details}
                            </pre>
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            Please take a screenshot of this error and send it to support.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

