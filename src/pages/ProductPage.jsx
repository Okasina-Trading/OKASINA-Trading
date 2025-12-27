import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useComparison } from '../contexts/ComparisonContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Helmet } from 'react-helmet-async';
import { Star, Truck, ShieldCheck, ArrowLeft, Ruler, ZoomIn, ArrowRightLeft, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReviewSection from '../components/reviews/ReviewSection';
import RelatedProducts from '../components/product/RelatedProducts';
import SizeGuideModal from '../components/product/SizeGuideModal';
import SocialShare from '../components/product/SocialShare';
import RecentlyViewed, { addToRecentlyViewed } from '../components/product/RecentlyViewed';
import ProductTabs from '../components/product/ProductTabs';
import RecommendedProducts from '../components/products/RecommendedProducts';
import { useAnalytics } from '../hooks/useAnalytics';

export default function ProductPage() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const { addToast } = useToast();
    const { addToCompare } = useComparison();
    const { formatPrice } = useCurrency();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState('');
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const { trackViewProduct } = useAnalytics();

    useEffect(() => {
        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
            setProduct(null);
        } else {
            setProduct(data);
            addToRecentlyViewed(data);
            trackViewProduct(data);
        }
        setLoading(false);
    };

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePos({ x, y });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

    // Default sizes for products without sizes defined
    const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', '10XL', '11XL', '12XL', '13XL'];
    const rawSizes = product.sizes ? (typeof product.sizes === 'string' ? product.sizes.split(',') : product.sizes).map(s => s.trim()) : [];
    const sizes = rawSizes.length > 0 ? rawSizes : (product.category === 'Accessories' ? ['One Size'] : DEFAULT_SIZES);

    // Calculate discount if applicable
    const hasDiscount = product.original_price && product.original_price > product.price;
    const discountPercent = hasDiscount ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;

    return (
        <div className="min-h-screen bg-white py-12">
            <Helmet>
                <title>{product.name} | Okasina Fashion</title>
                <meta name="description" content={product.description || `Buy ${product.name} at Okasina Fashion.`} />
                <meta property="og:title" content={product.name} />
                <meta property="og:description" content={product.description} />
                <meta property="og:image" content={product.image_url || product.image} />
            </Helmet>

            <SizeGuideModal
                isOpen={showSizeGuide}
                onClose={() => setShowSizeGuide(false)}
                category={product.category}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/shop" className="inline-flex items-center text-gray-500 hover:text-black mb-8 transition-colors">
                    <ArrowLeft size={16} className="mr-2" /> Back to Shop
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
                    {/* Image Section with Zoom */}
                    <div
                        className="bg-gray-50 aspect-[3/4] overflow-hidden relative cursor-crosshair"
                        onMouseEnter={() => setIsZoomed(true)}
                        onMouseLeave={() => setIsZoomed(false)}
                        onMouseMove={handleMouseMove}
                    >
                        <img
                            src={product.image_url || product.image}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform duration-200 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                            style={isZoomed ? {
                                transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                            } : {}}
                            onError={(e) => (e.target.src = 'https://via.placeholder.com/600x800?text=No+Image')}
                        />
                        {!isZoomed && (
                            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-600 pointer-events-none">
                                <ZoomIn size={20} />
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                            <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">{product.category}</p>
                            <SocialShare product={product} />
                        </div>

                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">{product.name}</h1>

                        {/* Rating Summary */}
                        <div className="flex items-center mb-6">
                            <div className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                            </div>
                            <span className="ml-2 text-sm text-gray-500">(See Reviews Below)</span>
                        </div>

                        <div className="mb-8">
                            {hasDiscount ? (
                                <div className="flex items-center gap-3">
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatPrice(product.price)}
                                    </p>
                                    <p className="text-xl text-gray-400 line-through">
                                        {formatPrice(product.original_price)}
                                    </p>
                                    <span className="bg-red-100 text-red-800 text-sm font-bold px-3 py-1 rounded">
                                        -{discountPercent}%
                                    </span>
                                </div>
                            ) : (
                                <p className="text-2xl font-medium text-gray-900">
                                    {formatPrice(product.price)}
                                </p>
                            )}
                        </div>

                        {/* Tabbed Content */}
                        <ProductTabs product={product} />

                        {/* Size Selector - Always shown with default sizes if none specified */}
                        <div className="mb-8 border border-gray-200 p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base font-bold uppercase tracking-widest">Select Size</h3>
                                <button
                                    onClick={() => setShowSizeGuide(true)}
                                    className="text-xs text-gray-500 underline flex items-center hover:text-black"
                                >
                                    <Ruler size={14} className="mr-1" /> Size Guide
                                </button>
                            </div>
                            {selectedSize && (
                                <div className="mb-3 text-sm text-gray-700">
                                    <span className="font-medium">Selected:</span> <span className="font-bold text-black">{selectedSize}</span>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                                {sizes.map((size) => {
                                    // Check Variant Stock
                                    let isOutOfStock = false;
                                    let stockCount = null;

                                    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
                                        const variant = product.variants.find(v => v.size === size);
                                        if (variant) {
                                            stockCount = variant.stock;
                                            if (variant.stock <= 0) isOutOfStock = true;
                                        }
                                    } else {
                                        // Legacy / Simple Product: Check global stock
                                        if (product.stock_qty <= 0) isOutOfStock = true;
                                    }

                                    return (
                                        <button
                                            key={size}
                                            onClick={() => !isOutOfStock && setSelectedSize(size)}
                                            disabled={isOutOfStock}
                                            className={`min-w-[60px] h-14 px-3 flex flex-col items-center justify-center border-2 text-sm font-bold transition-all duration-200 
                                                ${isOutOfStock
                                                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                                    : selectedSize === size
                                                        ? 'border-black bg-black text-white hover:scale-105'
                                                        : 'border-gray-300 text-gray-700 hover:border-black bg-white hover:scale-105'
                                                }`}
                                            title={isOutOfStock ? "Out of Stock" : `${stockCount !== null ? stockCount + ' left' : 'In Stock'}`}
                                        >
                                            <span>{size}</span>
                                            {stockCount !== null && stockCount < 5 && stockCount > 0 && (
                                                <span className="text-[10px] font-normal leading-none mt-0.5 opacity-80">{stockCount} left</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-4 mb-8">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    if (!selectedSize) {
                                        addToast('Please select a size first');
                                        return;
                                    }

                                    // Verify variant again
                                    if (product.variants && Array.isArray(product.variants)) {
                                        const variant = product.variants.find(v => v.size === selectedSize);
                                        if (variant && variant.stock <= 0) {
                                            addToast(`Sorry, size ${selectedSize} is out of stock`);
                                            return;
                                        }
                                    } else if (product.stock_qty <= 0) {
                                        addToast('Sorry, this product is out of stock');
                                        return;
                                    }

                                    try {
                                        addToCart({ ...product, selectedSize });
                                        addToast(`Added ${product.name} to cart`);
                                    } catch (err) {
                                        console.error('Add to Cart failed:', err);
                                    }
                                }}
                                className={`w-full py-4 text-sm font-bold uppercase tracking-widest transition-colors ${(product.stock_qty <= 0 && (!product.variants || product.variants.length === 0)) // Global OOS
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-800'
                                    }`}
                                disabled={(product.stock_qty <= 0 && (!product.variants || product.variants.length === 0))}
                            >
                                {(product.stock_qty <= 0 && (!product.variants || product.variants.length === 0)) ? 'Out of Stock' : 'Add to Cart'}
                            </button>

                            <button
                                onClick={() => addToCompare(product)}
                                className="w-full border border-gray-300 text-gray-700 py-3 text-sm font-bold uppercase tracking-widest hover:border-black hover:text-black transition-colors flex items-center justify-center"
                            >
                                <ArrowRightLeft size={16} className="mr-2" /> Compare Product
                            </button>

                            <button
                                onClick={() => toggleWishlist(product)}
                                className={`w-full border py-3 text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center ${isInWishlist(product.id)
                                    ? 'border-red-500 text-red-500 hover:bg-red-50'
                                    : 'border-gray-300 text-gray-700 hover:border-black hover:text-black'
                                    }`}
                            >
                                <Heart size={16} className={`mr-2 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                                {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            </button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                                <Truck size={18} className="mr-3 text-gray-400" />
                                <span>Delivery from Rs 100</span>
                            </div>
                            <div className="flex items-center">
                                <ShieldCheck size={18} className="mr-3 text-gray-400" />
                                <span>Authentic Quality</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recently Viewed */}
                <div className="mb-16">
                    <RecentlyViewed currentProductId={id} />
                </div>

                {/* Related Products */}
                <RelatedProducts currentProductId={id} category={product.category} />

                {/* AI Recommendations */}
                <RecommendedProducts
                    title="You May Also Like"
                    contextType="product"
                    contextId={id}
                />

                {/* Reviews Section */}
                <ReviewSection productId={id} />
            </div>
        </div>
    );
}
