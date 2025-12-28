import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

export default function ProductFilters({ filters, setFilters, mobileOpen, setMobileOpen }) {
    const categories = [
        {
            name: 'Clothing',
            subcategories: [
                'Churidar',
                'Pant Set',
                'Cord Set',
                'Maxi Dress',
                'Gown',
                'Lehenga',
                'Kurti'
            ]
        },
        {
            name: 'Accessories',
            subcategories: [
                'Jewelry',
                'Bags',
                'Scarves',
                'Footwear'
            ]
        }
    ];

    const priceRanges = [
        { label: 'Under Rs 1,000', min: 0, max: 1000 },
        { label: 'Rs 1,000 - Rs 2,500', min: 1000, max: 2500 },
        { label: 'Rs 2,500 - Rs 5,000', min: 2500, max: 5000 },
        { label: 'Over Rs 5,000', min: 5000, max: 100000 }
    ];

    const availabilityOptions = [
        { label: 'All Items', value: 'all' },
        { label: 'In Stock', value: 'in_stock' },
        { label: 'Out of Stock', value: 'out_of_stock' }
    ];

    const materials = ['Cotton', 'Silk', 'Linen', 'Chiffon', 'Georgette', 'Velvet', 'Denim'];
    const colors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Purple', 'Gold', 'Silver', 'Beige'];

    // Dropdown states for desktop
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    const handleCategoryChange = (category, subcategory = null) => {
        setFilters(prev => ({
            ...prev,
            category: category,
            subcategory: subcategory === prev.subcategory ? null : subcategory
        }));
        if (!subcategory) setActiveDropdown(null); // Close if just selecting main category, optional
    };

    const handlePriceChange = (range) => {
        setFilters(prev => ({
            ...prev,
            priceRange: prev.priceRange?.label === range.label ? null : range
        }));
        setActiveDropdown(null);
    };

    const handleAvailabilityChange = (value) => {
        setFilters(prev => ({ ...prev, availability: value }));
        setActiveDropdown(null);
    };

    const handleMaterialChange = (material) => {
        setFilters(prev => ({ ...prev, material: prev.material === material ? null : material }));
        setActiveDropdown(null);
    };

    const handleColorChange = (color) => {
        setFilters(prev => ({ ...prev, color: prev.color === color ? null : color }));
        setActiveDropdown(null);
    };

    const clearFilters = () => {
        setFilters(prev => ({
            ...prev,
            category: null,
            subcategory: null,
            priceRange: null,
            availability: 'all',
            material: null,
            color: null
        }));
        setActiveDropdown(null);
    };

    const hasActiveFilters = filters.category || filters.priceRange || filters.availability !== 'all' || filters.material || filters.color;

    return (
        <>
            {/* Mobile Filter Dialog Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setMobileOpen(false)}></div>
                    <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl animate-slide-in">
                        <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                            <button
                                type="button"
                                className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400"
                                onClick={() => setMobileOpen(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Mobile Filters Content */}
                        <form className="mt-4">
                            {/* Availability */}
                            <div className="px-4 py-6 border-b border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900">Availability</h3>
                                <div className="mt-4 space-y-4">
                                    {availabilityOptions.map((option) => (
                                        <div key={option.value} className="flex items-center">
                                            <input
                                                id={`mobile-availability-${option.value}`}
                                                name="availability"
                                                type="radio"
                                                checked={filters.availability === option.value}
                                                onChange={() => handleAvailabilityChange(option.value)}
                                                className="h-4 w-4 border-gray-300 text-yellow-600 focus:ring-yellow-500"
                                            />
                                            <label htmlFor={`mobile-availability-${option.value}`} className="ml-3 text-sm text-gray-600">
                                                {option.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="px-4 py-6 border-b border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900">Categories</h3>
                                <ul className="mt-4 space-y-4">
                                    {categories.map((category) => (
                                        <li key={category.name}>
                                            <button
                                                type="button"
                                                onClick={() => handleCategoryChange(category.name)}
                                                className={`text-sm block w-full text-left ${filters.category === category.name ? 'font-bold text-yellow-600' : 'text-gray-600'}`}
                                            >
                                                {category.name}
                                            </button>
                                            {filters.category === category.name && (
                                                <ul className="mt-2 ml-4 space-y-2">
                                                    {category.subcategories.map((sub) => (
                                                        <li key={sub}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCategoryChange(category.name, sub)}
                                                                className={`text-sm ${filters.subcategory === sub ? 'text-yellow-600 font-medium' : 'text-gray-500'}`}
                                                            >
                                                                {sub}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="px-4 py-6 border-b border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900">Price</h3>
                                <div className="mt-4 space-y-4">
                                    {priceRanges.map((range) => (
                                        <div key={range.label} className="flex items-center">
                                            <input
                                                id={`mobile-price-${range.label}`}
                                                name="price"
                                                type="radio"
                                                checked={filters.priceRange?.label === range.label}
                                                onChange={() => handlePriceChange(range)}
                                                className="h-4 w-4 border-gray-300 text-yellow-600 focus:ring-yellow-500"
                                            />
                                            <label htmlFor={`mobile-price-${range.label}`} className="ml-3 text-sm text-gray-600">
                                                {range.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Desktop Horizontal Filters */}
            <div className="hidden lg:block w-full" ref={dropdownRef}>
                <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                    <span className="text-sm font-medium text-gray-700">Filter by:</span>

                    {/* Category Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => toggleDropdown('category')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-colors ${filters.category
                                ? 'border-yellow-600 text-yellow-700 bg-yellow-50'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                }`}
                        >
                            {filters.category || 'Category'}
                            <ChevronDown size={16} />
                        </button>

                        {activeDropdown === 'category' && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 z-30 p-2">
                                {categories.map((category) => (
                                    <div key={category.name} className="mb-2 last:mb-0">
                                        <button
                                            onClick={() => handleCategoryChange(category.name)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 ${filters.category === category.name ? 'font-bold text-yellow-700 bg-yellow-50' : 'text-gray-700'
                                                }`}
                                        >
                                            {category.name}
                                        </button>
                                        {filters.category === category.name && (
                                            <div className="pl-4 mt-1 space-y-1">
                                                {category.subcategories.map((sub) => (
                                                    <button
                                                        key={sub}
                                                        onClick={() => handleCategoryChange(category.name, sub)}
                                                        className={`w-full text-left px-3 py-1.5 text-sm rounded-md hover:text-yellow-700 ${filters.subcategory === sub ? 'text-yellow-600 font-medium' : 'text-gray-500'
                                                            }`}
                                                    >
                                                        {sub}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Price Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => toggleDropdown('price')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-colors ${filters.priceRange
                                ? 'border-yellow-600 text-yellow-700 bg-yellow-50'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                }`}
                        >
                            {filters.priceRange ? filters.priceRange.label : 'Price'}
                            <ChevronDown size={16} />
                        </button>

                        {activeDropdown === 'price' && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 z-30 p-2">
                                {priceRanges.map((range) => (
                                    <button
                                        key={range.label}
                                        onClick={() => handlePriceChange(range)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 ${filters.priceRange?.label === range.label ? 'font-medium text-yellow-700 bg-yellow-50' : 'text-gray-700'
                                            }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Availability Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => toggleDropdown('availability')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-colors ${filters.availability !== 'all'
                                ? 'border-yellow-600 text-yellow-700 bg-yellow-50'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                }`}
                        >
                            {availabilityOptions.find(o => o.value === filters.availability)?.label || 'Availability'}
                            <ChevronDown size={16} />
                        </button>

                        {activeDropdown === 'availability' && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-30 p-2">
                                {availabilityOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleAvailabilityChange(option.value)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 ${filters.availability === option.value ? 'font-medium text-yellow-700 bg-yellow-50' : 'text-gray-700'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Material Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => toggleDropdown('material')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-colors ${filters.material
                                ? 'border-yellow-600 text-yellow-700 bg-yellow-50'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                }`}
                        >
                            {filters.material || 'Material'}
                            <ChevronDown size={16} />
                        </button>
                        {activeDropdown === 'material' && (
                            <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-30 p-2 max-h-60 overflow-y-auto">
                                {materials.map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => handleMaterialChange(m)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 ${filters.material === m ? 'font-medium text-yellow-700 bg-yellow-50' : 'text-gray-700'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Color Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => toggleDropdown('color')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-colors ${filters.color
                                ? 'border-yellow-600 text-yellow-700 bg-yellow-50'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                }`}
                        >
                            {filters.color || 'Color'}
                            <ChevronDown size={16} />
                        </button>
                        {activeDropdown === 'color' && (
                            <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-30 p-2 max-h-60 overflow-y-auto">
                                {colors.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => handleColorChange(c)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 ${filters.color === c ? 'font-medium text-yellow-700 bg-yellow-50' : 'text-gray-700'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto text-sm text-red-600 hover:text-red-700 font-medium underline"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
