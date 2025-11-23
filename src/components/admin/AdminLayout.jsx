import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    BarChart3,
    Megaphone,
    MessageSquare,
    ChevronRight,
    Menu,
    X,
    LogOut,
    UploadCloud,
} from 'lucide-react';

export default function AdminLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Products', href: '/admin/products', icon: Package },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Marketing', href: '/admin/marketing', icon: Megaphone },
        { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
        { name: 'Media Manager', href: '/admin/media', icon: UploadCloud },
        { name: 'Album Import', href: '/admin/album-import', icon: UploadCloud },
        { name: 'Stock Manager', href: '/admin/stock-manager', icon: Package },
    ];

    const isActive = href => {
        if (href === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(href);
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'
                    } flex-shrink-0`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200">
                        {sidebarOpen ? (
                            <Link
                                to="/"
                                className="text-2xl font-serif font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                            >
                                OKASINA
                            </Link>
                        ) : (
                            <Link to="/" className="text-2xl font-serif font-bold text-blue-600">
                                O
                            </Link>
                        )}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigation.map(item => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active
                                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon size={20} className={active ? 'text-blue-600' : 'text-gray-400'} />
                                    {sidebarOpen && (
                                        <>
                                            <span className="flex-1">{item.name}</span>
                                            {active && <ChevronRight size={16} />}
                                        </>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info & Logout */}
                    {sidebarOpen && (
                        <div className="p-4 border-t border-gray-200 space-y-2">
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@okasina.com'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut size={20} />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-gray-900">
                            {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Interactive insights about your users and orders - made for market leaders
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                            View Store
                        </Link>
                        <Link
                            to="/admin/stock-manager"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            Bulk Import
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-8">{children}</main>
            </div>
        </div>
    );
}
