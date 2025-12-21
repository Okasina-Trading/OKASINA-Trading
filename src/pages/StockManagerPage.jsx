import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { supabase } from '../supabase';
import { useToast } from '../contexts/ToastContext';
import AdminLayout from '../components/admin/AdminLayout';
import SmartColumnMapper from '../components/admin/SmartColumnMapper';
import Papa from 'papaparse';

// Helper to generate a simple template
const generateSimpleTemplate = () => {
    return `SKU,Name,Category,Price,Stock,Color,Fabric,Sizes
ANK-001,Anarkali Red,Suits,2500,10,Red,Cotton,S:5;M:3;L:2
ANK-002,Blue Kurti,Kurtis,1200,5,Blue,Silk,Free Size:5`;
};

export default function StockManagerPage() {
    const { addToast } = useToast();
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
                        image_url: null // No image in Phase 1
                    };

                    // Parse Variants (Size:Stock)
                    if (row.sizes) {
                        const rawSizes = row.sizes.split(/[;,]/).map(s => s.trim()).filter(s => s);
                        const variants = [];
                        let totalStock = 0;
                        let simpleSizes = [];

                        rawSizes.forEach(entry => {
                            // Try to match "Size:Qty" format
                            const match = entry.match(/^(.+?):(\d+)$/);
                            if (match) {
                                const size = match[1].trim();
                                const qty = parseInt(match[2], 10);
                                variants.push({ size, stock: qty });
                                totalStock += qty;
                                simpleSizes.push(size);
                            } else {
                                // Fallback: Simple size string, assume 0 stock or use global? 
                                // For mixed mode, we'll just add the size with 0 stock
                                simpleSizes.push(entry);
                                variants.push({ size: entry, stock: 0 }); // Default to 0 for specific size if not specified
                            }
                        });

                        productData.sizes = simpleSizes;
                        productData.variants = variants;

                        // If we found variants with stock, override the CSV stock column (optional?)
                        // User might providing global stock AND variants. 
                        // Let's trust variants sum if > 0, otherwise fallback to row.stock_qty
                        if (totalStock > 0) {
                            productData.stock_qty = totalStock;
                        }
                    } else {
                        productData.sizes = [];
                        productData.variants = [];
                    }

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
                    <div className="flex flex-col items-end">
                        <button
                            onClick={handleDownloadTemplate}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium"
                        >
                            <Download size={16} />
                            Download Sample Template
                        </button>
                        <span className="text-[10px] text-gray-400 mt-1">
                            Supports <code className="bg-gray-100 px-1 rounded">Size:Qty</code> (e.g. S:5; M:2)
                        </span>
                    </div>
                </div>

                {/* Step 1: Upload */}
                {!file && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Option 1: CSV Upload */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:border-blue-300 transition-colors">
                            <div className="mx-auto h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                <FileSpreadsheet size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload CSV</h3>
                            <p className="text-gray-500 mb-6 text-sm">
                                Standard bulk import using a CSV file.
                            </p>
                            <label className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all cursor-pointer shadow-md font-medium">
                                <Upload size={20} />
                                Select CSV
                                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>

                        {/* Option 2: AI Magic Scanner */}
                        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-sm border border-purple-200 p-8 text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 bg-purple-600 text-white text-xs font-bold rounded-bl-lg">
                                NEW
                            </div>
                            <div className="mx-auto h-16 w-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-purple-900 mb-2">AI Magic Scanner</h3>
                            <p className="text-purple-700 mb-6 text-sm">
                                Upload images and let AI auto-extract details.
                            </p>
                            <label className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all cursor-pointer shadow-md font-medium">
                                <Sparkles size={20} />
                                Scan Images
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const files = Array.from(e.target.files);
                                        if (files.length === 0) return;

                                        if (!confirm(`Scan ${files.length} images? This will analyze them with AI.`)) return;

                                        const newRows = [];

                                        for (const file of files) {
                                            try {
                                                addToast(`Scanning ${file.name}...`, 'info');

                                                // 1. Get Signature & Upload
                                                const signRes = await fetch('/api/sign-upload');
                                                if (!signRes.ok) throw new Error('Signature failed');
                                                const signData = await signRes.json();

                                                const formData = new FormData();
                                                formData.append('file', file);
                                                formData.append('api_key', signData.api_key);
                                                formData.append('timestamp', signData.timestamp);
                                                formData.append('signature', signData.signature);
                                                formData.append('upload_preset', 'okasina_products');

                                                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`, {
                                                    method: 'POST', body: formData
                                                });
                                                const uploadData = await uploadRes.json();
                                                const imageUrl = uploadData.secure_url;

                                                // 2. Analyze
                                                const aiRes = await fetch('/api/analyze-product-image', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ imageUrl })
                                                });
                                                const aiData = await aiRes.json();

                                                if (aiData.success) {
                                                    const p = aiData.product;
                                                    newRows.push({
                                                        sku: p.sku_suggestion || `AI-${Date.now()}-${Math.floor(Math.random() * 100)}`,
                                                        name: p.name || 'Unknown Product',
                                                        category: p.category || 'Uncategorized',
                                                        selling_price: p.price || 0,
                                                        stock_qty: 10, // Default stock
                                                        sizes: p.sizes || 'Free Size',
                                                        color: p.color || '',
                                                        fabric: p.fabric || '',
                                                        image_url: imageUrl
                                                    });
                                                    addToast(`scanned: ${p.name}`, 'success');
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                addToast(`Error scanning ${file.name}`, 'error');
                                            }
                                        }

                                        // Set data as if it came from CSV
                                        setRawHeaders(['sku', 'name', 'category', 'selling_price', 'stock_qty', 'sizes', 'color', 'fabric', 'image_url']);
                                        setMappedData(newRows);
                                        setFile({ name: `AI Scan (${files.length} images)` }); // Fake file to trigger "Step 3"
                                        setIsMapping(false); // Skip mapping
                                    }}
                                />
                            </label>
                        </div>
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
                            {mappedData.length > 10 && (
                                <div className="px-4 py-2 bg-gray-50 text-xs text-center text-gray-500">
                                    Showing 10 of {mappedData.length} records
                                </div>
                            )}
                        </div>

                        {/* Step 4: Bulk Image Upload (Post-Import) */}
                        {importResult?.success && (
                            <div className="mt-8 bg-white rounded-xl shadow-sm border border-blue-100 p-8">
                                <h3 className="text-xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Sparkles className="text-blue-600" size={24} />
                                    Bulk Image Import
                                </h3>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <h4 className="font-bold text-blue-900 mb-2">How to Bulk Upload Images</h4>
                                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                        <li>Naming Convention: <strong>Name your image files exactly as the SKU.</strong></li>
                                        <li>Example: If SKU is <code className="bg-blue-100 px-1 rounded">ANK-001</code>, name the file <code className="bg-blue-100 px-1 rounded">ANK-001.jpg</code> or <code className="bg-blue-100 px-1 rounded">ANK-001.png</code>.</li>
                                        <li>We will automatically find the product and attach the image.</li>
                                        <li>Supported formats: JPG, PNG, WEBP.</li>
                                    </ul>
                                </div>

                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const files = Array.from(e.target.files);
                                            if (files.length === 0) return;

                                            const confirmUpload = confirm(`Found ${files.length} images. Ready to match and upload?`);
                                            if (!confirmUpload) return;

                                            let matchedCount = 0;
                                            let uploadedCount = 0;
                                            const errors = [];

                                            // Determine targets (use mappedData SKUs)
                                            // Create a map of SKU -> ProductID (if we have it? We might only have drafts with no IDs yet if we didn't fetch back)
                                            // Actually, the import result didn't return IDs for all rows, only count.
                                            // We should query the DB for these SKUs to get their IDs.

                                            // 1. Get SKUs from current list
                                            const skus = mappedData.map(r => r.sku);

                                            addToast('Matching SKUs...', 'info'); // Assuming we have toast, if not console
                                            console.log('Fetching IDs for SKUs:', skus.length);

                                            const { data: productsInDb, error: fetchErr } = await supabase
                                                .from('products')
                                                .select('id, sku')
                                                .in('sku', skus);

                                            if (fetchErr) {
                                                alert('Error fetching product IDs: ' + fetchErr.message);
                                                return;
                                            }

                                            const skuMap = {};
                                            productsInDb.forEach(p => skuMap[p.sku.toLowerCase()] = p.id);

                                            // 2. Process Files
                                            for (const file of files) {
                                                // Extract SKU from filename (remove extension)
                                                // e.g. "ANK-001.jpg" -> "ANK-001"
                                                const fileNameNoExt = file.name.substring(0, file.name.lastIndexOf('.')).toLowerCase();
                                                const targetId = skuMap[fileNameNoExt];

                                                if (targetId) {
                                                    matchedCount++;
                                                    // Upload
                                                    try {
                                                        // 1. Get Signature
                                                        const signRes = await fetch('/api/sign-upload');
                                                        if (!signRes.ok) throw new Error('Failed to get upload signature');
                                                        const signData = await signRes.json();

                                                        // 2. Upload to Cloudinary
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        formData.append('api_key', signData.api_key);
                                                        formData.append('timestamp', signData.timestamp);
                                                        formData.append('signature', signData.signature);
                                                        formData.append('upload_preset', 'okasina_products');

                                                        const response = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`, {
                                                            method: 'POST',
                                                            body: formData
                                                        });

                                                        const data = await response.json();
                                                        if (data.secure_url) {
                                                            // Update Product
                                                            await supabase
                                                                .from('products')
                                                                .update({ image_url: data.secure_url })
                                                                .eq('id', targetId);

                                                            uploadedCount++;
                                                        }
                                                    } catch (err) {
                                                        errors.push(`${file.name}: Upload failed`);
                                                    }
                                                } else {
                                                    errors.push(`${file.name}: No matching SKU found`);
                                                }
                                            }

                                            alert(`Process Complete!\nMatched Files: ${matchedCount}\nUploaded: ${uploadedCount}\nErrors: ${errors.length}`);
                                            if (errors.length > 0) {
                                                console.warn("Image Upload Errors:", errors);
                                            }
                                        }}
                                        className="hidden"
                                        id="bulk-image-input"
                                    />
                                    <label htmlFor="bulk-image-input" className="cursor-pointer flex flex-col items-center">
                                        <div className="bg-black text-white p-4 rounded-full mb-4 shadow-lg hover:scale-110 transition-transform">
                                            <Upload size={24} />
                                        </div>
                                        <span className="text-lg font-bold text-gray-900">Select Images</span>
                                        <span className="text-sm text-gray-500">Select all your product images at once</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

