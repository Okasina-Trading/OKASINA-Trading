import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Heart, Menu, X, Globe } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import MobileMenu from './MobileMenu';

import SearchBar from './SearchBar';

// HeaderNew component with mobile menu and search
export default function HeaderNew() {
    const { cart } = useCart();
    const { currency, setCurrency, isMauritius, symbols } = useCurrency();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Calculate total items safely
    const totalItems = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

    return (
        <header className="sticky top-0 z-[70] bg-white/80 backdrop-blur-md border-b border-gray-100 h-20">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="text-3xl font-serif font-bold text-gray-900 tracking-widest z-50">
                    OKASINA
                </Link>

                {/* Search Bar - Hidden on mobile */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                    <SearchBar />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-8 mr-8">
                    <Link to="/" className="text-sm font-medium text-gray-700 hover:text-black uppercase tracking-widest transition-colors">Home</Link>
                    <Link to="/shop?category=clothing" className="text-sm font-medium text-gray-700 hover:text-black uppercase tracking-widest transition-colors">Clothing</Link>
                    <Link to="/shop?category=accessories" className="text-sm font-medium text-gray-700 hover:text-black uppercase tracking-widest transition-colors">Accessories</Link>
                </nav>

                {/* Right Icons */}
                <div className="flex items-center gap-6">
                    {/* Currency Selector */}
                    <div className="hidden sm:flex items-center gap-1">
                        <Globe size={16} className="text-gray-400" />
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            disabled={isMauritius}
                            className={`bg-transparent text-sm font-medium focus:outline-none cursor-pointer ${isMauritius ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-black'}`}
                            title={isMauritius ? "Currency locked to MUR for your region" : "Select Currency"}
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="MUR">MUR (Rs)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                    </div>

                    <Link to="/wishlist" className="text-gray-400 hover:text-black transition-colors hidden sm:block" aria-label="Wishlist">
                        <Heart size={20} />
                    </Link>
                    <Link to="/account" className="text-gray-400 hover:text-black transition-colors hidden sm:block" aria-label="Account">
                        <User size={20} />
                    </Link>

                    {/* Cart Link - Wrapped to prevent layout issues */}
                    <div className="relative">
                        <Link to="/cart" className="text-gray-900 hover:text-gray-600 transition-colors block" aria-label="Shopping Cart">
                            <ShoppingCart size={20} />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full pointer-events-none">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="lg:hidden hover:text-black focus:outline-none z-50"
                        aria-label="Toggle Menu"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </div>

            {/* Premium Mobile Menu */}
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </header>
    );
}
