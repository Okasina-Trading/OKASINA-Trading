import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import LazyImage from './common/LazyImage';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useComparison } from '../contexts/ComparisonContext';
import { useCurrency } from '../contexts/CurrencyContext';

const ProductCard = memo(({ product, onQuickView, viewMode = 'grid' }) => {
    const { addToCart } = useCart();
    const { addToast } = useToast();
    const { isInComparison, toggleComparison } = useComparison();
    const { formatPrice } = useCurrency();

    const isCompared = isInComparison(product.id);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
        addToast(`Added ${product.name} to cart`);
    };

    const handleQuickView = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuickView) {
            onQuickView(product);
        }
    };

    const handleToggleCompare = (e) => {
        e.stopPropagation();
        toggleComparison(product);
    };

    // List View Layout
    if (viewMode === 'list') {
        return (
            <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex gap-6 p-4">
                {/* Image */}
                <div className="w-48 h-64 flex-shrink-0 overflow-hidden bg-gray-100 relative rounded">
                    <div className="absolute top-2 left-2 z-10">
                        <label className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-2 py-1.5 rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors">
                            <input
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                checked={isCompared}
                                onChange={handleToggleCompare}
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">Compare</span>
                        </label>
                    </div>

                    <Link to={`/product/${product.id}`}>
                        <LazyImage
                            src={product.image_url || product.image || 'https://via.placeholder.com/400x600?text=No+Image'}
                            alt={product.name}
                            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                    </Link>

                    {product.stock_qty < 5 && product.stock_qty > 0 && (
                        <span className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                            Low Stock
                        </span>
                    )}
                    {product.mrp > product.price_mur && (
                        <span className="absolute top-2 right-2 bg-[#d4af37] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                            {Math.round(((product.mrp - product.price_mur) / product.mrp) * 100)}% OFF
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{product.category}</p>
                        <h3 className="text-xl font-medium text-gray-900 mb-3">
                            <Link to={`/product/${product.id}`} className="hover:text-[#d4af37] transition-colors">
                                {product.name}
                            </Link>
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                            {product.description || 'Premium quality product from our collection.'}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-gray-900">
                                {formatPrice(product.price)}
                            </p>
                            {product.mrp > product.price_mur && (
                                <p className="text-lg text-gray-400 line-through">
                                    {formatPrice(product.mrp)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 bg-black text-white py-3 px-6 text-sm font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <ShoppingCart size={16} />
                            Add to Cart
                        </button>
                        {onQuickView && (
                            <button
                                onClick={handleQuickView}
                                className="bg-gray-100 text-black py-3 px-6 text-sm font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <Eye size={16} />
                                Quick View
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Grid View Layout (default)
    const isOutOfStock = product.stock_qty === 0;

    return (
        <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            {/* Image Container */}
            <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100 relative">
                {/* Compare Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                    <label className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-2 py-1.5 rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors">
                        <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                            checked={isCompared}
                            onChange={handleToggleCompare}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">Compare</span>
                    </label>
                </div>

                <Link to={`/product/${product.id}`}>
                    <LazyImage
                        src={product.image_url || product.image || 'https://via.placeholder.com/400x600?text=No+Image'}
                        alt={product.name}
                        className={`h-full w-full object-contain md:object-cover object-center transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'opacity-75 grayscale' : ''}`}
                    />

                    {/* Sold Out Overlay */}
                    {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                            <span className="bg-white/90 text-black px-4 py-2 text-sm font-bold uppercase tracking-widest shadow-lg transform -rotate-12 border-2 border-black">
                                Sold Out
                            </span>
                        </div>
                    )}
                </Link>

                {/* Overlay Actions (Desktop) */}
                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2 justify-end bg-gradient-to-t from-black/50 to-transparent pb-6">
                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`w-full py-2.5 px-4 text-sm font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center justify-center gap-2 ${isOutOfStock
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-white text-black hover:bg-[#d4af37] hover:text-white'
                            }`}
                    >
                        <ShoppingCart size={16} />
                        {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                    </button>
                    {onQuickView && (
                        <button
                            onClick={handleQuickView}
                            className="w-full bg-black/80 text-white py-2.5 px-4 text-sm font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2 backdrop-blur-sm"
                        >
                            <Eye size={16} />
                            Quick View
                        </button>
                    )}
                </div>

                {/* Badges */}
                {product.stock_qty < 5 && product.stock_qty > 0 && (
                    <span className="absolute top-12 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                        Low Stock
                    </span>
                )}
                {product.mrp > product.price_mur && (
                    <span className="absolute top-2 right-2 bg-[#d4af37] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                        {Math.round(((product.mrp - product.price_mur) / product.mrp) * 100)}% OFF
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.category}</p>
                        <h3 className="text-sm text-gray-900 font-medium line-clamp-2 min-h-[2.5em]">
                            <Link to={`/product/${product.id}`} className="hover:text-[#d4af37] transition-colors">
                                {product.name}
                            </Link>
                        </h3>
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price)}
                    </p>
                    {product.mrp > product.price_mur && (
                        <p className="text-sm text-gray-400 line-through">
                            {formatPrice(product.mrp)}
                        </p>
                    )}
                </div>
            </div>

            {/* Mobile Add to Cart Button */}
            <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full mt-3 lg:hidden py-2 px-4 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 rounded ${isOutOfStock
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
            >
                <ShoppingCart size={14} />
                {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>
        </div>
    );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
