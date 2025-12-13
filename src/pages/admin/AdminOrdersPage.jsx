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
    DollarSign
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

    // ... (keep existing functions)

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* ... (keep existing stats cards and actions bar) ... */}

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
                                                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="shipped">Shipped</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
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

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                                                <p className="font-medium">Rs {((item.price_mur || (Number(item.price) * 45)) * item.quantity).toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">Rs {item.price_mur || (Number(item.price) * 45)} each</p>
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
                                        <span>Rs {(selectedOrder.total_amount - (selectedOrder.shipping_method === 'door' ? 150 : 100)).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span>Rs {selectedOrder.shipping_method === 'door' ? '150' : '100'}</span>
                                    </div>
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
