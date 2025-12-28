import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { supabase } from '../supabase';
import NewsletterSignup from '../components/NewsletterSignup';
import RecommendedProducts from '../components/products/RecommendedProducts';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeaturedProducts();
    }, []);

    async function fetchFeaturedProducts() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(8);

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
                        alt="Elegant Fashion"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
                    <p className="text-yellow-400 font-bold tracking-[0.2em] uppercase mb-4 text-sm md:text-base animate-fade-in-up">
                        New Collection 2025
                    </p>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 leading-tight tracking-tight animate-fade-in-up delay-100">
                        Elegance Redefined
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up delay-200">
                        Discover the finest collection of modern Indian wear and accessories, curated for the sophisticated individual who values tradition and style.
                    </p>
                    <Link
                        to="/shop"
                        className="inline-block bg-white text-gray-900 hover:bg-gray-100 transition-colors px-10 py-4 text-sm font-bold tracking-widest uppercase animate-fade-in-up delay-300"
                    >
                        Shop Collection
                    </Link>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center opacity-70 animate-bounce">
                        <span className="text-[10px] uppercase tracking-widest mb-2">Scroll</span>
                        <div className="w-[1px] h-12 bg-white/50"></div>
                    </div>
                </div>
            </section>

            {/* Featured Products Section */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">Featured Collection</h2>
                    <div className="w-16 h-[2px] bg-yellow-500 mx-auto" />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <p>No products found. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

                <div className="text-center mt-16">
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 border-b-2 border-gray-900 pb-1 text-sm font-bold uppercase tracking-widest hover:text-yellow-600 hover:border-yellow-600 transition-colors"
                    >
                        View All Products
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* AI Recommendations */}
            <div className="container mx-auto px-4">
                <RecommendedProducts
                    title="Trending Now"
                    contextType="home"
                />
            </div>

            <NewsletterSignup />
        </div>
    );
}
