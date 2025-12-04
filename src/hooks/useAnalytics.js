import { useCallback } from 'react';
import { supabase } from '../services/logger'; // Re-use supabase client from logger
import { logger } from '../services/logger';
// Simple UUID generator to avoid adding 'uuid' dependency
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Get or create a session ID for anonymous tracking
const getSessionId = () => {
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = generateUUID();
        localStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
};

export const useAnalytics = () => {
    const trackEvent = useCallback(async (eventType, metadata = {}, productId = null) => {
        try {
            const sessionId = getSessionId();

            // Log to console in dev
            if (import.meta.env.DEV) {
                console.log(`[Analytics] ${eventType}`, { productId, metadata });
            }

            const { error } = await supabase.from('analytics_events').insert({
                event_type: eventType,
                session_id: sessionId,
                product_id: productId,
                metadata,
                url: window.location.pathname
            });

            if (error) {
                logger.warn('Failed to track analytics event', { error, eventType });
            }
        } catch (err) {
            logger.warn('Analytics tracking error', err);
        }
    }, []);

    const trackViewProduct = (product) => {
        trackEvent('view_product', {
            price: product.price,
            category: product.category,
            name: product.name
        }, product.id);
    };

    const trackAddToCart = (product) => {
        trackEvent('add_to_cart', {
            price: product.price,
            category: product.category,
            name: product.name
        }, product.id);
    };

    const trackPurchase = (orderId, totalAmount, products) => {
        trackEvent('purchase', {
            order_id: orderId,
            total: totalAmount,
            product_count: products.length
        });

        // Also track individual product sales
        products.forEach(p => {
            trackEvent('product_sold', { order_id: orderId }, p.id);
        });
    };

    return {
        trackEvent,
        trackViewProduct,
        trackAddToCart,
        trackPurchase
    };
};
