import React from 'react';
import { X } from 'lucide-react';

const SizeGuide = ({ isOpen, onClose, category = 'General' }) => {
    if (!isOpen) return null;

    const sizeCharts = {
        'Sarees': {
            description: 'Standard saree measurements',
            measurements: [
                { size: 'Free Size', length: '5.5-6.5m', blouse: '0.8m', note: 'One size fits all' }
            ]
        },
        'Suits': {
            description: 'Salwar Kameez size guide',
            measurements: [
                { size: 'XS', bust: '32"', waist: '26"', hip: '34"' },
                { size: 'S', bust: '34"', waist: '28"', hip: '36"' },
                { size: 'M', bust: '36"', waist: '30"', hip: '38"' },
                { size: 'L', bust: '38"', waist: '32"', hip: '40"' },
                { size: 'XL', bust: '40"', waist: '34"', hip: '42"' },
                { size: '2XL', bust: '42"', waist: '36"', hip: '44"' },
                { size: '3XL', bust: '44"', waist: '38"', hip: '46"' },
                { size: '4XL', bust: '46"', waist: '40"', hip: '48"' },
                { size: '5XL', bust: '48"', waist: '42"', hip: '50"' },
                { size: '6XL', bust: '50"', waist: '44"', hip: '52"' },
                { size: '7XL', bust: '52"', waist: '46"', hip: '54"' },
                { size: '8XL', bust: '54"', waist: '48"', hip: '56"' },
                { size: '9XL', bust: '56"', waist: '50"', hip: '58"' },
                { size: '10XL', bust: '58"', waist: '52"', hip: '60"' },
                { size: '11XL', bust: '60"', waist: '54"', hip: '62"' },
                { size: '12XL', bust: '62"', waist: '56"', hip: '64"' },
                { size: '13XL', bust: '64"', waist: '58"', hip: '66"' }
            ]
        },
        'Kurtis': {
            description: 'Kurti size guide',
            measurements: [
                { size: 'XS', bust: '32"', length: '42-44"', shoulder: '14"' },
                { size: 'S', bust: '34"', length: '42-44"', shoulder: '14.5"' },
                { size: 'M', bust: '36"', length: '44-46"', shoulder: '15"' },
                { size: 'L', bust: '38"', length: '44-46"', shoulder: '15.5"' },
                { size: 'XL', bust: '40"', length: '46-48"', shoulder: '16"' },
                { size: '2XL', bust: '42"', length: '46-48"', shoulder: '16.5"' },
                { size: '3XL', bust: '44"', length: '48+"', shoulder: '17"' },
                { size: '4XL', bust: '46"', length: '48+"', shoulder: '17.5"' },
                { size: '5XL', bust: '48"', length: '48+"', shoulder: '18"' },
                { size: '6XL', bust: '50"', length: '48+"', shoulder: '18.5"' },
                { size: '7XL', bust: '52"', length: '48+"', shoulder: '19"' },
                { size: '8XL', bust: '54"', length: '48+"', shoulder: '19.5"' },
                { size: '9XL', bust: '56"', length: '48+"', shoulder: '20"' },
                { size: '10XL', bust: '58"', length: '48+"', shoulder: '20.5"' },
                { size: '11XL', bust: '60"', length: '48+"', shoulder: '21"' },
                { size: '12XL', bust: '62"', length: '48+"', shoulder: '21.5"' },
                { size: '13XL', bust: '64"', length: '48+"', shoulder: '22"' }
            ]
        },
        'Lehengas': {
            description: 'Lehenga size guide',
            measurements: [
                { size: 'XS', waist: '26"', length: '40-42"', hip: '34"' },
                { size: 'S', waist: '28"', length: '40-42"', hip: '36"' },
                { size: 'M', waist: '30"', length: '42-44"', hip: '38"' },
                { size: 'L', waist: '32"', length: '42-44"', hip: '40"' },
                { size: 'XL', waist: '34"', length: '44-46"', hip: '42"' },
                { size: '2XL', waist: '36"', length: '44-46"', hip: '44"' },
                { size: '3XL', waist: '38"', length: '46+"', hip: '46"' },
                { size: '4XL', waist: '40"', length: '46+"', hip: '48"' },
                { size: '5XL', waist: '42"', length: '46+"', hip: '50"' },
                { size: '6XL', waist: '44"', length: '46+"', hip: '52"' },
                { size: '7XL', waist: '46"', length: '46+"', hip: '54"' },
                { size: '8XL', waist: '48"', length: '46+"', hip: '56"' },
                { size: '9XL', waist: '50"', length: '46+"', hip: '58"' },
                { size: '10XL', waist: '52"', length: '46+"', hip: '60"' },
                { size: '11XL', waist: '54"', length: '46+"', hip: '62"' },
                { size: '12XL', waist: '56"', length: '46+"', hip: '64"' },
                { size: '13XL', waist: '58"', length: '46+"', hip: '66"' }
            ]
        },
        'General': {
            description: 'General size guide',
            measurements: [
                { size: 'XS', bust: '32"', waist: '26"', hip: '34"' },
                { size: 'S', bust: '34"', waist: '28"', hip: '36"' },
                { size: 'M', bust: '36"', waist: '30"', hip: '38"' },
                { size: 'L', bust: '38"', waist: '32"', hip: '40"' },
                { size: 'XL', bust: '40"', waist: '34"', hip: '42"' },
                { size: '2XL', bust: '42"', waist: '36"', hip: '44"' },
                { size: '3XL', bust: '44"', waist: '38"', hip: '46"' },
                { size: '4XL', bust: '46"', waist: '40"', hip: '48"' },
                { size: '5XL', bust: '48"', waist: '42"', hip: '50"' },
                { size: '6XL', bust: '50"', waist: '44"', hip: '52"' },
                { size: '7XL', bust: '52"', waist: '46"', hip: '54"' },
                { size: '8XL', bust: '54"', waist: '48"', hip: '56"' },
                { size: '9XL', bust: '56"', waist: '50"', hip: '58"' },
                { size: '10XL', bust: '58"', waist: '52"', hip: '60"' },
                { size: '11XL', bust: '60"', waist: '54"', hip: '62"' },
                { size: '12XL', bust: '62"', waist: '56"', hip: '64"' },
                { size: '13XL', bust: '64"', waist: '58"', hip: '66"' }
            ]
        }
    };

    const chart = sizeCharts[category] || sizeCharts['General'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Panel - Flex Column for Perfect Scroll */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header (fixed) */}
                <div className="flex-none border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Size Guide</h2>
                        <p className="text-xs text-gray-500 mt-1">{category} Measurement Chart</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                        aria-label="Close size guide"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50">

                    {/* Category Intro */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-blue-900">{chart.description}</p>
                                <p className="text-sm text-blue-700 mt-1">We cater for inclusive sizing up to 13 XL</p>
                            </div>
                        </div>
                    </div>

                    {/* Size Table */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-100 z-10">
                                            Size
                                        </th>
                                        {Object.keys(chart.measurements[0])
                                            .filter(key => key !== 'size')
                                            .map(key => (
                                                <th key={key} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider capitalize">
                                                    {key}
                                                </th>
                                            ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {chart.measurements.map((measurement, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                {measurement.size}
                                            </td>
                                            {Object.entries(measurement)
                                                .filter(([key]) => key !== 'size')
                                                .map(([key, value]) => (
                                                    <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                        {value}
                                                    </td>
                                                ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Measurement Guide Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border rounded-xl p-5 shadow-sm">
                            <h4 className="font-bold text-gray-900 mb-4 border-b pb-2">How to Measure</h4>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex gap-3">
                                    <span className="font-bold text-gray-900 min-w-[60px]">Bust:</span>
                                    <span>Measure around the fullest part of your bust</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-gray-900 min-w-[60px]">Waist:</span>
                                    <span>Measure around the narrowest part of your waist</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-gray-900 min-w-[60px]">Hip:</span>
                                    <span>Measure around the fullest part of your hips</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-gray-900 min-w-[60px]">Length:</span>
                                    <span>Measure from shoulder to desired hem length</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5 shadow-sm">
                            <h4 className="font-bold text-yellow-900 mb-4 border-b border-yellow-200 pb-2">Pro Fit Tips</h4>
                            <ul className="space-y-2 text-sm text-yellow-800 list-disc list-inside">
                                <li>All measurements are in <span className="font-bold">inches</span></li>
                                <li>If you are between sizes, <strong>size up</strong> for comfort</li>
                                <li>Need custom fitting? Contact us via WhatsApp</li>
                                <li>Allow ±1-2 inches for manual variations</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SizeGuide;
