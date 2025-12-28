import React, { useState } from 'react';
import { MessageSquare, X, Send, Loader, AlertTriangle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function JarvisFeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('bug'); // bug, feature, feedback
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/jarvis/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    type,
                    url: window.location.href,
                    path: location.pathname,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send feedback');
            }

            setSent(true);
            setMessage('');
            setTimeout(() => {
                setSent(false);
                setIsOpen(false);
            }, 3000);

        } catch (err) {
            console.error('Feedback Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="hidden md:block fixed bottom-6 right-6 z-50 bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 group"
                aria-label="Report to JARVIS"
            >
                <div className="absolute -top-10 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Report to JARVIS
                </div>
                <MessageSquare className="w-6 h-6" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in-up">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <h3 className="font-bold font-mono text-sm">JARVIS REPORT SYSTEM</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="p-4">
                {sent ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Send size={24} />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">Received</h4>
                        <p className="text-sm text-gray-500">I have logged this report. Thank you.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                            {['bug', 'feature', 'other'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex-1 py-1 text-xs font-medium rounded-md capitalize transition-colors ${type === t
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Describe the issue or request..."
                                className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-xs text-red-600 flex items-start gap-1 bg-red-50 p-2 rounded">
                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] text-gray-400 font-mono">
                                Loc: {location.pathname}
                            </span>
                            <button
                                type="submit"
                                disabled={loading || !message.trim()}
                                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader size={14} className="animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        Transmit
                                        <Send size={14} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
