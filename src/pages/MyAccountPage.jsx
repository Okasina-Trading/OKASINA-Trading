import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Package, LogOut, User, Crown } from 'lucide-react';

export default function MyAccountPage() {
    const { user, signOut, loading: authLoading } = useAuth(); // rename to avoid conflict with local loading
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [dataLoading, setDataLoading] = useState(true); // rename local state

    useEffect(() => {
        if (authLoading) return; // Wait for auth check

        if (!user) {
            navigate('/login');
            return;
        }
        fetchOrders();
    }, [user, authLoading]);

    const fetchOrders = async () => {
        // Fetch orders where customer_email matches the logged-in user's email
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_email', user.email)
            .order('created_at', { ascending: false });

        if (!error) {
            setOrders(data);
        }
        setDataLoading(false);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    if (authLoading) {
        return <div className="flex h-screen items-center justify-center">Loading account...</div>;
    }

    if (!user) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold mb-2">My Account</h1>
                    <p className="text-gray-600">Welcome back, {user.email}</p>
                </div>
                <button
                    onClick={handleSignOut}
                    className="mt-4 md:mt-0 flex items-center text-red-600 hover:text-red-800 transition-colors"
                >
                    <LogOut size={18} className="mr-2" /> Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="bg-gray-50 p-6 rounded-lg h-fit space-y-6">
                    <div>
                        <div className="flex items-center mb-4">
                            <div className="bg-black text-white p-3 rounded-full mr-4">
                                <User size={24} />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg">Profile Details</h2>
                                <p className="text-sm text-gray-500">Manage your account</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Email</label>
                                <p className="font-medium">{user.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Member Since</label>
                                <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Rewards Link */}
                    <div className="pt-6 border-t border-gray-200">
                        <button
                            onClick={() => navigate('/rewards')}
                            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg border border-yellow-200 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-500 text-white p-2 rounded-full">
                                    <Crown size={16} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900">My Rewards</p>
                                    <p className="text-xs text-yellow-700">View Points & Tiers</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Order History */}
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold mb-6 flex items-center">
                        <Package size={24} className="mr-2" /> Order History
                    </h2>

                    {dataLoading ? (
                        <p>Loading orders...</p>
                    ) : orders.length === 0 ? (
                        <div className="bg-gray-50 p-8 text-center rounded-lg">
                            <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
                            <button
                                onClick={() => navigate('/shop')}
                                className="bg-black text-white px-6 py-2 font-bold uppercase text-sm hover:bg-gray-800"
                            >
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                                        <div>
                                            <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                                            <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="mt-2 md:mt-0">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-600">
                                                Payment: <span className="font-medium capitalize">{order.payment_method}</span>
                                            </p>
                                            <p className="font-bold text-lg">
                                                Rs {order.total_amount?.toLocaleString()}
                                            </p>
                                        </div>
                                        {/* We could parse order.items here if it's stored as JSON to show thumbnails */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
