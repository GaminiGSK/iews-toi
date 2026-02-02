import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, Paperclip } from 'lucide-react';

import { useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext'; // Import Context

const AIAssistant = () => {
    // LOCATION
    const location = useLocation();

    // SOCKET
    const socket = useSocket();
    const [isConnected, setIsConnected] = useState(false);

    // STATE
    const [isOpen, setIsOpen] = useState(true); // Default Open
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I am your GGMT BLUE AGENT. Describe your request or paste an image for analysis.' }
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

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        setIsConnected(socket.connected);

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);
        const onAgentMessage = (data) => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: data.text || "Update received.",
                isSystem: data.isSystem,
                toolAction: data.toolAction
            }]);
            if (!isOpen) setIsOpen(true); // Auto-open on message
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('agent:message', onAgentMessage);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('agent:message', onAgentMessage);
        };
    }, [socket, isOpen]);

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
            // Get Package ID if in Workspace
            const searchParams = new URLSearchParams(window.location.search);
            const packageId = searchParams.get('packageId') || searchParams.get('year'); // Fallback or primary

            const res = await axios.post('/api/chat/message',
                {
                    message: userMsg.text,
                    image: userMsg.image,
                    context: {
                        route: location.pathname,
                        packageId: packageId
                    } // <--- Send Context
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const { text, toolAction } = res.data;

            setMessages(prev => [...prev, {
                role: 'assistant',
                text: text,
                toolAction: toolAction
            }]);

            // AUTO-EXECUTE Workspace Actions
            if (toolAction && toolAction.tool_use === 'workspace_action' && socket) {
                console.log("[AI Assistant] Triggering Workspace Action:", toolAction.action);
                socket.emit('workspace:perform_action', {
                    action: toolAction.action,
                    packageId: packageId,
                    params: {
                        year: packageId,
                        companyCode: localStorage.getItem('companyCode') // Pass if available
                    }
                });
            }

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
            setMessages(prev => [...prev, { role: 'assistant', text: "âœ?Journal Entry posted successfully! The Trial Balance has been updated.", isSystem: true }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', text: "â?Error posting journal entry. Please try again.", isSystem: true }]);
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
        // KEY CHANGE: Reverted to Right-6, Items-End (standard chatbot position)
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div
                    className="bg-slate-900 pointer-events-auto rounded-2xl shadow-2xl border border-blue-500/30 w-[650px] flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200"
                    style={{ height: '85vh', maxHeight: '950px' }}
                >
                    {/* Header - Enforce Blue Gradient */}
                    <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 p-6 shrink-0 flex justify-between items-center text-white shadow-lg border-b border-blue-500/30">
                        <div className="flex items-center gap-5">
                            {/* Logo - Doubled Size */}
                            <div className="p-1 bg-white ring-4 ring-blue-400/30 rounded-full h-24 w-24 flex items-center justify-center overflow-hidden shadow-xl relative z-10">
                                {/* Use Logo if available, else Fallback */}
                                <img src={GK_LOGO} alt="GK" className="object-cover w-full h-full" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                                <div className="hidden w-full h-full bg-blue-600 items-center justify-center font-bold text-white text-3xl">GK</div>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-2xl tracking-wide text-white drop-shadow-sm">GGMT BLUE AGENT</h3>
                                <div className="flex items-center gap-2 opacity-90 mt-1">
                                    <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-500'} animate-pulse box-shadow-glow`}></span>
                                    <span className={`text-sm font-bold uppercase tracking-wider ${isConnected ? 'text-blue-200' : 'text-red-400'}`}>{isConnected ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-3 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-950 scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-transparent">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                                {/* Message Bubble - Larger Font */}
                                <div className={`max-w-[85%] rounded-3xl px-6 py-4 text-lg shadow-sm mb-1 leading-relaxed ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-blue-900/20'
                                    : msg.isSystem
                                        ? 'bg-blue-900/30 text-blue-100 border border-blue-800'
                                        : 'bg-slate-800 text-gray-100 border border-slate-700 rounded-tl-sm shadow-lg'
                                    }`}>

                                    {/* Image Attachment (User) */}
                                    {msg.image && (
                                        <div className="mb-4 rounded-xl overflow-hidden border border-white/20 shadow-md">
                                            <img src={msg.image} alt="User Upload" className="max-w-full h-auto" />
                                        </div>
                                    )}

                                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                                </div>

                                {/* Tool Action: Journal Proposal Card */}
                                {/* Keep styling consistent but darker for Dark Mode */}
                                {msg.toolAction && msg.toolAction.tool_use === 'propose_journal_entry' && (
                                    <div className="max-w-[95%] bg-slate-900 border border-blue-500/40 rounded-2xl shadow-2xl mt-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                        <div className="bg-blue-900/40 px-6 py-4 border-b border-blue-500/30 flex justify-between items-center">
                                            <span className="text-base font-bold text-blue-300 uppercase tracking-wide flex items-center gap-2"><Sparkles size={16} /> Proposed Adjustment</span>
                                            <span className="text-sm text-blue-400 font-mono bg-blue-900/50 px-2 py-1 rounded">{msg.toolAction.journal_data.date}</span>
                                        </div>
                                        <div className="p-6">
                                            <p className="text-lg font-medium text-gray-100 mb-6 border-l-4 border-blue-500 pl-4">{msg.toolAction.journal_data.description}</p>
                                            <div className="bg-slate-950 rounded-xl border border-slate-700 text-sm overflow-hidden mb-6">
                                                {msg.toolAction.journal_data.lines.map((line, i) => (
                                                    <div key={i} className="flex justify-between items-center p-3 border-b border-slate-800 last:border-0 hover:bg-slate-900 transition">
                                                        <span className="text-gray-300 font-mono font-medium truncate flex-1 pr-4 text-base">{line.accountCode}</span>
                                                        <div className="flex gap-6 font-mono text-base">
                                                            <div className="min-w-[100px] text-right">
                                                                <span className="text-xs text-gray-500 block">DR</span>
                                                                <span className={line.debit > 0 ? "text-emerald-400 font-bold" : "text-gray-700"}>{line.debit > 0 ? line.debit.toFixed(2) : '-'}</span>
                                                            </div>
                                                            <div className="min-w-[100px] text-right">
                                                                <span className="text-xs text-gray-500 block">CR</span>
                                                                <span className={line.credit > 0 ? "text-emerald-400 font-bold" : "text-gray-700"}>{line.credit > 0 ? line.credit.toFixed(2) : '-'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleApproveJournal(msg.toolAction.journal_data)}
                                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
                                                >
                                                    <Sparkles size={20} /> Approve & Post
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm flex items-center gap-2">
                                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-3 h-3 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area - Larger Typing Space */}
                    <div className="p-6 bg-slate-900 border-t border-slate-700 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-20">
                        {/* Pending Image Preview */}
                        {image && (
                            <div className="mb-4 relative inline-block group animate-in slide-in-from-bottom-5 fade-in">
                                <img src={image} alt="Pending" className="h-32 w-auto rounded-xl border-2 border-blue-500/50 shadow-lg" />
                                <button
                                    onClick={() => setImage(null)}
                                    className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-end gap-4 bg-slate-800 border border-slate-600 p-4 rounded-3xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition shadow-inner">
                            {/* Attachment Icon */}
                            <div className="pb-3 text-gray-400 hover:text-blue-400 cursor-pointer transition" title="Paste image">
                                <Paperclip size={24} />
                            </div>

                            <textarea
                                ref={textareaRef}
                                className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-gray-500 resize-none max-h-60 py-2 leading-relaxed"
                                placeholder="Type your request or Paste Image (Ctrl+V)..."
                                rows={2} /* Increased default height */
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                            />

                            <button
                                onClick={handleSend}
                                disabled={(!input.trim() && !image) || isThinking}
                                className={`p-4 rounded-full transition mb-0.5 ${(input.trim() || image) ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-500 hover:scale-110' : 'bg-slate-700 text-gray-500 cursor-not-allowed'}`}
                            >
                                <Send size={24} />
                            </button>
                        </div>
                        <div className="text-center mt-3">
                            <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
                                <Sparkles size={14} className="text-blue-400" /> GGMT BLUE AGENT - v3.0 Ultra
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button (Collapsed State) - Left Side */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white p-5 rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 group relative ring-4 ring-slate-900 border border-white/10"
                >
                    <div className="relative">
                        <Bot size={36} />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                    </div>
                </button>
            )}
        </div>
    );
};

export default AIAssistant;
