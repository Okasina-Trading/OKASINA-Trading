import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Upload, Download, Image as ImageIcon, CheckCircle, AlertCircle, Loader, Folder } from 'lucide-react';
import { supabase } from '../../supabase';
import { downloadCSV } from '../../utils/csvTemplate';

export default function MediaManagerPage() {
    const [uploading, setUploading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState(null);

    // Handle file selection
    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setError(null);
        setUploadProgress({ current: 0, total: files.length });

        const results = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setUploadProgress({ current: i + 1, total: files.length });

            try {
                // Extract SKU from filename (e.g., "ANK-002-1.jpg" -> "ANK-002")
                const filename = file.name;
                const skuMatch = filename.match(/^([A-Z0-9-]+)/i);
                const sku = skuMatch ? skuMatch[1] : 'UNKNOWN';

                // Upload to Cloudinary via our backend (Auto-Enhanced!)
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('http://localhost:3001/api/upload-image', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Upload failed');

                const data = await response.json();

                results.push({
                    sku,
                    filename,
                    path: data.public_id,
                    url: data.url, // This is the AI Enhanced URL
                    size: file.size,
                    type: file.type
                });

            } catch (err) {
                console.error(`Error uploading ${file.name}:`, err);
                results.push({
                    sku: 'ERROR',
                    filename: file.name,
                    error: err.message
                });
            }
        }

        setUploadedImages(results);
        setUploading(false);
    };

    // Generate CSV with image URLs
    const handleDownloadCSV = () => {
        // Group images by SKU
        const groupedBySKU = {};
        let maxImages = 0;

        uploadedImages.forEach(img => {
            if (img.error) return; // Skip errors

            // Use filename as SKU if detection failed or returned UNKNOWN
            const skuKey = (img.sku === 'UNKNOWN' || !img.sku) ? img.filename : img.sku;

            if (!groupedBySKU[skuKey]) {
                groupedBySKU[skuKey] = [];
            }
            groupedBySKU[skuKey].push(img.url);

            // Track max images for dynamic headers
            maxImages = Math.max(maxImages, groupedBySKU[skuKey].length);
        });

        // Generate dynamic headers based on max images found
        const imageHeaders = Array.from({ length: maxImages }, (_, i) => `image_url_${i + 1}`);
        const headers = ['sku', ...imageHeaders];
        const rows = [headers.join(',')];

        Object.entries(groupedBySKU).forEach(([sku, urls]) => {
            const row = [sku, ...urls];
            rows.push(row.join(','));
        });

        const csvContent = rows.join('\n');
        downloadCSV(csvContent, 'product_images_urls.csv');
    };

    const successCount = uploadedImages.filter(img => !img.error).length;
    const errorCount = uploadedImages.filter(img => img.error).length;

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Media Manager</h2>
                    <p className="text-gray-600">Bulk upload product images and generate CSV with URLs</p>
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload size={32} className="text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Product Images</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Name your files with SKU prefix (e.g., <code className="bg-gray-100 px-2 py-1 rounded">ANK-002-1.jpg</code>, <code className="bg-gray-100 px-2 py-1 rounded">ANK-002-2.jpg</code>)
                            </p>
                        </div>

                        <label className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer shadow-lg hover:shadow-xl">
                            <Folder size={24} />
                            <span className="font-bold text-lg">Select Images</span>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={uploading}
                            />
                        </label>

                        {uploading && (
                            <div className="mt-6">
                                <div className="flex items-center justify-center gap-3 text-blue-600 mb-2">
                                    <Loader size={20} className="animate-spin" />
                                    <span className="font-medium">
                                        Uploading {uploadProgress.current} of {uploadProgress.total}...
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results */}
                {uploadedImages.length > 0 && (
                    <>
                        {/* Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle size={24} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase tracking-wider">Uploaded</p>
                                        <p className="text-2xl font-bold text-gray-900">{successCount}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <AlertCircle size={24} className="text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase tracking-wider">Errors</p>
                                        <p className="text-2xl font-bold text-gray-900">{errorCount}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <ImageIcon size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase tracking-wider">Total</p>
                                        <p className="text-2xl font-bold text-gray-900">{uploadedImages.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Download CSV Button */}
                        {successCount > 0 && (
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Ready to Export</h3>
                                        <p className="text-sm text-gray-600">
                                            Download CSV with image URLs grouped by SKU
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleDownloadCSV}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                    >
                                        <Download size={20} />
                                        Download CSV
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Image Gallery */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Uploaded Images</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {uploadedImages.map((img, index) => (
                                        <div
                                            key={index}
                                            className={`relative group rounded-lg overflow-hidden border-2 ${img.error ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                        >
                                            {img.error ? (
                                                <div className="aspect-square flex items-center justify-center p-4">
                                                    <div className="text-center">
                                                        <AlertCircle size={24} className="text-red-600 mx-auto mb-2" />
                                                        <p className="text-xs text-red-600 font-medium">{img.filename}</p>
                                                        <p className="text-xs text-red-500 mt-1">{img.error}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <img
                                                        src={img.url}
                                                        alt={img.filename}
                                                        className="w-full aspect-square object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <div className="text-center text-white p-2">
                                                            <p className="text-xs font-bold mb-1">{img.sku}</p>
                                                            <p className="text-xs truncate">{img.filename}</p>
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                                        <CheckCircle size={16} />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* URL List (for copying) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Image URLs</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {uploadedImages.filter(img => !img.error).map((img, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <span className="text-xs font-mono text-gray-500 w-24">{img.sku}</span>
                                            <input
                                                type="text"
                                                value={img.url}
                                                readOnly
                                                className="flex-1 text-xs font-mono bg-white border border-gray-200 rounded px-3 py-2"
                                                onClick={(e) => e.target.select()}
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(img.url);
                                                    alert('URL copied!');
                                                }}
                                                className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Instructions */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📝 How to Use</h3>
                    <ol className="space-y-2 text-sm text-gray-700">
                        <li className="flex gap-2">
                            <span className="font-bold text-blue-600">1.</span>
                            <span>Name your image files with SKU prefix: <code className="bg-white px-2 py-1 rounded">ANK-002-1.jpg</code>, <code className="bg-white px-2 py-1 rounded">ANK-002-2.jpg</code></span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-blue-600">2.</span>
                            <span>Click "Select Images" and choose all your product images (can select multiple)</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-blue-600">3.</span>
                            <span>Wait for upload to complete (images are organized by SKU in Supabase Storage)</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-blue-600">4.</span>
                            <span>Click "Download CSV" to get a file with SKUs and image URLs</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-blue-600">5.</span>
                            <span>Open the CSV and copy the image URLs to your product import CSV</span>
                        </li>
                    </ol>
                </div>
            </div>
        </AdminLayout>
    );
}
