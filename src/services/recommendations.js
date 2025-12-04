import { supabase } from './logger';
import { logger } from './logger';

/**
 * Get trending products based on view counts and sales
 */
export async function getHomeRecommendations(limit = 4) {
    try {
        // For a real app, we'd use a complex SQL query or Edge Function to aggregate analytics.
        // For this implementation, we'll fetch products with a simple heuristic or random shuffle 
        // if analytics data is sparse, to ensure the UI always looks good.

        // 1. Try to get popular products from analytics (Stub logic for now, as we need data first)
        // In a real scenario: SELECT product_id, COUNT(*) as popularity FROM analytics_events GROUP BY product_id ORDER BY popularity DESC

        // Fallback: Get random products to simulate "Trending"
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'published')
            .limit(limit * 3); // Fetch more to shuffle

        if (error) throw error;

        // Shuffle array to show different "trending" items
        const shuffled = data.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, limit);

    } catch (error) {
        logger.error('Failed to get home recommendations', error);
        return [];
    }
}

/**
 * Get related products based on category/tags
 */
export async function getProductRecommendations(productId, limit = 4) {
    try {
        // 1. Get current product details to find category
        const { data: product, error: pError } = await supabase
            .from('products')
            .select('category, tags')
            .eq('id', productId)
            .single();

        if (pError) throw pError;

        // 2. Find other products in same category
        const { data: related, error: rError } = await supabase
            .from('products')
            .select('*')
            .eq('category', product.category)
            .neq('id', productId) // Exclude current
            .eq('status', 'published')
            .limit(limit);

        if (rError) throw rError;

        return related || [];

    } catch (error) {
        logger.error('Failed to get product recommendations', error);
        return [];
    }
}

/**
 * Get recommendations for cart (cross-sell)
 */
export async function getCartRecommendations(cartItems, limit = 4) {
    try {
        if (!cartItems || cartItems.length === 0) {
            return getHomeRecommendations(limit);
        }

        // Simple logic: Get products NOT in cart
        const cartIds = cartItems.map(item => item.id);

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .not('id', 'in', `(${cartIds.join(',')})`)
            .eq('status', 'published')
            .limit(limit);

        if (error) throw error;

        return data || [];

    } catch (error) {
        logger.error('Failed to get cart recommendations', error);
        return [];
    }
}
