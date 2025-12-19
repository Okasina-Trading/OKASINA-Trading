import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { downloadCSV } from '../utils/csvTemplate'; // Keeping downloadCSV only, template generation handles internally now
import { session } from '../supabase'; // Assuming session handling if needed, or removing if unused
import { supabase } from '../supabase';
import AdminLayout from '../components/admin/AdminLayout';
import SmartColumnMapper from '../components/admin/SmartColumnMapper';
import Papa from 'papaparse';

// Helper to generate a simple template
const generateSimpleTemplate = () => {
    return `SKU,Name,Category,Price,Stock,Color,Fabric,Sizes
ANK-001,Anarkali Red,Suits,2500,10,Red,Cotton,S;M;L
ANK-002,Blue Kurti,Kurtis,1200,5,Blue,Silk,Free Size`;
};

export default function StockManagerPage() {
    // Phase 1 States
    const [file, setFile] = useState(null);
    const [rawHeaders, setRawHeaders] = useState([]);
    const [rawData, setRawData] = useState([]);
    const [isMapping, setIsMapping] = useState(false);

    // Phase 2 States (Preview & Import)
    const [mappedData, setMappedData] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8," + encodeURI(generateSimpleTemplate());
        const link = document.createElement("a");
        link.setAttribute("href", csvContent);
        link.setAttribute("download", "okasina_simple_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setImportResult(null);
        setValidationErrors([]);
        setMappedData([]);
        setIsMapping(false);

        Papa.parse(uploadedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const headers = results.meta.fields || [];
                // Check if we need mapping (simple check: do we have 'sku' and 'name' exactly?)
                const hasCritical = headers.includes('sku') && headers.includes('name');

                setRawHeaders(headers);
                setRawData(results.data);

                if (!hasCritical) {
                    setIsMapping(true); // Trigger Mapper UI
                } else {
                    // Auto-mapped exact match
                    processMappedData(results.data, null);
                }
            },
            error: (error) => {
                alert('Error parsing CSV: ' + error.message);
                setFile(null);
            }
        });
    };

    const handleMappingConfirm = (mappingMap) => {
        // Transform rawData using mappingMap
        // map: { 'sku': 'Item Code', 'name': 'Title' ... }

        const transformed = rawData.map(row => {
            const newRow = {};
            // Copy mapped fields
            Object.entries(mappingMap).forEach(([systemKey, csvHeader]) => {
                if (csvHeader) {
                    newRow[systemKey] = row[csvHeader];
                }
            });
            // Keep original unmapped fields just in case? No, keep it clean.
            return newRow;
        });

        setIsMapping(false);
        processMappedData(transformed, mappingMap);
    };

    const processMappedData = (data, mappingUsed) => {
        setMappedData(data);
        validateData(data);
    };

    const validateData = (data) => {
        const errors = [];
        const seenSkus = new Set();

        data.forEach((row, index) => {
            const rowErrors = [];

            // Critical Fields for DRAFT creation
            if (!row.sku) rowErrors.push('SKU is missing');
            if (row.sku && seenSkus.has(row.sku)) rowErrors.push('Duplicate SKU in file');
            if (row.sku) seenSkus.add(row.sku);

            if (!row.name) rowErrors.push('Name is missing');

            // Relaxed validation for Phase 1 (Draft Mode)
            // We create drafts even if price/stock checks fail, we just flag them as issues?
            // User requested: "Ai checks for errors". So let's be strict enough to be useful.

            if (!row.selling_price || isNaN(parseFloat(row.selling_price))) {
                // Warning only? No, Price is usually critical for any listing.
                rowErrors.push('Invalid Price');
            }

            if (rowErrors.length > 0) {
                errors.push({
                    row: index + 2,
                    sku: row.sku || 'N/A',
                    errors: rowErrors
                });
            }
        });

        setValidationErrors(errors);
    };

    const handleImport = async () => {
        if (validationErrors.length > 0) {
            if (!confirm(`There are ${validationErrors.length} validation errors. These rows will be skipped. Continue?`)) {
                return;
            }
        }

        setImporting(true);

        try {
            // Create Bulk Job
            const { data: jobData, error: jobError } = await supabase
                .from('bulk_jobs')
                .insert({
                    type: 'smart_import',
                    status: 'running',
                    file_name: file.name,
                    total_rows: mappedData.length
                })
                .select()
                .single();

            if (jobError) throw jobError;

            let successCount = 0;
            let errorCount = 0;
            const errorDetails = [];

            // Process Rows
            for (let i = 0; i < mappedData.length; i++) {
                const row = mappedData[i];

                // Skip invalid
                if (validationErrors.some(e => e.row === i + 2)) {
                    errorCount++;
                    continue; // Skip this row
                }

                try {
                    // Logic: Create DRAFT product
                    const cleanPrice = parseFloat(row.selling_price) || 0;

                    const productData = {
                        sku: row.sku,
                        name: row.name,
                        category: row.category || 'Uncategorized',
                        description: row.description || '', // might be mapped
                        price: cleanPrice,
                        price_mur: cleanPrice, // Default assumption
                        stock_qty: parseInt(row.stock_qty) || 0,
                        fabric: row.fabric || null,
                        color: row.color || null,
                        status: 'draft', // FORCE DRAFT
                        sizes: row.sizes ? row.sizes.split(/[;,]/).map(s => s.trim()) : [], // Handle CSV lists
                        image_url: null // No image in Phase 1
                    };

                    // Insert or Update (Upsert by SKU)
                    // We need to check existence first to get ID for upsert?
                    // Or use upsert with onConflict clause if SKU has unique constraint

                    const { data: upsertData, error: upsertError } = await supabase
                        .from('products')
                        .upsert(productData, { onConflict: 'sku' })
                        .select()
                        .single();

                    if (upsertError) throw upsertError;

                    successCount++;
                } catch (error) {
                    errorCount++;
                    errorDetails.push({ row: i + 2, sku: row.sku, error: error.message });
                }
            }

            // Finish Job
            await supabase
                .from('bulk_jobs')
                .update({
                    status: 'done',
                    success_count: successCount,
                    error_count: errorCount,
                    error_details: errorDetails,
                    finished_at: new Date().toISOString()
                })
                .eq('id', jobData.id);

            setImportResult({
                success: true,
                total: mappedData.length,
                successCount,
                errorCount
            });

        } catch (error) {
            setImportResult({ success: false, error: error.message });
        } finally {
            setImporting(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Smart Product Import</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Step 1</span>
                            <span>Import List</span>
                            <ArrowRight size={14} />
                            <span>Map Columns</span>
                            <ArrowRight size={14} />
                            <span>Create Drafts</span>
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadTemplate}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                        <Download size={16} />
                        Download Sample Template
                    </button>
                </div>

                {/* Step 1: Upload */}
                {!file && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="mx-auto h-20 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                            <FileSpreadsheet size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Upload your Product List</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Upload any CSV file. We'll help you map your columns to our system so you don't have to reformat manually.
                        </p>
                        <label className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all transform hover:scale-105 cursor-pointer shadow-lg font-medium text-lg">
                            <Upload size={24} />
                            Select CSV File
                            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>
                )}

                {/* Step 2: Mapping */}
                {file && isMapping && (
                    <SmartColumnMapper
                        csvHeaders={rawHeaders}
                        onConfirm={handleMappingConfirm}
                        onCancel={() => setFile(null)}
                    />
                )}

                {/* Step 3: Preview & Import */}
                {file && !isMapping && (
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{file.name}</h4>
                                    <p className="text-sm text-gray-500">{mappedData.length} rows found</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setFile(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importing}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                                >
                                    {importing ? <Loader size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                    {importing ? 'Creating Drafts...' : 'Create Drafts'}
                                </button>
                            </div>
                        </div>

                        {/* Validation & Results */}
                        {validationErrors.length > 0 && !importResult && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                    <AlertCircle size={20} />
                                    Found {validationErrors.length} issues
                                </h4>
                                <p className="text-sm text-yellow-700 mb-4">
                                    These rows will be skipped during import. You can fix the CSV and re-upload, or continue to import valid rows.
                                </p>
                                <div className="max-h-60 overflow-y-auto bg-white rounded border border-yellow-100 p-2">
                                    {validationErrors.map((err, i) => (
                                        <div key={i} className="text-xs text-red-600 py-1 border-b border-gray-50 last:border-0">
                                            Row {err.row} (SKU: {err.sku}): {err.errors.join(', ')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {importResult && (
                            <div className={`p-6 rounded-lg border ${importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <h4 className={`font-bold text-lg mb-2 ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                    {importResult.success ? 'Drafts Created Successfully!' : 'Import Failed'}
                                </h4>
                                {importResult.success && (
                                    <p className="text-green-700">
                                        Imported {importResult.successCount} products as <strong>Drafts</strong>.
                                        {importResult.errorCount > 0 && ` (${importResult.errorCount} skipped due to errors)`}
                                    </p>
                                )}
                                {!importResult.success && <p className="text-red-700">{importResult.error}</p>}

                                <div className="mt-4">
                                    <button
                                        onClick={() => setFile(null)}
                                        className="text-sm underline font-medium"
                                    >
                                        Import Another File
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Data Preview */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">SKU</th>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Price</th>
                                        <th className="px-4 py-3">Stock</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {mappedData.slice(0, 10).map((row, i) => {
                                        const isInvalid = validationErrors.some(e => e.row === i + 2);
                                        return (
                                            <tr key={i} className={isInvalid ? 'bg-red-50 opacity-70' : ''}>
                                                <td className="px-4 py-3 font-mono text-xs">{row.sku}</td>
                                                <td className="px-4 py-3">{row.name}</td>
                                                <td className="px-4 py-3">{row.category}</td>
                                                <td className="px-4 py-3">{row.selling_price}</td>
                                                <td className="px-4 py-3">{row.stock_qty}</td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
                                                        Draft
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {mappedData.length > 10 && (
                                <div className="px-4 py-2 bg-gray-50 text-xs text-center text-gray-500">
                                    Showing 10 of {mappedData.length} records
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

