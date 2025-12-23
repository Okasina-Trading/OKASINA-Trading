import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Upload, Download, Image as ImageIcon, CheckCircle, AlertCircle, Loader, Folder, Link as LinkIcon, Sparkles } from 'lucide-react';
import { supabase } from '../../supabase';
import { downloadCSV } from '../../utils/csvTemplate';

export default function MediaManagerPage() {
    const [uploading, setUploading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [linkedCount, setLinkedCount] = useState(0);

    // Handle file selection
    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setUploadProgress({ current: 0, total: files.length });
        setLinkedCount(0);

        const results = [];
        let newLinked = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setUploadProgress({ current: i + 1, total: files.length });

            try {
                // 1. Extract SKU
                const filename = file.name;
                // Match "ANK-001" or "ANK001" from start of string
                const skuMatch = filename.match(/^([A-Z0-9-]+)/i);
                const rawSku = skuMatch ? skuMatch[1] : null;

                // Clean SKU (remove trailing hyphens or numbers if they are just indexes like -1, -2)
                // Heuristic: If it ends with -1, -2, crop it? 
                // Let's assume the user names files carefully OR we try to match "ANK-001" exactly against DB.

                let sku = rawSku;
                let productId = null;
                let productName = null;
                let isLinked = false;

                if (sku) {
                    // 2. Upload to Cloudinary (Directly)
                    // Get signature first
                    const signRes = await fetch('/api/sign-upload');
                    if (!signRes.ok) throw new Error('Failed to get upload signature');
                    const signData = await signRes.json();

                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('api_key', signData.api_key);
                    formData.append('timestamp', signData.timestamp);
                    formData.append('signature', signData.signature);
                    formData.append('signature', signData.signature);
                    // formData.append('upload_preset', 'okasina_products'); // REMOVED for Signed Upload

                    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`, {
                        method: 'POST',
                        body: formData
                    });

                    if (!uploadRes.ok) {
                        const errData = await uploadRes.json();
                        throw new Error(errData.error?.message || `Upload Failed: ${uploadRes.status}`);
                    }
                    const uploadData = await uploadRes.json();
                    const imageUrl = uploadData.secure_url;

                    // 3. Find Product in DB (Try Exact Match First)
                    // We might need to try variations if "ANK-001-1" is passed but SKU is "ANK-001"

                    // a) Try exact match on extracted chunk
                    let { data: products } = await supabase
                        .from('products')
                        .select('id, name, image_url')
                        .ilike('sku', sku) // Case insensitive
                        .limit(1);

                    // b) If no match, try trimming last 2 chars (e.g. ANK-001-1 -> ANK-001) if length > 5
                    if ((!products || products.length === 0) && sku.length > 5) {
                        const trimmed = sku.replace(/[-_\s][0-9]+$/, '');
                        if (trimmed !== sku) {
                            const retry = await supabase
                                .from('products')
                                .select('id, name, image_url')
                                .ilike('sku', trimmed)
                                .limit(1);
                            if (retry.data && retry.data.length > 0) {
                                products = retry.data;
                                sku = trimmed; // Update to real sku
                            }
                        }
                    }

                    if (products && products.length > 0) {
                        const product = products[0];
                        productId = product.id;
                        productName = product.name;

                        // 4. Update Product
                        // Set image_url if empty (Primary Image)
                        if (!product.image_url) {
                            await supabase
                                .from('products')
                                .update({ image_url: imageUrl })
                                .eq('id', productId);
                        } else {
                            // Add to Media Gallery (Secondary)
                            await supabase
                                .from('product_media')
                                .insert({
                                    product_id: productId,
                                    type: 'image',
                                    url: imageUrl,
                                    storage_path: imageUrl
                                });
                        }

                        isLinked = true;
                        newLinked++;
                    }

                    results.push({
                        sku,
                        filename,
                        url: imageUrl,
                        productId,
                        productName,
                        isLinked
                    });
                } else {
                    throw new Error('Unknown SKU format');
                }

            } catch (err) {
                console.error(`Error uploading ${file.name}:`, err);
                results.push({
                    filename: file.name,
                    error: err.message,
                    isLinked: false
                });
            }
        }

        setUploadedImages(results);
        setLinkedCount(newLinked);
        setUploading(false);
    };

    return (
        <AdminLayout>
            <div className="space-y-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-gray-900">Smart Media Linker</h1>
                        <p className="text-gray-500 mt-1">
                            Attach images to your <strong>existing</strong> products.
                        </p>
                    </div>

                    <a href="/admin/stock" className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
                        <Sparkles size={18} />
                        Want to CREATE products from images? Go to AI Scanner
                    </a>
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Drag & Drop or Select Images</h3>
                    <p className="text-gray-500 mb-6 max-w-lg mx-auto">
                        Filenames must start with the SKU (e.g., <code>ANK-001-front.jpg</code> will attach to <code>ANK-001</code>).
                    </p>

                    <label className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all cursor-pointer shadow-lg font-medium text-lg">
                        <Folder size={24} />
                        Select Images
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
                        <div className="mt-8 max-w-md mx-auto">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Processing...</span>
                                <span>{uploadProgress.current} / {uploadProgress.total}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-300"
                                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Summary */}
                {!uploading && uploadedImages.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center">
                            <h4 className="text-green-800 font-bold text-3xl mb-1">{linkedCount}</h4>
                            <p className="text-green-600 text-sm font-medium flex items-center gap-2">
                                <LinkIcon size={16} /> Products Linked
                            </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col items-center">
                            <h4 className="text-blue-800 font-bold text-3xl mb-1">{uploadedImages.length}</h4>
                            <p className="text-blue-600 text-sm font-medium flex items-center gap-2">
                                <Upload size={16} /> Total Uploads
                            </p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center">
                            <button
                                onClick={() => setUploadedImages([])}
                                className="text-sm text-gray-500 hover:text-gray-900 underline"
                            >
                                Clear Results
                            </button>
                        </div>
                    </div>
                )}

                {/* Detailed Results */}
                {uploadedImages.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Upload Results</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
                            {uploadedImages.map((img, i) => (
                                <div key={i} className={`relative group border rounded-lg overflow-hidden ${img.isLinked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="aspect-square bg-white relative">
                                        {img.url ? (
                                            <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-red-400">
                                                <AlertCircle />
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        <div className="absolute top-2 right-2">
                                            {img.isLinked ? (
                                                <span className="bg-green-500 text-white p-1 rounded-full shadow-sm block">
                                                    <LinkIcon size={12} />
                                                </span>
                                            ) : (
                                                <span className="bg-gray-400 text-white p-1 rounded-full shadow-sm block">
                                                    <AlertCircle size={12} />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <p className="text-xs font-mono font-bold text-gray-900 truncate mb-0.5">
                                            {img.sku || 'NO SKU'}
                                        </p>
                                        <p className="text-[10px] text-gray-500 truncate mb-1" title={img.filename}>
                                            {img.filename}
                                        </p>
                                        {img.isLinked ? (
                                            <div className="flex items-center gap-1 text-[10px] text-green-700 font-medium">
                                                <CheckCircle size={10} />
                                                <span>Linked to {img.productName}</span>
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-red-500 font-medium">
                                                {img.error || 'Product not found'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout >
    );
}

