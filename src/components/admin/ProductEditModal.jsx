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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full relative flex flex-col max-h-[90vh]">
                {/* Header - No Sticky */}
                <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-900">{product ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <form id="product-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Image Upload - Full Width, No Fancy Centering */}
                        <div className="border-2 border-dashed border-blue-500 bg-blue-50 rounded-lg p-6">
                            <label className="block text-lg font-bold text-blue-900 mb-4 text-center">
                                Product Image
                            </label>

                            <label className="block w-full cursor-pointer text-center">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-64 object-contain rounded-md bg-white border border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setImageFile(null);
                                                setImagePreview(null);
                                            }}
                                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-8 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-500 transition-all shadow-sm group">
                                        <div className="mx-auto h-20 w-20 text-blue-600 mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                                            <Upload size={40} />
                                        </div>
                                        <span className="block text-xl font-bold text-gray-900">Click to Upload Image</span>
                                        <span className="block text-sm text-gray-500 mt-2">Supports JPG, PNG, WEBP</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>

                            {analyzing && (
                                <div className="mt-4 p-4 bg-white rounded border border-blue-200 flex items-center justify-center text-blue-700 animate-pulse">
                                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                                    <span className="font-bold">Analyzing image with AI...</span>
                                </div>
                            )}
                        </div>

                        {/* Basic Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1">Product Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                    placeholder="e.g. Summer Floral Dress"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-1">Category *</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Accessories">Accessories</option>
                                        <option value="Shoes">Shoes</option>
                                        <option value="Bags">Bags</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-1">Subcategory</label>
                                    <input
                                        type="text"
                                        name="subcategory"
                                        value={formData.subcategory}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-1">Price (MUR) *</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-1">Stock *</label>
                                    <input
                                        type="number"
                                        name="stock_qty"
                                        value={formData.stock_qty}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <h3 className="font-bold text-gray-900 mb-3">Variants & Status</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                                        >
                                            <option value="active">Active</option>
                                            <option value="draft">Draft</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">SKU</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Sizes</label>
                                        <input
                                            type="text"
                                            name="sizes"
                                            value={formData.sizes}
                                            onChange={handleChange}
                                            placeholder="S, M, L, XL"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer - No Sticky */}
                <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-100 font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        // Connect to form explicitly
                        form="product-form"
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md"
                    >
                        {saving ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </div>
        </div>
    );
}
