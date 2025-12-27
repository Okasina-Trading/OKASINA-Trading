import React, { useState } from 'react';
import { Package, Truck, RotateCcw } from 'lucide-react';

export default function ProductTabs({ product }) {
    const [activeTab, setActiveTab] = useState('description');

    const tabs = [
        { id: 'description', label: 'Description' },
        { id: 'details', label: 'Details' },
        { id: 'shipping', label: 'Shipping & Returns' }
    ];

    return (
        <div className="mb-8">
            {/* Tab Headers */}
            <div className="border-b border-gray-200 mb-6">
                <div className="flex gap-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 text-sm font-medium uppercase tracking-wider transition-colors relative ${activeTab === tab.id
                                ? 'text-black'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="text-gray-600">
                {activeTab === 'description' && (
                    <div className="prose prose-sm max-w-none">
                        <p>{product.description || 'No description available.'}</p>
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium text-gray-900 mb-1">Category</p>
                                <p>{product.category}</p>
                            </div>
                            {product.subcategory && (
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">Subcategory</p>
                                    <p>{product.subcategory}</p>
                                </div>
                            )}
                            {product.sku && (
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">SKU</p>
                                    <p>{product.sku}</p>
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-gray-900 mb-1">Availability</p>
                                <p className={product.stock_qty > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {product.stock_qty > 0 ? 'In Stock' : 'Out of Stock'}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <p className="font-medium text-gray-900 mb-2">Care Instructions</p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Machine wash cold with like colors</li>
                                <li>Tumble dry low or hang to dry</li>
                                <li>Do not bleach</li>
                                <li>Iron on low heat if needed</li>
                            </ul>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <p className="font-medium text-gray-900 mb-2">Material & Quality</p>
                            <p className="text-sm">
                                High-quality materials and excellent craftsmanship. Each piece is carefully
                                selected to ensure durability and comfort.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'shipping' && (
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Truck className="text-gray-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 mb-1">Delivery</h3>
                                <p className="text-sm">
                                    Standard delivery from Rs 100. Free delivery on orders over Rs 5,000.
                                    Delivery within 3-5 business days across Mauritius.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <RotateCcw className="text-gray-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 mb-1">Returns & Exchanges</h3>
                                <div className="prose prose-sm max-w-none">
                                    <p>
                                        Goods once sold cannot be returned.
                                    </p>
                                    <p>
                                        48 hours return policy - Items must be unworn, unwashed, and in original condition with tags attached. Contact us to initiate a return.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="text-gray-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 mb-1">Packaging</h3>
                                <p className="text-sm">
                                    All items are carefully packaged to ensure they arrive in perfect condition.
                                    We use eco-friendly packaging materials whenever possible.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
