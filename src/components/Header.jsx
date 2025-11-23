import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, User, ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { cart } = useCart();

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20 gap-4 lg:gap-8">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-3xl font-serif font-bold text-gray-900 tracking-widest">
                            OKASINA
                        </Link>
                    </div>

                    {/* Search Bar - Hidden on mobile */}
                    <div className="hidden md:flex flex-1 max-w-md">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search for products..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-sm py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex space-x-8 text-xs font-bold tracking-widest uppercase text-gray-600">
                        <Link to="/" className="hover:text-black transition-colors">Home</Link>
                        <Link to="/shop?category=clothing" className="hover:text-black transition-colors">Clothing</Link>
                        <Link to="/shop?category=accessories" className="hover:text-black transition-colors">Accessories</Link>
                        <Link to="/orders" className="hover:text-black transition-colors">Orders</Link>
                        <Link to="/feedback" className="hover:text-black transition-colors">Feedback</Link>
                    </nav>

                    {/* Icons */}
                    <div className="flex items-center space-x-6 text-gray-600">
                        <Link to="/wishlist" className="hover:text-black transition-colors">
                            <Heart size={20} />
                        </Link>
                        <Link to="/login" className="hover:text-black transition-colors">
                            <User size={20} />
                        </Link>
                        <Link to="/cart" className="hover:text-black transition-colors relative">
                            <ShoppingCart size={20} />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden hover:text-black focus:outline-none"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-sm py-2 px-4 text-sm"
                            />
                        </div>
                        <Link to="/" className="block py-2 text-sm font-bold uppercase tracking-widest text-gray-800">Home</Link>
                        <Link to="/shop?category=clothing" className="block py-2 text-sm font-bold uppercase tracking-widest text-gray-800">Clothing</Link>
                        <Link to="/shop?category=accessories" className="block py-2 text-sm font-bold uppercase tracking-widest text-gray-800">Accessories</Link>
                        <Link to="/orders" className="block py-2 text-sm font-bold uppercase tracking-widest text-gray-800">Orders</Link>
                        <Link to="/feedback" className="block py-2 text-sm font-bold uppercase tracking-widest text-gray-800">Feedback</Link>
                    </div>
                </div>
            )}
        </header>
    );
}
