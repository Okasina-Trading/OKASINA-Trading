import React, { useState, useEffect } from 'react';
import ProductCard from '../ProductCard';
import { getHomeRecommendations, getProductRecommendations, getCartRecommendations } from '../../services/recommendations';
import { logger } from '../../services/logger';
import { Sparkles } from 'lucide-react';

const RecommendedProducts = ({ title, contextType, contextId, cartItems }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true);
                let data = [];

                switch (contextType) {
                    case 'home':
                        data = await getHomeRecommendations();
                        break;
                    case 'product':
                        if (contextId) {
                            data = await getProductRecommendations(contextId);
                        }
                        break;
                    case 'cart':
                        data = await getCartRecommendations(cartItems);
                        break;
                    default:
                        data = await getHomeRecommendations();
                }

                setProducts(data);
            } catch (error) {
                logger.error('Error fetching recommendations', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [contextType, contextId, cartItems]);

    if (loading) {
        return (
            <div className="py-8">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-3">
                            <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) return null;

    return (
        <section className="py-12">
            <div className="flex items-center gap-2 mb-8">
                <Sparkles className="text-purple-600" size={24} />
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
};

export default RecommendedProducts;
