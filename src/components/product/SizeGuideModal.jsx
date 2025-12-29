import React from 'react';
import { X } from 'lucide-react';

export default function SizeGuideModal({ isOpen, onClose, category }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            {/* Backdrop click handler if needed, or just allow closing via X */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 z-10">
                {/* Fixed Header */}
                <div className="flex-none flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-xl font-serif font-bold text-gray-900">Size Guide</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                    <p className="text-center text-gray-600 mb-6 font-medium">We cater for clothes upto 13 XL</p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Size</th>
                                    <th className="px-6 py-3">Bust (cm)</th>
                                    <th className="px-6 py-3">Waist (cm)</th>
                                    <th className="px-6 py-3">Hips (cm)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', '10XL', '11XL', '12XL', '13XL'].map((size, index) => {
                                    const bustStart = 80 + (index * 4);
                                    const waistStart = 60 + (index * 4);
                                    const hipsStart = 86 + (index * 4);

                                    return (
                                        <tr key={size} className={index % 2 === 0 ? 'bg-white border-b' : 'bg-gray-50 border-b'}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{size}</td>
                                            <td className="px-6 py-4">{bustStart}-{bustStart + 4}</td>
                                            <td className="px-6 py-4">{waistStart}-{waistStart + 4}</td>
                                            <td className="px-6 py-4">{hipsStart}-{hipsStart + 4}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 text-sm text-gray-500">
                        <p className="font-bold mb-2">How to Measure:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Bust:</strong> Measure around the fullest part of your bust.</li>
                            <li><strong>Waist:</strong> Measure around your natural waistline.</li>
                            <li><strong>Hips:</strong> Measure around the fullest part of your hips.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
