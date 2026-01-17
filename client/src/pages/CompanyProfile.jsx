import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, Save, Building, MapPin, FileText, CheckCircle, Loader2, ArrowLeft, CloudUpload, Table, FileSpreadsheet, LogOut } from 'lucide-react';

export default function CompanyProfile() {
    const navigate = useNavigate();
    const [view, setView] = useState('home'); // 'home', 'profile', 'bank'
    const [file, setFile] = useState(null); // Used for MOC Text
    const [bankText, setBankText] = useState(''); // New State for Bank Text
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadingBank, setUploadingBank] = useState(false);
    const [message, setMessage] = useState('');
    const [transactions, setTransactions] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        companyNameEn: '',
        companyNameKh: '',
        registrationNumber: '',
        incorporationDate: '',
        companyType: '',
        address: '',
        shareholder: '',
        director: '',
        vatTin: '',
        businessActivity: '',
        businessRegistration: '',
        companyCode: ''
    });

    // Fetch existing profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/company/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setFormData(prev => ({ ...prev, ...res.data }));
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('site_access'); // Optional: Clear site access too if strict
        navigate('/login');
    };

    // Handler for MOC Text Paste
    const handleRegistrationUpload = async () => {
        if (!file) return;
        setProcessing(true);
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/parse-moc-text', { text: file }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Auto-populate form
            const extracted = res.data.data;
            const newFormData = {
                ...formData,
                companyNameEn: extracted.companyNameEn || formData.companyNameEn,
                companyNameKh: extracted.companyNameKh || formData.companyNameKh,
                registrationNumber: extracted.registrationNumber || formData.registrationNumber,
                incorporationDate: extracted.incorporationDate || formData.incorporationDate,
                companyType: extracted.companyType || formData.companyType,
                address: extracted.address || formData.address,
            };
            setFormData(newFormData);

            // AUTO-SAVE
            await axios.post('/api/company/update-profile', newFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('MOC Details saved successfully!');
        } catch (err) {
            setMessage('Error processing text. Please try again.');
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    const handleSaveAdditionalDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/update-profile', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Additional details saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Error saving details.');
        } finally {
            setLoading(false);
        }
    };

    // Handler for Bank Text Paste
    const handleBankTextSubmit = async () => {
        if (!bankText) return;

        setUploadingBank(true);
        setTransactions([]);
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/company/parse-bank-text', { text: bankText }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setTransactions(res.data.extractedData || []);
            setMessage('Bank statement processed successfully!');
        } catch (err) {
            setMessage('Error processing bank statement.');
            console.error(err);
        } finally {
            setUploadingBank(false);
        }
    };

    // --- Views ---

    const renderHome = () => (
        <div className="max-w-4xl mx-auto p-12">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-800">Welcome to the {formData.companyCode || 'Company'}</h1>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium transition px-4 py-2 rounded-lg hover:bg-red-50"
                >
                    <LogOut size={20} />
                    Log Out
                </button>
            </div>
            <p className="text-gray-500 mb-12">Manage your company details and financial data.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button
                    onClick={() => {
                        setView('profile');
                        setMessage('');
                    }}
                    className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition group"
                >
                    <div className="p-4 bg-blue-50 rounded-full mb-6 group-hover:bg-blue-100 transition">
                        <FileText size={48} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Paste MOC Details</h3>
                    <p className="text-gray-500 text-center">Copy & Paste details from your certificate.</p>
                </button>

                {/* Submit Bank Statement */}
                <button
                    onClick={() => {
                        setView('bank');
                        setMessage('');
                        setTransactions([]);
                    }}
                    className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-green-300 transition group"
                >
                    <div className="p-4 bg-green-50 rounded-full mb-6 group-hover:bg-green-100 transition">
                        <FileText size={48} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Paste Bank Statement</h3>
                    <p className="text-gray-500 text-center">Copy & Paste transaction text.</p>
                </button>
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="max-w-4xl mx-auto p-6">
            <button onClick={() => setView('home')} className="flex items-center text-gray-500 hover:text-gray-800 mb-6">
                <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </button>

            {/* MOC Paste Section */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <FileText className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">1. Paste MOC Details</h2>
                        <p className="text-sm text-gray-500">Copy the text from your MOC certificate and paste it here.</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    <textarea
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                        rows="6"
                        placeholder="Paste certificate text here..."
                        onChange={(e) => setFile(e.target.value)}
                    ></textarea>

                    <button
                        onClick={handleRegistrationUpload}
                        disabled={!file || processing}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition shadow-sm w-fit"
                    >
                        {processing ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin h-4 w-4" /> Saving...
                            </span>
                        ) : 'Save Details'}
                    </button>
                </div>
                {message && view === 'profile' && (
                    <div className={`mt-4 p-4 rounded-lg text-sm flex items-center gap-2 ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.includes('success') && <CheckCircle className="h-4 w-4" />}
                        {message}
                    </div>
                )}
            </div>

            {/* Editable Company Details Form */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8 animation-fade-in">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={24} />
                    Company Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (English)</label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.companyNameEn || ''}
                            onChange={(e) => setFormData({ ...formData, companyNameEn: e.target.value })}
                            placeholder="e.g. ABC Co., Ltd."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (Khmer)</label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.companyNameKh || ''}
                            onChange={(e) => setFormData({ ...formData, companyNameKh: e.target.value })}
                            placeholder="Khmer Name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.registrationNumber || ''}
                            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Incorporation Date</label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.incorporationDate || ''}
                            onChange={(e) => setFormData({ ...formData, incorporationDate: e.target.value })}
                            placeholder="DD Month YYYY"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Type</label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.companyType || ''}
                            onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            rows="2"
                            value={formData.address || ''}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        ></textarea>
                    </div>


                    {/* Additional Fields (Shareholder etc) */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Shareholder</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Shareholder Name"
                                value={formData.shareholder}
                                onChange={(e) => setFormData({ ...formData, shareholder: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">VAT TIN</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="VAT TIN"
                                value={formData.vatTin}
                                onChange={(e) => setFormData({ ...formData, vatTin: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Director</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Director Name"
                                value={formData.director}
                                onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Activity</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Business Activity"
                                value={formData.businessActivity}
                                onChange={(e) => setFormData({ ...formData, businessActivity: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleSaveAdditionalDetails}
                            disabled={loading}
                            className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400"
                        >
                            {loading ? 'SAVING...' : 'SAVE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBank = () => (
        <div className="max-w-4xl mx-auto p-6">
            <button onClick={() => setView('home')} className="flex items-center text-gray-500 hover:text-gray-800 mb-6">
                <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
            </button>

            {/* Bank Statement Upload Section (Multi-Image) */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                        <FileText className="text-green-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">1. Upload Bank Statements (Drag & Drop)</h2>
                        <p className="text-sm text-gray-500">Upload transaction screenshots or PDF files.</p>
                    </div>
                </div>

                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer relative ${uploadingBank ? 'bg-gray-50 border-gray-300' : 'border-green-300 bg-green-50/30 hover:bg-green-50 hover:border-green-400'
                        }`}
                >
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple // Allow Multiple Files
                        onChange={async (e) => {
                            if (!e.target.files || e.target.files.length === 0) return;

                            const fileList = Array.from(e.target.files);
                            // Store selected files in a state (need to add this state if not exists, but for now we upload immediately)
                            // Ideally we would show them first. For now let's just show the count in message.

                            setMessage(`Processing ${fileList.length} files...`);
                            setUploadingBank(true);
                            setTransactions([]);

                            const formData = new FormData();
                            fileList.forEach(file => {
                                formData.append('files', file);
                            });

                            try {
                                const token = localStorage.getItem('token');
                                const res = await axios.post('/api/company/upload-bank-statement', formData, {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'multipart/form-data'
                                    }
                                });
                                setTransactions(res.data.extractedData || []);
                                setMessage(`Success! Parsed ${res.data.extractedData?.length || 0} transactions from ${fileList.length} files.`);
                            } catch (err) {
                                setMessage('Error uploading files.');
                                console.error(err);
                            } finally {
                                setUploadingBank(false);
                            }
                        }}
                        disabled={uploadingBank}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    <div className="flex flex-col items-center pointer-events-none">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <CloudUpload size={32} className="text-green-600" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-1">
                            {uploadingBank ? 'Processing Files...' : 'Click to Upload Images'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {uploadingBank ? 'Extracting data...' : 'Drag & drop multiple screenshots'}
                        </p>
                        <div className="flex gap-2">
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">JPG</span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">PNG</span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">PDF</span>
                        </div>
                    </div>
                </div>

                {/* Upload Status / File List (Simplified) */}
                {message && (
                    <div className={`mt-4 p-4 rounded-lg text-sm font-medium text-center ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
                        {message}
                    </div>
                )}


                {uploadingBank && (
                    <div className="mt-8 text-center py-8 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <Loader2 className="animate-spin h-8 w-8 text-green-600 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-800">AI Verification in Progress</h3>
                        <p className="text-gray-500 text-sm">Analyzing transaction patterns...</p>
                    </div>
                )}
            </div>

            {/* Extracted Data Table for Bank */}
            {transactions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in mb-8">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                <Table className="text-blue-500" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Extracted Transactions</h3>
                                <p className="text-xs text-gray-500">Review and verify before finalizing.</p>
                            </div>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center">
                            <CheckCircle size={12} className="mr-1" /> AI Verified
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Description</th>
                                    <th className="px-6 py-4 font-medium text-right">Money In</th>
                                    <th className="px-6 py-4 font-medium text-right">Money Out</th>
                                    <th className="px-6 py-4 font-medium text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{tx.date}</td>
                                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">{tx.description}</td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                                            {tx.moneyIn ? `+${parseFloat(tx.moneyIn).toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-red-600">
                                            {tx.moneyOut ? `-${parseFloat(tx.moneyOut).toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-800 font-bold">
                                            {tx.balance || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {view === 'home' && renderHome()}
            {view === 'profile' && renderProfile()}
            {view === 'bank' && renderBank()}
        </div>
    );
}
