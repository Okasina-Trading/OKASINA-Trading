import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../../supabase';
import { API_BASE_URL as API_URL } from '../../config';

export default function ProductEditModal({ product, isOpen, onClose, onUpdate }) {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        subcategory: '',
        price: '',
        price_mur: '',
        stock_qty: '',
        sku: '',
        status: 'active',
        sizes: '',
        material: '',
        colors: '',
        image_url: '',
        mrp: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                category: product.category || '',
                subcategory: product.subcategory || '',
                price: product.price || '',
                price_mur: product.price_mur || '',
                stock_qty: product.stock_qty || 0,
                sku: product.sku || '',
                status: product.status || 'active',
                sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : (product.sizes || ''),
                material: product.material || '',
                colors: product.colors || '',
                image_url: product.image_url || '',
                mrp: product.mrp || ''
            });
            setImagePreview(product.image_url || null);
        } else {
            // Reset for new product
            setFormData({
                name: '', description: '', category: '', subcategory: '',
                price: '', price_mur: '', stock_qty: '', sku: '',
                status: 'active', sizes: '', material: '', colors: '', image_url: '',
                mrp: ''
            });
            setImagePreview(null);
            setImageFile(null);
        }
    }, [product, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);

            // Auto-trigger analysis
            if (confirm("✨ Image Detected! Shall I ask the AI to auto-fill the product details for you?")) {
                await analyzeImage(file);
            }
        }
    };

    const analyzeImage = async (file) => {
        setAnalyzing(true);
        try {
            // 1. Upload tmp image
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            const uploadRes = await fetch(`${API_URL}/api/upload-image`, { method: 'POST', body: uploadFormData });
            const uploadData = await uploadRes.json();

            if (!uploadData.url) throw new Error("Upload failed");

            // 2. Call Vision Agent
            const visionRes = await fetch(`${API_URL}/api/ai-agent/jarvis/vision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: uploadData.url })
            });
            const visionData = await visionRes.json();

            if (visionData.success && visionData.product) {
                const p = visionData.product;
                setFormData(prev => ({
                    ...prev,
                    name: p.name,
                    description: p.description,
                    category: p.category,
                    subcategory: p.subcategory || '',
                    price: p.price,
                    price_mur: p.price,
                    sizes: 'S, M, L' // Default
                }));
                // Persist the uploaded URL so we don't upload again on save
                setFormData(prev => ({ ...prev, image_url: uploadData.url }));
                setImageFile(null); // Clear file so we use the URL
                alert("✨ Magic! Product details filled by AI.");
            }
        } catch (error) {
            console.error("Vision Error:", error);
            alert("AI couldn't analyze the image. Please fill details manually.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            let finalImageUrl = formData.image_url;

            // 1. Upload Image logic (only if new file and NOT already analyzed/uploaded)
            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', imageFile);

                const uploadRes = await fetch(`${API_URL}/api/upload-image`, {
                    method: 'POST',
                    body: uploadFormData
                });
                const uploadData = await uploadRes.json();

                if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed');
                finalImageUrl = uploadData.url;
            }

            // 2. Prepare Data (Sync Price)
            const priceValue = parseFloat(formData.price);
            const updateData = {
                ...formData,
                price: priceValue,
                price_mur: priceValue, // Auto-sync MUR price to the same value
                stock_qty: parseInt(formData.stock_qty),
                sku: formData.sku && formData.sku.trim() !== '' ? formData.sku.trim() : null,
                sizes: formData.sizes.split(',').map(s => s.trim()).filter(s => s),
                material: formData.material,
                colors: formData.colors,
                image_url: finalImageUrl,
                mrp: formData.mrp ? parseFloat(formData.mrp) : null
            };

            let response;
            if (product?.id) {
                response = await fetch(`${API_URL}/api/update-product`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: product.id, ...updateData })
                });
            } else {
                response = await fetch(`${API_URL}/api/create-product`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save product');
            }

            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-0 sm:p-4">
            {/* Modal Panel - Flex Column for Perfect Scroll */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header (fixed, not sticky) */}
                <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-none bg-white">
                    <h2 className="text-xl font-bold text-gray-900">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Image Upload Section */}
                    <div className="flex justify-center">
                        <div className="w-full max-w-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                Product Image
                            </label>

                            <label className="relative border-2 border-dashed border-blue-400 rounded-lg p-6 hover:border-blue-600 transition-colors bg-blue-50 flex flex-col items-center justify-center min-h-[220px] shadow-sm group cursor-pointer">
                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-contain rounded-md mb-2 bg-gray-50 border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setImageFile(null);
                                                setImagePreview(null);
                                            }}
                                            className="absolute top-2 right-2 bg-white text-red-600 p-1.5 rounded-full shadow-md hover:bg-red-50 z-20 border border-gray-200"
                                            title="Remove Image"
                                        >
                                            <X size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform py-6">
                                        <div className="mx-auto h-20 w-20 text-blue-600 mb-4 bg-white rounded-full flex items-center justify-center border-2 border-blue-200 shadow-md">
                                            <Upload size={40} strokeWidth={2} />
                                        </div>
                                        <p className="text-xl font-bold text-gray-900 mb-1">Upload Product Image</p>
                                        <p className="text-sm font-medium text-gray-600">Click to browse files</p>
                                        <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG, WEBP (Max 5MB)</p>
                                    </div>
                                )}

                                {analyzing && (
                                    <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-30 backdrop-blur-sm rounded-lg border-2 border-blue-500">
                                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                                        <p className="text-lg font-bold text-blue-600 animate-pulse">Running AI Analysis...</p>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Select Category</option>
                                <option value="Clothing">Clothing</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Shoes">Shoes</option>
                                <option value="Bags">Bags</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                            <input
                                type="text"
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (MUR) *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                step="0.01"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">This will be used as the main selling price.</p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (MRP) - Optional</label>
                            <input
                                type="number"
                                name="mrp"
                                value={formData.mrp}
                                onChange={handleChange}
                                step="0.01"
                                placeholder="Used for showing slashed price/discounts"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                            <input
                                type="number"
                                name="stock_qty"
                                value={formData.stock_qty}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sizes (comma-separated)</label>
                            <input
                                type="text"
                                name="sizes"
                                value={formData.sizes}
                                onChange={handleChange}
                                placeholder="XS, S, M, L, XL"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                            <input
                                type="text"
                                name="material"
                                value={formData.material}
                                onChange={handleChange}
                                placeholder="e.g. Cotton, Silk"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Colors (comma-separated)</label>
                            <input
                                type="text"
                                name="colors"
                                value={formData.colors}
                                onChange={handleChange}
                                placeholder="e.g. Red, Blue, Green"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Spacer for bottom padding */}
                    <div className="h-2" />
                </form>

                {/* Footer (fixed, not sticky) */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-none bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        // Connect to form explicitly
                        form="product-form"
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium shadow-md"
                    >
                        {saving ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </div>
        </div>
    );
}
