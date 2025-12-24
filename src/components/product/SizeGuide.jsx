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
                { size: 'XXL', bust: '42"', waist: '36"', hip: '44"' }
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
                { size: 'XXL', bust: '42"', length: '46-48"', shoulder: '16.5"' }
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
                { size: 'XXL', waist: '36"', length: '44-46"', hip: '44"' }
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
                { size: 'XXL', bust: '42"', waist: '36"', hip: '44"' }
            ]
        }
    };

    const chart = sizeCharts[category] || sizeCharts['General'];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                <div
                    className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Size Guide</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Category Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {category} Size Chart
                            </h3>
                            <p className="text-sm text-gray-600">{chart.description}</p>
                            <p className="text-sm font-medium text-blue-600 mt-1">We cater for clothes upto 13 XL</p>
                        </div>

                        {/* Size Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                                            Size
                                        </th>
                                        {Object.keys(chart.measurements[0])
                                            .filter(key => key !== 'size')
                                            .map(key => (
                                                <th key={key} className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b capitalize">
                                                    {key}
                                                </th>
                                            ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {chart.measurements.map((measurement, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">
                                                {measurement.size}
                                            </td>
                                            {Object.entries(measurement)
                                                .filter(([key]) => key !== 'size')
                                                .map(([key, value]) => (
                                                    <td key={key} className="px-4 py-3 text-sm text-gray-600 border-b">
                                                        {value}
                                                    </td>
                                                ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Measurement Guide */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">How to Measure</h4>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start">
                                    <span className="font-medium mr-2">Bust:</span>
                                    <span>Measure around the fullest part of your bust</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-medium mr-2">Waist:</span>
                                    <span>Measure around the narrowest part of your waist</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-medium mr-2">Hip:</span>
                                    <span>Measure around the fullest part of your hips</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-medium mr-2">Length:</span>
                                    <span>Measure from shoulder to desired hem length</span>
                                </li>
                            </ul>
                        </div>

                        {/* Tips */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Fit Tips</h4>
                            <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                                <li>Measurements are in inches</li>
                                <li>If between sizes, we recommend sizing up</li>
                                <li>For custom sizing, please contact us</li>
                                <li>Allow 1-2 inches variation due to manual measurement</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SizeGuide;
