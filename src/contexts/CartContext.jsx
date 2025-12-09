import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
    const { user } = useAuth();
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Load cart from DB on login
    useEffect(() => {
        if (!user) return;

        async function loadCart() {
            try {
                const { data, error } = await supabase
                    .from('carts')
                    .select('items')
                    .eq('user_id', user.id)
                    .single();

                if (data && data.items) {
                    console.log('Loaded cart from DB:', data.items);
                    // Merge logic could go here, for now overwrite or keep local if DB empty
                    if (data.items.length > 0) {
                        setCart(data.items);
                    }
                }
            } catch (err) {
                console.error('Failed to load cart from DB:', err);
            }
        }
        loadCart();
    }, [user]);

    // Save cart to LocalStorage AND DB
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));

        if (user) {
            const saveToDb = async () => {
                try {
                    // Upsert cart
                    const { error } = await supabase
                        .from('carts')
                        .upsert({
                            user_id: user.id,
                            email: user.email, // Save email for recovery
                            items: cart,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id' });

                    if (error) throw error;
                } catch (err) {
                    // Silent fail for now, or log to analytics
                    console.warn('Failed to sync cart to DB', err);
                }
            };
            // Debounce slightly to avoid spamming DB on rapid clicks
            const timeout = setTimeout(saveToDb, 1000);
            return () => clearTimeout(timeout);
        }
    }, [cart, user]);

    const addToCart = (product) => {
        if (!product || !product.id) {
            console.error('Invalid product passed to addToCart:', product);
            return;
        }
        setCart((prev) => {
            if (!Array.isArray(prev)) return [{ ...product, quantity: 1 }];

            const existing = prev.find((item) => item.id === product.id && item.selectedSize === product.selectedSize);
            if (existing) {
                return prev.map((item) =>
                    (item.id === product.id && item.selectedSize === product.selectedSize)
                        ? { ...item, quantity: (item.quantity || 1) + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) return;
        setCart((prev) =>
            prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
        );
    };

    const removeFromCart = (productId) => {
        setCart((prev) => prev.filter((item) => item.id !== productId));
    };

    const clearCart = () => setCart([]);

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
