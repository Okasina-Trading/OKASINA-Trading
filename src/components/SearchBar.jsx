import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Camera } from 'lucide-react';
import { supabase } from '../supabase';
import { sanitizeInput } from '../utils/sanitize';
import VisualSearchModal from './VisualSearchModal';

export default function SearchBar({ className = "" }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    // ... (keep existing effects)

    // Load search history from localStorage
    useEffect(() => {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        setSearchHistory(history);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (searchQuery) => {
            if (!searchQuery.trim()) {
                setResults([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, name, sku, category, selling_price, image_url_1, status')
                    .or(`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
                    .eq('status', 'published')
                    .limit(8);

                if (error) throw error;
                setResults(data || []);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300),
        []
    );



    const handleInputChange = (e) => {
        const value = e.target.value;
        const sanitizedValue = sanitizeInput(value);
        setQuery(value); // Keep display value as is for better UX
        setIsOpen(true);
        debouncedSearch(sanitizedValue);
    };

    const handleSelectProduct = (product) => {
        // Add to search history
        const newHistory = [
            product.name,
            ...searchHistory.filter(item => item !== product.name)
        ].slice(0, 5);

        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));

        // Navigate to product
        navigate(`/product/${product.id}`);
        setQuery('');
        setIsOpen(false);
    };

    const handleHistoryClick = (term) => {
        setQuery(term);
        debouncedSearch(term);
        setIsOpen(true);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
            setIsOpen(false);
        }
    };

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            <form onSubmit={handleSubmit} className="relative w-full">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                />
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />

                {/* Visual Search Trigger */}
                <button
                    type="button"
                    onClick={() => setIsVisualSearchOpen(true)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                    title="Search by Image"
                >
                    <Camera size={18} />
                </button>

                {isLoading && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-[#d4af37] border-t-transparent rounded-full"></div>
                    </div>
                )}
            </form>

            {/* Visual Search Modal */}
            <VisualSearchModal
                isOpen={isVisualSearchOpen}
                onClose={() => setIsVisualSearchOpen(false)}
            />

            {/* Search Results Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                    {query.trim() === '' && searchHistory.length > 0 && (
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-semibold text-gray-700">Recent Searches</h3>
                                <button
                                    onClick={clearHistory}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                    type="button"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="space-y-1">
                                {searchHistory.map((term, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleHistoryClick(term)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"
                                        type="button"
                                    >
                                        <Search className="inline h-4 w-4 mr-2 text-gray-400" />
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {query.trim() !== '' && !isLoading && results.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>No products found for "{query}"</p>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="py-2">
                            {results.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleSelectProduct(product)}
                                    className="w-full px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                                    type="button"
                                >
                                    <img
                                        src={product.image_url_1 || '/placeholder-product.jpg'}
                                        alt={product.name}
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.category} • {product.sku}</p>
                                    </div>
                                    <p className="font-semibold text-[#d4af37]">
                                        ₹{product.selling_price?.toLocaleString()}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

