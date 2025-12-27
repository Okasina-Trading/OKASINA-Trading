import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Search, Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

export default function OrdersPage() {
    const [email, setEmail] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const fetchOrders = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setSearched(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .ilike('customer_email', email)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            alert('Error fetching orders. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="text-yellow-600" size={20} />;
            case 'processing': return <Package className="text-blue-600" size={20} />;
            case 'shipped': return <Truck className="text-purple-600" size={20} />;
            case 'completed': return <CheckCircle className="text-green-600" size={20} />;
            case 'cancelled': return <XCircle className="text-red-600" size={20} />;
            default: return <Clock className="text-gray-600" size={20} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center">Track Your Orders</h1>

                {/* Search Form */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <form onSubmit={fetchOrders} className="flex gap-4">
                        <div className="flex-1">
                            <label htmlFor="email" className="sr-only">Email Address</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="Enter the email used for checkout..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-black text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Find Orders'}
                        </button>
                    </form>
                </div>

                {/* Results */}
                {searched && (
                    <div className="space-y-6">
                        {orders.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                                <p className="text-gray-500 mt-2">We couldn't find any orders associated with {email}</p>
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
                                            <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(order.status)}
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {order.items && order.items.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden">
                                                            <img
                                                                src={item.image_url || item.image}
                                                                alt={item.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{item.name}</p>
                                                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-medium text-gray-900">
                                                        Rs {(item.price * item.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-6 space-y-3 border-t border-gray-100">
                                        {/* Summary Breakdown */}
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">Rs {order.subtotal_amount?.toLocaleString() || order.total_amount?.toLocaleString()}</span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Shipping ({order.shipping_method === 'door' ? 'Door Delivery' : 'Postage'})</span>
                                            <span className="font-medium">Rs {order.shipping_cost || 0}</span>
                                        </div>

                                        {order.discount_amount > 0 && (
                                            <div className="flex justify-between items-center text-sm text-green-700">
                                                <span>Loyalty Discount</span>
                                                <span>- Rs {order.discount_amount}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-2">
                                            <span className="font-bold text-gray-900">Total Amount</span>
                                            <span className="text-xl font-bold text-gray-900">Rs {order.total_amount?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
