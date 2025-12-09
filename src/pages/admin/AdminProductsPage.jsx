import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import ProductEditModal from '../../components/admin/ProductEditModal';
import {
    Plus,
    Search,
    Filter,
    Download,
    Upload,
    Edit,
    Trash2,
    Eye,
    Package,
    AlertCircle,
    CheckCircle,
    Facebook,
    Zap,
    ArrowUp,
    ArrowDown,
    ArrowUpDown
} from 'lucide-react';
import { API_URL } from '../../api';

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        drafts: 0
    });
    const [editingProduct, setEditingProduct] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Bulk Selection State
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setProducts(data || []);
            calculateStats(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (productData) => {
        const total = productData.length;
        const inStock = productData.filter(p => p.stock_qty > 10).length;
        const lowStock = productData.filter(p => p.stock_qty > 0 && p.stock_qty <= 10).length;
        const outOfStock = productData.filter(p => p.stock_qty === 0).length;
        const drafts = productData.filter(p => p.status === 'draft').length;

        setStats({ total, inStock, lowStock, outOfStock, drafts });
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowEditModal(true);
    };

    const handleDelete = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            console.log('Attempting to delete product:', productId);

            const response = await fetch(`${API_URL}/api/delete-product`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });

            const result = await response.json();
            console.log('Delete result:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Delete failed');
            }

            // Remove from selected if it was selected
            if (selectedProducts.includes(productId)) {
                setSelectedProducts(prev => prev.filter(id => id !== productId));
            }

            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product: ' + error.message);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`)) return;

        try {
            setLoading(true);
            const results = await Promise.all(
                selectedProducts.map(id =>
                    fetch(`${API_URL}/api/delete-product`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId: id })
                    }).then(res => res.json())
                )
            );

            console.log('Bulk delete results:', results);
            alert('Products deleted successfully');
            setSelectedProducts([]);
            fetchProducts();
        } catch (error) {
            console.error('Bulk delete error:', error);
            alert('Failed to delete some products');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                alert('No products to export');
                return;
            }

            // Define CSV headers
            const headers = [
                'id',
                'name',
                'description',
                'category',
                'subcategory',
                'price',
                'price_mur',
                'stock',
                'sku',
                'status',
                'image_url'
            ];

            // Convert data to CSV
            const csvContent = [
                headers.join(','),
                ...data.map(product => headers.map(header => {
                    const value = product[header] || '';
                    // Escape quotes and wrap in quotes if necessary
                    const stringValue = String(value).replace(/"/g, '""');
                    return `"${stringValue}"`;
                }).join(','))
            ].join('\n');

            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error exporting products:', error);
            alert('Failed to export products');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkPublish = async () => {
        if (!confirm(`Publish all ${stats.drafts} draft products? They will become visible on the website.`)) return;

        try {
            setPublishing(true);
            const { error } = await supabase
                .from('products')
                .update({ status: 'active' })
                .eq('status', 'draft');

            if (error) throw error;

            alert(`Successfully published ${stats.drafts} products!`);
            fetchProducts();
        } catch (error) {
            console.error('Error publishing products:', error);
            alert('Failed to publish products');
        } finally {
            setPublishing(false);
        }
    };

    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredProducts = products
        .filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (!sortConfig.key) return 0;

            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle special cases
            if (sortConfig.key === 'price') {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
            } else if (sortConfig.key === 'stock_qty') {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
            } else if (sortConfig.key === 'name' || sortConfig.key === 'category' || sortConfig.key === 'sku') {
                aValue = (aValue || '').toString().toLowerCase();
                bValue = (bValue || '').toString().toLowerCase();
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

    const categories = [...new Set(products.map(p => p.category))];

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(filteredProducts.map(p => p.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (id) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(pid => pid !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    const handleBulkCategoryUpdate = async () => {
        if (!newCategory) return alert('Please select a category');

        try {
            setLoading(true);
            console.log('Updating categories for:', selectedProducts);

            const response = await fetch(`${API_URL}/api/update-category`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productIds: selectedProducts,
                    category: newCategory
                })
            });

            const result = await response.json();
            console.log('Update result:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Update failed');
            }

            if (result.count === 0) {
                alert('Update failed: No products modified. Check permissions.');
                return;
            }

            alert(result.message);
            setShowBulkCategoryModal(false);
            setSelectedProducts([]);
            fetchProducts();
        } catch (error) {
            console.error('Error updating categories:', error);
            alert('Failed to update categories: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            {/* Bulk Category Modal */}
            {showBulkCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
                        <h3 className="text-lg font-bold mb-4">Bulk Change Category</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Updating {selectedProducts.length} selected products.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Category
                            </label>
                            <select
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Category</option>
                                <option value="Clothing">Clothing</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Shoes">Shoes</option>
                                <option value="Bags">Bags</option>
                                <option value="Jewelry">Jewelry</option>
                                <option value="New Arrivals">New Arrivals</option>
                                <option value="Clearance">Clearance</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowBulkCategoryModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkCategoryUpdate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Update Products
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ProductEditModal
                product={editingProduct}
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                }}
                onUpdate={fetchProducts}
            />
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Products</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Package className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">In Stock</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{stats.inStock}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Package className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Low Stock</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.lowStock}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <AlertCircle className="text-yellow-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Out of Stock</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">{stats.outOfStock}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <Package className="text-red-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex-1 w-full md:w-auto flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search products by name or SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {selectedProducts.length > 0 && (
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                    <span className="text-sm font-medium text-blue-700">
                                        {selectedProducts.length} selected
                                    </span>
                                    <button
                                        onClick={() => setShowBulkCategoryModal(true)}
                                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                                    >
                                        Change Category
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                                    >
                                        <Trash2 size={12} />
                                        Delete Selected
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {stats.drafts > 0 && (
                                <button
                                    onClick={handleBulkPublish}
                                    disabled={publishing}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                                >
                                    <CheckCircle size={20} />
                                    {publishing ? 'Publishing...' : `Publish ${stats.drafts} Drafts`}
                                </button>
                            )}

                            <Link
                                to="/admin/album-import"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                            >
                                <Facebook size={20} />
                                Import from Social
                            </Link>

                            <button
                                onClick={handleExport}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                            >
                                <Download size={20} />
                                Export CSV
                            </button>

                            <Link
                                to="/admin/stock-manager"
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                            >
                                <Upload size={20} />
                                Bulk CSV Import
                            </Link>

                            <button
                                onClick={() => {
                                    setEditingProduct(null);
                                    setShowEditModal(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={20} />
                                Add Product
                            </button>

                            <Link
                                to="/admin/automation"
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                                title="Use Automation for Bulk Edits & Promos"
                            >
                                <Zap size={20} />
                                Bulk Actions
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-4 text-left w-12">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th>
                                    {[
                                        { key: 'name', label: 'Product' },
                                        { key: 'sku', label: 'SKU' },
                                        { key: 'category', label: 'Category' },
                                        { key: 'price', label: 'Price' },
                                        { key: 'stock_qty', label: 'Stock' },
                                        { key: 'status', label: 'Status' }
                                    ].map((col) => (
                                        <th
                                            key={col.key}
                                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                            onClick={() => handleSort(col.key)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {col.label}
                                                {sortConfig.key === col.key ? (
                                                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                                ) : (
                                                    <ArrowUpDown size={14} className="text-gray-300" />
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                            Loading products...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                            No products found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${selectedProducts.includes(product.id) ? 'bg-blue-50' : ''}`}>
                                            <td className="px-3 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProducts.includes(product.id)}
                                                    onChange={() => handleSelectProduct(product.id)}
                                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={product.image_url || '/placeholder.jpg'}
                                                        alt={product.name}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900">{product.name}</p>
                                                        <p className="text-sm text-gray-500">{product.subcategory}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {product.sku || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {product.category}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {(() => {
                                                    const price = product.price_mur || (product.price * 45);
                                                    return `Rs ${price?.toLocaleString()}`;
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {product.stock_qty}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${product.stock_qty > 10
                                                    ? 'bg-green-100 text-green-800'
                                                    : product.stock_qty > 0
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {product.stock_qty > 10 ? 'In Stock' : product.stock_qty > 0 ? 'Low Stock' : 'Out of Stock'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/product/${product.id}`}
                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
