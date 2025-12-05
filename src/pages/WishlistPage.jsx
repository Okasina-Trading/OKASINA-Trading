import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';

export default function WishlistPage() {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchWishlist();
    }, [user]);

    const fetchWishlist = async () => {
        const { data, error } = await supabase
            .from('wishlists')
            .select('*, products(*)')
            .eq('user_id', user.id);

        if (!error) {
            setWishlistItems(data);
        }
        setLoading(false);
    };

    const removeFromWishlist = async (wishlistId) => {
        const { error } = await supabase
            .from('wishlists')
            .delete()
            .eq('id', wishlistId);

        if (!error) {
            setWishlistItems(prev => prev.filter(item => item.id !== wishlistId));
            addToast('Removed from wishlist', 'success');
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-serif font-bold mb-8">My Wishlist</h1>

            {loading ? (
                <p>Loading wishlist...</p>
            ) : wishlistItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">Your wishlist is empty.</p>
                    <Link to="/shop" className="inline-block bg-black text-white px-6 py-3 font-bold uppercase text-sm hover:bg-gray-800">
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {wishlistItems.map((item) => {
                        const product = item.products;
                        if (!product) return null; // Handle case where product might be deleted

                        // Check stock status
                        const isOutOfStock = product.stock_qty === 0;
                        const isLowStock = product.stock_qty > 0 && product.stock_qty <= 5;

                        // Check if product has sizes
                        const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];
                        const rawSizes = product.sizes ? (typeof product.sizes === 'string' ? product.sizes.split(',') : product.sizes).map(s => s.trim()) : [];
                        const hasSizes = rawSizes.length > 0 || (product.category !== 'Accessories');

                        return (
                            <div key={item.id} className="group relative">
                                <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative">
                                    <img
                                        src={product.image_url || product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />

                                    {/* Stock Status Badge */}
                                    {isOutOfStock && (
                                        <div className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase">
                                            Out of Stock
                                        </div>
                                    )}
                                    {isLowStock && !isOutOfStock && (
                                        <div className="absolute top-2 left-2 bg-orange-500 text-white px-3 py-1 text-xs font-bold uppercase">
                                            Only {product.stock_qty} Left
                                        </div>
                                    )}

                                    <button
                                        onClick={() => removeFromWishlist(item.id)}
                                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <Link to={`/product/${product.id}`}>
                                    <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition-colors">{product.name}</h3>
                                </Link>

                                <p className="text-gray-500 mt-1 mb-2">
                                    Rs {product.price_mur?.toLocaleString() || (product.price * 45).toLocaleString()}
                                </p>

                                {/* Stock Status Text */}
                                <div className="mb-3 text-sm">
                                    {isOutOfStock ? (
                                        <p className="text-red-600 font-medium">⚠️ Currently unavailable</p>
                                    ) : isLowStock ? (
                                        <p className="text-orange-600 font-medium">⚡ Low stock - order soon!</p>
                                    ) : (
                                        <p className="text-green-600 font-medium">✓ In stock</p>
                                    )}
                                </div>

                                {/* Add to Cart Button */}
                                {isOutOfStock ? (
                                    <Link
                                        to={`/product/${product.id}`}
                                        className="w-full border border-gray-300 py-2 text-sm font-bold uppercase text-gray-400 cursor-not-allowed flex items-center justify-center"
                                    >
                                        View Product
                                    </Link>
                                ) : hasSizes ? (
                                    <Link
                                        to={`/product/${product.id}`}
                                        className="w-full border border-black py-2 text-sm font-bold uppercase hover:bg-black hover:text-white transition-colors flex items-center justify-center"
                                    >
                                        <ShoppingBag size={16} className="mr-2" /> Select Size & Add
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => {
                                            addToCart(product);
                                            addToast(`Added ${product.name} to cart`);
                                        }}
                                        className="w-full border border-black py-2 text-sm font-bold uppercase hover:bg-black hover:text-white transition-colors flex items-center justify-center"
                                    >
                                        <ShoppingBag size={16} className="mr-2" /> Add to Cart
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
