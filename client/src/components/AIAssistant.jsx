import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, Paperclip, Image as ImageIcon } from 'lucide-react';

const AIAssistant = () => {
    // STATE
    const [isOpen, setIsOpen] = useState(true); // Default Open
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I am your GK Blue Agent. Describe your request or paste an image for analysis.' }
    ]);
    const [input, setInput] = useState('');
    const [image, setImage] = useState(null); // Base64 string
    const [isThinking, setIsThinking] = useState(false);

    // REFS
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isThinking]);

    // HANDLERS
    const handleSend = async () => {
        if ((!input.trim() && !image) || isThinking) return;

        const userMsg = { role: 'user', text: input, image: image };
        setMessages(prev => [...prev, userMsg]);

        // Clear Input immediately
        setInput('');
        setImage(null);
        if (textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset height

        setIsThinking(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/chat/message',
                { message: userMsg.text, image: userMsg.image },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            setMessages(prev => [...prev, {
                role: 'assistant',
                text: res.data.text,
                toolAction: res.data.toolAction
            }]);
        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I am unable to connect to the server right now." }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    setImage(event.target.result);
                };
                reader.readAsDataURL(blob);
                e.preventDefault(); // Prevent pasting the filename text
                return;
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleApproveJournal = async (journalData) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/journal-entry',
                journalData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setMessages(prev => [...prev, { role: 'assistant', text: "✅ Journal Entry posted successfully! The Trial Balance has been updated.", isSystem: true }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', text: "❌ Error posting journal entry. Please try again.", isSystem: true }]);
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const GK_LOGO = "/gk-logo.png"; // Placeholder for user asset

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div
                    className="bg-slate-900 pointer-events-auto rounded-2xl shadow-2xl border border-slate-700 w-[600px] flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200"
                    style={{ height: '85vh', maxHeight: '900px' }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 shrink-0 flex justify-between items-center text-white shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="p-1 bg-white ring-2 ring-white/30 rounded-full h-12 w-12 flex items-center justify-center overflow-hidden">
                                {/* Use Logo if available, else Fallback */}
                                <img src={GK_LOGO} alt="GK" className="object-cover w-full h-full" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
                                <div className="hidden font-bold text-green-700 text-lg">GK</div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg tracking-wide">GK BLUE AGENT</h3>
                                <div className="flex items-center gap-1.5 opacity-90">
                                    <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/20 rounded-full transition text-white/90 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                                {/* Message Bubble */}
                                <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-base shadow-sm mb-1 leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-sm'
                                        : msg.isSystem
                                            ? 'bg-green-900/40 text-green-100 border border-green-800'
                                            : 'bg-slate-800 text-gray-100 border border-slate-700 rounded-tl-sm'
                                    }`}>

                                    {/* Image Attachment (User) */}
                                    {msg.image && (
                                        <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                                            <img src={msg.image} alt="User Upload" className="max-w-full h-auto" />
                                        </div>
                                    )}

                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>

                                {/* Tool Action: Journal Proposal Card */}
                                {/* Keep styling consistent but darker for Dark Mode */}
                                {msg.toolAction && msg.toolAction.tool_use === 'propose_journal_entry' && (
                                    <div className="max-w-[95%] bg-slate-800 border border-indigo-500/30 rounded-xl shadow-lg mt-2 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                        <div className="bg-indigo-900/40 px-5 py-3 border-b border-indigo-500/20 flex justify-between items-center">
                                            <span className="text-sm font-bold text-indigo-300 uppercase tracking-wide">Proposed Adjustment</span>
                                            <span className="text-xs text-indigo-400 font-mono">{msg.toolAction.journal_data.date}</span>
                                        </div>
                                        <div className="p-5">
                                            <p className="text-sm font-medium text-gray-200 mb-4">{msg.toolAction.journal_data.description}</p>
                                            <div className="bg-slate-900 rounded border border-slate-700 text-xs overflow-hidden">
                                                {msg.toolAction.journal_data.lines.map((line, i) => (
                                                    <div key={i} className="flex justify-between p-2.5 border-b border-slate-800 last:border-0 hover:bg-slate-800/50">
                                                        <span className="text-gray-400 font-mono truncate flex-1 pr-2">{line.accountCode}</span>
                                                        <div className="flex gap-4 font-mono">
                                                            <span className={line.debit > 0 ? "text-gray-200" : "text-gray-600"}>{line.debit > 0 ? line.debit.toFixed(2) : '-'}</span>
                                                            <span className={line.credit > 0 ? "text-gray-200" : "text-gray-600"}>{line.credit > 0 ? line.credit.toFixed(2) : '-'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    onClick={() => handleApproveJournal(msg.toolAction.journal_data)}
                                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg hover:shadow-indigo-500/20"
                                                >
                                                    <Sparkles size={16} /> Approve & Post
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-900 border-t border-slate-700 shrink-0">
                        {/* Pending Image Preview */}
                        {image && (
                            <div className="mb-3 relative inline-block group">
                                <img src={image} alt="Pending" className="h-24 w-auto rounded-lg border border-slate-600 shadow-md" />
                                <button
                                    onClick={() => setImage(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-end gap-3 bg-slate-800 border border-slate-600 rounded-3xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition shadow-inner">
                            {/* Attachment Icon (Visual Hint only for now, since Paste is primary) */}
                            <div className="pb-2 text-gray-500 hover:text-gray-300 cursor-pointer" title="Paste image to upload">
                                <Paperclip size={20} />
                            </div>

                            <textarea
                                ref={textareaRef}
                                className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder-gray-500 resize-none max-h-32 py-2"
                                placeholder="Paste image (Ctrl+V) or type your request..."
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                            />

                            <button
                                onClick={handleSend}
                                disabled={(!input.trim() && !image) || isThinking}
                                className={`p-3 rounded-full transition mb-0.5 ${(input.trim() || image) ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-500 hover:scale-105' : 'bg-slate-700 text-gray-500 cursor-not-allowed'}`}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        <div className="text-center mt-3">
                            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                                <Sparkles size={12} className="text-yellow-500/50" /> GK Blue Agent - Powered by Gemini 2.0
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button (Collapsed State) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white p-4 rounded-full shadow-2xl hover:shadow-green-500/20 hover:scale-110 transition-all duration-300 group relative ring-2 ring-white/10"
                >
                    <div className="relative">
                        <Bot size={28} />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                    </div>
                </button>
            )}
        </div>
    );
};

export default AIAssistant;
