
import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, AlertCircle } from 'lucide-react';

// The system's required internal field names
const SYSTEM_FIELDS = [
    { key: 'sku', label: 'SKU (Unique ID)', required: true, aliases: ['sku', 'id', 'code', 'item no', 'product code', 'ref'] },
    { key: 'name', label: 'Product Name', required: true, aliases: ['name', 'title', 'product name', 'description', 'item'] },
    { key: 'category', label: 'Category', required: true, aliases: ['category', 'cat', 'department', 'group'] },
    { key: 'selling_price', label: 'Selling Price', required: true, aliases: ['price', 'selling price', 'mrp', 'cost', 'amount'] },
    { key: 'stock_qty', label: 'Total Stock', required: false, aliases: ['stock', 'qty', 'quantity', 'inventory', 'count'] },
    { key: 'sizes', label: 'Sizes', required: false, aliases: ['size', 'sizes', 'variant'] },
    { key: 'color', label: 'Color', required: false, aliases: ['color', 'colour', 'shade'] },
    { key: 'fabric', label: 'Fabric/Material', required: false, aliases: ['fabric', 'material', 'comp'] }
];

export default function SmartColumnMapper({ csvHeaders, onConfirm, onCancel }) {
    const [mapping, setMapping] = useState({});
    const [touched, setTouched] = useState(false);

    // Auto-map on load
    useEffect(() => {
        const initialMapping = {};
        const lowerHeaders = csvHeaders.map(h => h.toLowerCase().trim());

        SYSTEM_FIELDS.forEach(field => {
            // 1. Exact match
            if (lowerHeaders.includes(field.key)) {
                const exact = csvHeaders.find(h => h.toLowerCase().trim() === field.key);
                initialMapping[field.key] = exact;
                return;
            }

            // 2. Alias match
            const foundAlias = field.aliases.find(alias =>
                lowerHeaders.some(h => h.includes(alias))
            );
            if (foundAlias) {
                // Find the actual original header that matched the alias
                const match = csvHeaders.find(h => h.toLowerCase().includes(foundAlias));
                if (match) initialMapping[field.key] = match;
            }
        });

        setMapping(initialMapping);
    }, [csvHeaders]);

    const handleMapChange = (systemKey, value) => {
        setMapping(prev => ({
            ...prev,
            [systemKey]: value
        }));
        setTouched(true);
    };

    const getMissingRequired = () => {
        return SYSTEM_FIELDS
            .filter(f => f.required && !mapping[f.key])
            .map(f => f.label);
    };

    const handleConfirm = () => {
        const missing = getMissingRequired();
        if (missing.length > 0) {
            alert(`Please map the following required fields: ${missing.join(', ')}`);
            return;
        }
        onConfirm(mapping);
    };

    const missingFields = getMissingRequired();

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-4xl mx-auto my-8">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Map Your Columns</h3>
                <p className="text-gray-600">
                    We found <strong>{csvHeaders.length} columns</strong> in your file.
                    Please confirm which columns match our system fields.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {SYSTEM_FIELDS.map(field => {
                    const isMapped = !!mapping[field.key];

                    return (
                        <div key={field.key} className="flex flex-col">
                            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                                <span className="flex items-center gap-2">
                                    {field.label}
                                    {field.required && <span className="text-red-500">*</span>}
                                </span>
                                {isMapped && <Check size={16} className="text-green-600" />}
                            </label>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <select
                                        value={mapping[field.key] || ''}
                                        onChange={(e) => handleMapChange(field.key, e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 outline-none
                                            ${!isMapped && field.required ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                                        `}
                                    >
                                        <option value="">-- Select Column --</option>
                                        {csvHeaders.map(header => (
                                            <option key={header} value={header}>
                                                {header}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <ArrowRight size={16} className="text-gray-400" />
                                <div className="w-1/3 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded border border-gray-200 truncate">
                                    {field.key}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {missingFields.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-yellow-800">
                        <strong>Missing Required Fields:</strong> {missingFields.join(', ')}
                    </div>
                </div>
            )}

            <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-100">
                <button
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                    Cancel Import
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={missingFields.length > 0}
                    className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    Confirm Mapping
                </button>
            </div>
        </div>
    );
}
