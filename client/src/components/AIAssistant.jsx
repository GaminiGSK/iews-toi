import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Minimize2 } from 'lucide-react';

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I am your Financial AI Assistant. Ask me about your transactions, account codes, or documents.' }
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

        // TODO: Antigravity Agent i52 - Implement RAG Pipeline here
        // 1. Send `input` to Backend API
        // 2. Backend queries MongoDB (Transactions, Profiles)
        // 3. Backend queries Vector DB / Google Drive
        // 4. Return natural language answer

        // Mock Response for now
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: "I am ready to be connected to the brain! (Logic to be implemented by Agent i52)"
            }]);
            setIsThinking(false);
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 flex items-center gap-2 animate-bounce-subtle"
                    title="Open AI Assistant"
                >
                    <Bot size={24} />
                    <span className="font-bold pr-1">Ask AI</span>
                </button>
            )}

            {/* Chat Sidebar / Panel */}
            {isOpen && (
                <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl flex flex-col border-l border-gray-200 animate-slide-in-right">

                    {/* Header */}
                    <div className="h-16 bg-indigo-600 text-white flex items-center justify-between px-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Financial AI</h3>
                                <p className="text-[10px] text-indigo-200">Powered by Gemini & MongoDB</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/20 rounded-full transition"
                        >
                            <Minimize2 size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    max-w-[85%] rounded-2xl p-3 text-sm shadow-sm
                                    ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}
                                `}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2 text-xs">
                                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                                    Reviewing documents...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ask about transaction sums, codes, or files..."
                                className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl px-4 py-3 text-sm resize-none pr-10 focus:ring-2 focus:ring-indigo-100 transition outline-none max-h-32"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isThinking}
                                className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-gray-400 mt-2">
                            AI agent i52 integration pending.
                        </p>
                    </div>
                </div>
            )}
        </div >
    );
}

// Simple animation via Tailwind arbitrary values in CSS usually, but here we assume standard configured utilities.
// If 'animate-slide-in-right' is missing, it will just appear.
