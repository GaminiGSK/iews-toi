import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot } from 'lucide-react';

const AIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I am your Financial AI Assistant. Ask me about your transactions, accounting codes, or trial balance.' }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/chat/message',
                { message: userMsg.text },
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

    const handleApproveJournal = async (journalData) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/company/journal-entry',
                journalData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setMessages(prev => [...prev, { role: 'assistant', text: "✅ Journal Entry posted successfully! The Trial Balance has been updated." }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', text: "❌ Error posting journal entry. Please try again." }]);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white pointer-events-auto rounded-2xl shadow-xl border border-gray-200 w-80 sm:w-96 flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200" style={{ maxHeight: '600px', height: '70vh' }}>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shrink-0 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-tight">Financial AI</h3>
                                <div className="flex items-center gap-1 opacity-80">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                    <span className="text-[10px] font-medium">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-full transition"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm mb-1 ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>

                                {/* Tool Action: Journal Proposal Card */}
                                {msg.toolAction && msg.toolAction.tool_use === 'propose_journal_entry' && (
                                    <div className="max-w-[95%] bg-white border border-indigo-100 rounded-xl shadow-lg mt-2 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                        <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex justify-between items-center">
                                            <span className="text-xs font-bold text-indigo-700 uppercase">Proposed Adjustment</span>
                                            <span className="text-[10px] text-indigo-500">{msg.toolAction.journal_data.date}</span>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs font-medium text-gray-700 mb-2">{msg.toolAction.journal_data.description}</p>
                                            <div className="bg-gray-50 rounded border border-gray-200 text-[10px]">
                                                {msg.toolAction.journal_data.lines.map((line, i) => (
                                                    <div key={i} className="flex justify-between p-1.5 border-b border-gray-100 last:border-0">
                                                        <span className="text-gray-600 truncate flex-1 pr-2">{line.accountCode}</span>
                                                        <div className="flex gap-3 font-mono">
                                                            <span className={line.debit > 0 ? "text-gray-800" : "text-gray-300"}>{line.debit > 0 ? line.debit.toFixed(2) : '-'}</span>
                                                            <span className={line.credit > 0 ? "text-gray-800" : "text-gray-300"}>{line.credit > 0 ? line.credit.toFixed(2) : '-'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    onClick={() => handleApproveJournal(msg.toolAction.journal_data)}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition shadow-sm"
                                                >
                                                    <Sparkles size={12} /> Approve & Post
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition">
                            <input
                                className="flex-1 bg-transparent border-none outline-none text-sm"
                                placeholder="Ask about your finances or adjust books..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isThinking}
                                className={`p-1.5 rounded-full transition ${input.trim() ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'text-gray-300'}`}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                                <Sparkles size={10} /> Powered by Gemini 2.0 Flash
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group relative"
            >
                {isOpen ? (
                    <X size={24} />
                ) : (
                    <>
                        <MessageSquare size={24} />
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    </>
                )}
            </button>
        </div>
    );
};
export default AIAssistant;
