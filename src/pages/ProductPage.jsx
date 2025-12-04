import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useComparison } from '../contexts/ComparisonContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Helmet } from 'react-helmet-async';
import { Star, Truck, ShieldCheck, ArrowLeft, Ruler, ZoomIn, ArrowRightLeft } from 'lucide-react';
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

    const sizes = product.sizes ? (typeof product.sizes === 'string' ? product.sizes.split(',') : product.sizes).map(s => s.trim()) : [];

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

                        <p className="text-2xl font-medium text-gray-900 mb-8">
                            {formatPrice(product.price)}
                        </p>

                        {/* Tabbed Content */}
                        <ProductTabs product={product} />

                        {/* Size Selector */}
                        {sizes.length > 0 && (
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
                                    {sizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`min-w-[60px] h-14 px-3 flex items-center justify-center border-2 text-sm font-bold ${selectedSize === size
                                                ? 'border-black bg-black text-white'
                                                : 'border-gray-300 text-gray-700 hover:border-black bg-white'
                                                } transition-all duration-200 hover:scale-105`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-4 mb-8">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                        addToCart({ ...product, selectedSize });
                                        addToast(`Added ${product.name} to cart`);
                                    } catch (err) {
                                        console.error('Add to Cart failed:', err);
                                    }
                                }}
                                className="w-full bg-black text-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                            >
                                Add to Cart
                            </button>

                            <button
                                onClick={() => addToCompare(product)}
                                className="w-full border border-gray-300 text-gray-700 py-3 text-sm font-bold uppercase tracking-widest hover:border-black hover:text-black transition-colors flex items-center justify-center"
                            >
                                <ArrowRightLeft size={16} className="mr-2" /> Compare Product
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
