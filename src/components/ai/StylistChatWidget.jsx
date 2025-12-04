import React, { useRef, useEffect } from 'react';
import { useStylistChat } from '../../hooks/useStylistChat';
import { MessageCircle, X, Send, Sparkles, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const StylistChatWidget = () => {
    const {
        messages,
        isLoading,
        isOpen,
        hasUnread,
        toggleChat,
        sendMessage,
        clearChat
    } = useStylistChat();

    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const text = inputRef.current.value;
        if (text.trim()) {
            sendMessage(text);
            inputRef.current.value = '';
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white w-[350px] h-[500px] rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden border border-gray-100 animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-black text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1.5 rounded-full">
                                <Sparkles size={16} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">AI Stylist</h3>
                                <p className="text-[10px] text-gray-300">Powered by Gemini</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={clearChat} className="text-xs text-gray-400 hover:text-white transition-colors">
                                Clear
                            </button>
                            <button onClick={toggleChat} className="text-gray-300 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                            ? 'bg-black text-white rounded-br-none'
                                            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.text}</p>

                                    {/* Product Suggestions */}
                                    {msg.suggestedProductIds && msg.suggestedProductIds.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Suggested For You</p>
                                            <div className="space-y-2">
                                                {msg.suggestedProductIds.map(pid => (
                                                    <Link
                                                        key={pid}
                                                        to={`/product/${pid}`}
                                                        className="block bg-gray-50 hover:bg-gray-100 p-2 rounded flex items-center gap-2 transition-colors"
                                                    >
                                                        <div className="bg-white p-1 rounded border border-gray-200">
                                                            <ShoppingBag size={12} className="text-black" />
                                                        </div>
                                                        <span className="text-xs font-medium text-blue-600 hover:underline">
                                                            View Product
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Ask for outfit advice..."
                            className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-black focus:bg-white transition-all"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-black text-white p-2 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={toggleChat}
                className="group relative bg-black hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
            >
                {isOpen ? (
                    <X size={24} />
                ) : (
                    <>
                        <MessageCircle size={24} />
                        {hasUnread && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </>
                )}

                {/* Tooltip */}
                {!isOpen && (
                    <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-black px-3 py-1 rounded-lg text-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Chat with AI Stylist
                    </span>
                )}
            </button>
        </div>
    );
};

export default StylistChatWidget;
