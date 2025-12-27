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
