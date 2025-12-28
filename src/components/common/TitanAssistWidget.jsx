import React, { useState } from 'react';
import { MessageCircle, X, Phone, Mail } from 'lucide-react';

export default function TitanAssistWidget() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-4 left-4 z-[9999] print:hidden">
            {/* Main Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-3 rounded-full shadow-lg hover:bg-gray-800 transition-all transform hover:scale-105"
                >
                    <MessageCircle size={20} />
                    <span className="font-medium text-sm">Need Help?</span>
                </button>
            )}

            {/* Assistance Modal */}
            {isOpen && (
                <div className="bg-white rounded-lg shadow-2xl p-6 w-[90vw] max-w-sm border border-gray-100 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-serif font-bold text-xl text-gray-900">White Glove Support</h3>
                            <p className="text-sm text-gray-500 mt-1">Stuck? Let us assist you personally.</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <a
                            href="tel:+23057556565"
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-purple-50 transition-colors group border border-transparent hover:border-purple-100"
                        >
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <Phone size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Call Us Directly</p>
                                <p className="text-sm text-purple-600 font-medium">+230 5755 6565</p>
                            </div>
                        </a>

                        <a
                            href="mailto:info@okasinatrading.com"
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-pink-50 transition-colors group border border-transparent hover:border-pink-100"
                        >
                            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                                <Mail size={20} className="text-pink-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Email Support</p>
                                <p className="text-sm text-pink-600 font-medium">info@okasinatrading.com</p>
                            </div>
                        </a>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">
                            Available Mon-Sat: 9am - 6pm
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
