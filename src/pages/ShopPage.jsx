import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductList from '../components/ProductList';
import ProductFilters from '../components/shop/ProductFilters';
import { Grid, List } from 'lucide-react';

export default function ShopPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('productViewMode') || 'grid';
    });

    // Initialize filters from URL
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || null,
        subcategory: searchParams.get('subcategory') || null,
        search: searchParams.get('search') || null,
        sale: searchParams.get('sale') === 'true',
        priceRange: null,
        availability: 'all', // Added availability filter
        sort: 'newest'
    });

    // Update URL when filters change
    useEffect(() => {
        const params = {};
        if (filters.category) params.category = filters.category;
        if (filters.subcategory) params.subcategory = filters.subcategory;
        if (filters.search) params.search = filters.search;
        if (filters.sale) params.sale = 'true';
        setSearchParams(params);
    }, [filters, setSearchParams]);

    // Save view mode preference
    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        localStorage.setItem('productViewMode', mode);
    };

    // Helper to format title
    const title = filters.search
        ? `Search results for "${filters.search}"`
        : filters.sale
            ? "On Sale"
            : filters.subcategory
                ? filters.subcategory
                : filters.category
                    ? filters.category
                    : "Our Collection";

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-baseline justify-between border-b border-gray-200 pb-6">
                    <h1 className="text-4xl font-serif font-bold text-gray-900">{title}</h1>

                    <div className="flex items-center gap-4">
                        {/* View Mode Toggle */}
                        <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => handleViewModeChange('grid')}
                                className={`p-2 rounded transition-colors ${viewMode === 'grid'
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                title="Grid View"
                            >
                                <Grid size={20} />
                            </button>
                            <button
                                onClick={() => handleViewModeChange('list')}
                                className={`p-2 rounded transition-colors ${viewMode === 'list'
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                title="List View"
                            >
                                <List size={20} />
                            </button>
                        </div>

                        <button
                            type="button"
                            className="-m-2 ml-4 p-2 text-gray-400 hover:text-gray-500 sm:ml-6 lg:hidden"
                            onClick={() => setMobileFiltersOpen(true)}
                        >
                            <span className="sr-only">Filters</span>
                            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                <section aria-labelledby="products-heading" className="pt-6 pb-24">
                    <div className="flex flex-col gap-y-6">
                        {/* Filters - Now at the top */}
                        <ProductFilters
                            filters={filters}
                            setFilters={setFilters}
                            mobileOpen={mobileFiltersOpen}
                            setMobileOpen={setMobileFiltersOpen}
                        />

                        {/* Product Grid - Full width */}
                        <div className="w-full">
                            <ProductList filters={filters} viewMode={viewMode} />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
