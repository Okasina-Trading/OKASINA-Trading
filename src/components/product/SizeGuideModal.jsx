import React from 'react';
import { X } from 'lucide-react';

export default function SizeGuideModal({ isOpen, onClose, category }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-serif font-bold mb-2 text-center">Size Guide</h2>
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
                                <tr className="bg-white border-b">
                                    <td className="px-6 py-4 font-medium text-gray-900">XS</td>
                                    <td className="px-6 py-4">80-84</td>
                                    <td className="px-6 py-4">60-64</td>
                                    <td className="px-6 py-4">86-90</td>
                                </tr>
                                <tr className="bg-white border-b">
                                    <td className="px-6 py-4 font-medium text-gray-900">S</td>
                                    <td className="px-6 py-4">84-88</td>
                                    <td className="px-6 py-4">64-68</td>
                                    <td className="px-6 py-4">90-94</td>
                                </tr>
                                <tr className="bg-white border-b">
                                    <td className="px-6 py-4 font-medium text-gray-900">M</td>
                                    <td className="px-6 py-4">88-92</td>
                                    <td className="px-6 py-4">68-72</td>
                                    <td className="px-6 py-4">94-98</td>
                                </tr>
                                <tr className="bg-white border-b">
                                    <td className="px-6 py-4 font-medium text-gray-900">L</td>
                                    <td className="px-6 py-4">92-96</td>
                                    <td className="px-6 py-4">72-76</td>
                                    <td className="px-6 py-4">98-102</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-6 py-4 font-medium text-gray-900">XL</td>
                                    <td className="px-6 py-4">96-100</td>
                                    <td className="px-6 py-4">76-80</td>
                                    <td className="px-6 py-4">102-106</td>
                                </tr>
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
