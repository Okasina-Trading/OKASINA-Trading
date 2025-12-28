import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight, Instagram, Facebook, Twitter } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function MobileMenu({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { cart } = useCart();
    const [searchQuery, setSearchQuery] = useState('');

    const totalItems = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
            onClose();
        }
    };

    const menuItems = [
        { label: 'Home', href: '/' },
        { label: 'Clothing', href: '/shop?category=clothing' },
        { label: 'Accessories', href: '/shop?category=accessories' },
        { label: 'New Arrivals', href: '/shop?sort=newest' },
        { label: 'Sale', href: '/shop?sort=price_asc' },
    ];

    const secondaryItems = [
        { label: 'My Account', href: '/account' },
        { label: 'Wishlist', href: '/wishlist' },
        { label: 'Cart', href: '/cart', badge: totalItems },
    ];

    return (
        { isOpen && (
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={onClose}
                />

                {/* Menu Container */}
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 right-0 w-full max-w-md h-[100dvh] bg-white z-[70] lg:hidden flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                        <span className="text-2xl font-serif font-bold tracking-widest">MENU</span>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-6 pb-2 flex-shrink-0">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black transition-all"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        </form>
                    </div>

                    {/* Main Links */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <nav className="flex flex-col space-y-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.label}
                                    to={item.href}
                                    onClick={onClose}
                                    className="flex items-center justify-between py-4 text-2xl font-serif text-gray-900 border-b border-gray-50 hover:pl-4 transition-all duration-300 group"
                                >
                                    <span>{item.label}</span>
                                    <ChevronRight className="text-gray-300 group-hover:text-black transition-colors" size={20} />
                                </Link>
                            ))}
                        </nav>

                        {/* Secondary Links */}
                        <div className="mt-8 space-y-4">
                            {secondaryItems.map((item) => (
                                <Link
                                    key={item.label}
                                    to={item.href}
                                    onClick={onClose}
                                    className="flex items-center gap-3 text-gray-600 hover:text-black transition-colors font-medium"
                                >
                                    {item.label}
                                    {item.badge > 0 && (
                                        <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Footer / Socials */}
                    <div className="p-8 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                        <div className="flex justify-center space-x-8">
                            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook size={24} /></a>
                            <a href="#" className="text-gray-400 hover:text-pink-600 transition-colors"><Instagram size={24} /></a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors"><Twitter size={24} /></a>
                        </div>
                        <p className="text-center text-gray-400 text-xs mt-6 uppercase tracking-widest">
                            © 2025 Okasina Fashion
                        </p>
                    </div>
                </motion.div>
            </>
        )}
            </AnimatePresence >
    );
}
