import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import {
    DollarSign,
    Users,
    ShoppingCart,
    TrendingUp,
    Plus,
    RefreshCw,
    BarChart,
    FileText,
    Share2,
    Settings,
    Sparkles,
    Image as ImageIcon,
    MessageSquare,
    Tag
} from 'lucide-react';
import InventoryAlerts from '../../components/admin/InventoryAlerts';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        activeUsers: 0,
        totalOrders: 0,
        avgOrderValue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);

        // Fetch orders
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, created_at');

        // Fetch products
        const { data: products } = await supabase
            .from('products')
            .select('id')
            .eq('status', 'active');

        if (orders) {
            const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
            const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

            setStats({
                totalRevenue,
                activeUsers: products?.length || 0,
                totalOrders: orders.length,
                avgOrderValue
            });
        }

        setLoading(false);
    };

    const statCards = [
        {
            title: 'Total Revenue',
            value: `Rs ${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'from-green-400 to-green-600',
            bgColor: 'bg-green-500'
        },
        {
            title: 'Active Users',
            value: stats.activeUsers,
            icon: Users,
            color: 'from-blue-400 to-blue-600',
            bgColor: 'bg-blue-500'
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders,
            icon: ShoppingCart,
            color: 'from-purple-400 to-purple-600',
            bgColor: 'bg-purple-500'
        },
        {
            title: 'Avg Order Value',
            value: `Rs ${Math.round(stats.avgOrderValue).toLocaleString()}`,
            icon: TrendingUp,
            color: 'from-orange-400 to-orange-600',
            bgColor: 'bg-orange-500'
        }
    ];

    const productActions = [
        {
            title: 'Add New Product',
            icon: Plus,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            href: '/admin/products/new'
        },
        {
            title: 'Bulk Stock Update',
            icon: RefreshCw,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            href: '/admin/stock-manager'
        },
        {
            title: 'Upload Images',
            icon: ImageIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            href: '/admin/media'
        }
    ];

    const reportActions = [
        {
            title: 'View Sales Report',
            icon: BarChart,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            href: '/admin/analytics'
        },
        {
            title: 'Export Product List',
            icon: FileText,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            href: '/admin/products?export=true'
        }
    ];

    const marketingActions = [
        {
            title: 'Social Media Campaigns',
            icon: Share2,
            color: 'text-pink-600',
            bgColor: 'bg-pink-50',
            href: '/admin/marketing'
        },
        {
            title: 'Manage Social Links',
            icon: Settings,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            href: '/admin/marketing/social'
        }
    ];

    const marketInsights = [
        { label: 'Peak Order Hours', value: 'USA' },
        { label: 'Top User Segments', value: 'EMA' },
        { label: 'Avg. Order Value', value: `Rs ${Math.round(stats.avgOrderValue).toLocaleString()}` }
    ];

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className={`h-2 bg-gradient-to-r ${stat.color}`} />
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                            <Icon size={24} className="text-white" />
                                        </div>
                                        {/* Removed hardcoded percentage */}
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                                        {loading ? '...' : stat.value}
                                    </h3>
                                    <p className="text-sm text-gray-500">{stat.title}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Action Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Product Actions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Sparkles size={20} className="text-blue-600" />
                            Product Actions
                        </h3>
                        <div className="space-y-3">
                            {productActions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={index}
                                        to={action.href}
                                        className={`flex items-center gap-3 p-4 rounded-xl ${action.bgColor} hover:shadow-md transition-all group`}
                                    >
                                        <Icon size={20} className={action.color} />
                                        <span className="font-medium text-gray-900 group-hover:text-gray-700">
                                            {action.title}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reports & Analytics */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart size={20} className="text-purple-600" />
                            Reports & Analytics
                        </h3>
                        <div className="space-y-3">
                            {reportActions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={index}
                                        to={action.href}
                                        className={`flex items-center gap-3 p-4 rounded-xl ${action.bgColor} hover:shadow-md transition-all group`}
                                    >
                                        <Icon size={20} className={action.color} />
                                        <span className="font-medium text-gray-900 group-hover:text-gray-700">
                                            {action.title}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Marketing */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Share2 size={20} className="text-pink-600" />
                            Marketing
                        </h3>
                        <div className="space-y-3">
                            {marketingActions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={index}
                                        to={action.href}
                                        className={`flex items-center gap-3 p-4 rounded-xl ${action.bgColor} hover:shadow-md transition-all group`}
                                    >
                                        <Icon size={20} className={action.color} />
                                        <span className="font-medium text-gray-900 group-hover:text-gray-700">
                                            {action.title}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Charts & Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <InventoryAlerts />
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Orders by Status</h3>
                        <div className="h-48 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Chart coming soon</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
