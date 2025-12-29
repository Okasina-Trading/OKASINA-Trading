import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import {
    ShoppingCart,
    Search,
    Filter,
    Download,
    Eye,
    CheckCircle,
    Clock,
    XCircle,
    Package,
    Truck,
    DollarSign,
    Trash2
} from 'lucide-react';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        revenue: 0
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setOrders(data || []);
            calculateStats(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (orderData) => {
        const total = orderData.length;
        const pending = orderData.filter(o => o.status === 'pending').length;
        const processing = orderData.filter(o => o.status === 'processing').length;
        const completed = orderData.filter(o => o.status === 'completed').length;
        const revenue = orderData
            .filter(o => o.status === 'completed')
            .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        setStats({ total, pending, processing, completed, revenue });
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            // Use server API to bypass RLS policies
            const res = await fetch('/api/update-order-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: newStatus })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update');
            }

            fetchOrders();
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order status: ' + error.message);
        }
    };

    const updatePaymentStatus = async (orderId, newStatus) => {
        try {
            const res = await fetch('/api/update-order-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, payment_status: newStatus })
            });

            if (!res.ok) {
                const err = await res.json();
                // Warn about migration if applicable
                if (err.warning) alert(err.warning);
                else throw new Error(err.error || 'Failed to update payment status');
            } else {
                const data = await res.json();
                if (data.warning) alert(data.warning);
            }

            fetchOrders();
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Failed to update payment status: ' + error.message);
        }
    };

    const deleteOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to delete this order PERMANENTLY?')) return;

        try {
            // Use server API to bypass RLS policies
            const res = await fetch('/api/delete-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete');
            }

            fetchOrders();
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Failed to delete order: ' + error.message);
        }
    };

    const clearAllOrders = async () => {
        const confirm1 = window.confirm('DANGER: This will delete ALL orders in the database.');
        if (!confirm1) return;
        const confirm2 = window.confirm('Are you absolutely sure? This cannot be undone.');
        if (!confirm2) return;

        try {
            // Use server API to bypass RLS policies
            const res = await fetch('/api/clear-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to clear orders');
            }

            fetchOrders();
            alert('All orders have been cleared successfully.');
        } catch (error) {
            console.error('Error clearing orders:', error);
            alert('Failed to clear orders: ' + error.message);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id?.toString().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="text-yellow-600" size={20} />;
            case 'processing':
                return <Package className="text-blue-600" size={20} />;
            case 'shipped':
                return <Truck className="text-purple-600" size={20} />;
            case 'completed':
                return <CheckCircle className="text-green-600" size={20} />;
            case 'cancelled':
                return <XCircle className="text-red-600" size={20} />;
            default:
                return <Clock className="text-gray-600" size={20} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'shipped':
                return 'bg-purple-100 text-purple-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const [selectedOrder, setSelectedOrder] = useState(null);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold font-serif">Order Management</h1>

                    {/* Clear All Button */}
                    {orders.length > 0 && (
                        <button
                            onClick={clearAllOrders}
                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm font-bold uppercase tracking-wider"
                        >
                            <Trash2 size={16} />
                            Clear All Bogus Orders
                        </button>
                    )}
                </div>

                {/* Filter Bar same as before but without re-rendering everything if not needed */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    {/* Search and Filters */}
                    <div className="flex gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading orders...</td></tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No orders found</td></tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}...</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{order.customer_name}</p>
                                                    <p className="text-sm text-gray-500">{order.customer_email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Rs {order.total_amount?.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={order.payment_status || 'pending'}
                                                    onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                                                    className={`px-2 py-1 text-xs font-bold rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-black ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                            order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                                                order.payment_status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="paid">Paid</option>
                                                    <option value="failed">Failed</option>
                                                    <option value="refunded">Refunded</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(order.status)}
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent mr-2"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="shipped">Shipped</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                    <button
                                                        onClick={() => deleteOrder(order.id)}
                                                        className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                                                        title="Delete Order"
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

            {/* Order Details Modal - Increased Z-index to cover navbar */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Order Details #{selectedOrder.id.slice(0, 8)}</h2>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Customer</h3>
                                    <p className="font-medium">{selectedOrder.customer_name}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.customer_email}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Shipping</h3>
                                    <p className="text-sm text-gray-600">{selectedOrder.shipping_address}</p>
                                    <p className="text-sm font-medium mt-1 capitalize">Method: {selectedOrder.shipping_method === 'door' ? 'Door Delivery' : 'Postage'}</p>
                                </div>
                            </div>

                            {/* Order Notes */}
                            {selectedOrder.order_notes && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.order_notes}</p>
                                </div>
                            )}

                            {/* Items */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Items</h3>
                                <div className="space-y-4">
                                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg">
                                            <div className="h-16 w-16 bg-white rounded border border-gray-200 overflow-hidden flex-shrink-0">
                                                <img
                                                    src={item.image || item.image_url}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                <div className="flex gap-4 text-sm text-gray-600 mt-1">
                                                    {item.selectedSize && <span>Size: <strong>{item.selectedSize}</strong></span>}
                                                    {item.color && <span>Color: <strong>{item.color}</strong></span>}
                                                    <span>Qty: <strong>{item.quantity}</strong></span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">Rs {(item.price * item.quantity).toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">Rs {item.price} each</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t border-gray-200 pt-4 flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>Rs {(selectedOrder.subtotal_amount || selectedOrder.total_amount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span>Rs {selectedOrder.shipping_cost || (selectedOrder.shipping_method === 'door' ? '150' : '100')}</span>
                                    </div>

                                    {selectedOrder.discount_amount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>- Rs {selectedOrder.discount_amount}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                                        <span>Total</span>
                                        <span>Rs {selectedOrder.total_amount?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
