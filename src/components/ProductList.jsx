import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import ProductCard from './ProductCard';
import { ProductGridSkeleton } from './common/SkeletonLoader';
import ProductQuickView from './product/ProductQuickView';

export default function ProductList({ filters, viewMode = 'grid' }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        // Fetch ALL active products initially
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active');

        if (!error) {
            // Normalize data
            const normalized = (data || []).map(p => ({
                ...p,
                category: p.category ?? "Accessories",
                price_mur: p.price_mur || (p.price ? p.price * 45 : 0)
            }));
            setProducts(normalized);
        }
        setLoading(false);
    };

    // Memoize filtering logic to prevent unnecessary recalculations
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            // 1. Category Filter
            if (filters?.category && product.category.toLowerCase() !== filters.category.toLowerCase()) {
                return false;
            }

            // 2. Sub-category Filter
            if (filters?.subcategory) {
                if (product.subcategory !== filters.subcategory) {
                    return false;
                }
            }

            // 3. Search Filter
            if (filters?.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchableText = `${product.name} ${product.description || ''} ${product.category}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            // 4. Sale Filter
            if (filters?.sale) {
                if (!product.original_price || product.price >= product.original_price) {
                    return false;
                }
            }

            // 5. Price Filter
            if (filters?.priceRange) {
                const price = product.price_mur;
                if (price < filters.priceRange.min || price > filters.priceRange.max) {
                    return false;
                }
            }

            // 6. Availability Filter
            if (filters?.availability && filters.availability !== 'all') {
                if (filters.availability === 'in_stock') {
                    if ((product.stock_qty || 0) <= 0) return false;
                } else if (filters.availability === 'out_of_stock') {
                    if ((product.stock_qty || 0) > 0) return false;
                }
            }

            return true;
        });
    }, [products, filters]);

    const handleQuickView = useCallback((product) => {
        setQuickViewProduct(product);
    }, []);

    const handleCloseQuickView = useCallback(() => {
        setQuickViewProduct(null);
    }, []);

    if (loading) {
        return <ProductGridSkeleton count={6} />;
    }

    if (filteredProducts.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-light text-lg">No products found matching your filters.</p>
                <button
                    onClick={() => window.location.href = '/shop'}
                    className="text-[#d4af37] underline mt-2 inline-block hover:text-[#b5952f] transition-colors"
                >
                    Clear all filters
                </button>
            </div>
        );
    }

    return (
        <>
            <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                : 'flex flex-col gap-4'
            }>
                {filteredProducts.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={handleQuickView}
                        viewMode={viewMode}
                    />
                ))}
            </div>

            {/* Quick View Modal */}
            <ProductQuickView
                product={quickViewProduct}
                isOpen={!!quickViewProduct}
                onClose={handleCloseQuickView}
            />
        </>
    );
}
