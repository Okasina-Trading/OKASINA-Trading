import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabase';
import { useToast } from './ToastContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setWishlist([]);
        }
    }, [user]);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('wishlists')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            setWishlist(data || []);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToWishlist = async (product) => {
        if (!user) {
            addToast('Please login to add to wishlist', 'info');
            return;
        }

        if (isInWishlist(product.id)) {
            addToast('Product already in wishlist', 'info');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('wishlists')
                .insert([{ user_id: user.id, product_id: product.id }])
                .select();

            if (error) throw error;

            setWishlist(prev => [...prev, ...data]);
            addToast('Added to wishlist', 'success');
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            addToast('Failed to add to wishlist', 'error');
        }
    };

    const removeFromWishlist = async (productId) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('wishlists')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (error) throw error;

            setWishlist(prev => prev.filter(item => item.product_id !== productId));
            addToast('Removed from wishlist', 'success');
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            addToast('Failed to remove from wishlist', 'error');
        }
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => item.product_id === productId);
    };

    const toggleWishlist = (product) => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    return (
        <WishlistContext.Provider value={{
            wishlist,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            toggleWishlist,
            loading
        }}>
            {children}
        </WishlistContext.Provider>
    );
};
