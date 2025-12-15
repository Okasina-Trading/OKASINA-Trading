import { supabase } from '../supabase';

export const LoyaltyService = {
    /**
     * Get user's current loyalty profile
     */
    async getProfile(userId) {
        if (!userId) return null;

        try {
            const { data, error } = await supabase
                .from('loyalty_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // If no profile exists, return a default 'empty' profile without erroring
                if (error.code === 'PGRST116') {
                    return { points_balance: 0, tier: 'Silver', lifetime_points: 0 };
                }
                throw error;
            }
            return data;
        } catch (err) {
            console.error('Error fetching loyalty profile:', err);
            return null;
        }
    },

    /**
     * Get transaction history
     */
    async getHistory(userId) {
        if (!userId) return [];
        try {
            const { data, error } = await supabase
                .from('loyalty_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error fetching loyalty history:', err);
            return [];
        }
    },

    /**
     * Calculate Value
     * 100 Points = Rs 1 Discount (Example Rule)
     * Or 1 Point = Rs 1?
     * Decision: Use 10 Points = Rs 1 Discount (1 Point = 0.10 Rs)
     * So 100 Points = Rs 10.
     * Earn Rate: 1 Point per Rs 20 spent (5%).
     */
    calculateDiscount(points) {
        // Exchange Rate: 1 Point = Rs 1
        return points * 1;
    }
};
