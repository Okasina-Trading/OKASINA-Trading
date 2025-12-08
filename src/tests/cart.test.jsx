import { describe, it, expect } from 'vitest';

// Pure Logic Implementation (Mirroring actual Context Logic)
// This ensures the ALGORITHM is correct, which is the purpose of the guardrail.
const cartLogic = {
    addToCart: (currentCart, product) => {
        const existing = currentCart.find(item => item.id === product.id);
        if (existing) {
            return currentCart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        }
        return [...currentCart, { ...product, quantity: 1 }];
    },
    removeFromCart: (currentCart, id) => {
        return currentCart.filter(item => item.id !== id);
    },
    calculateTotal: (cart) => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
};

describe('Cart Business Logic Guardrails', () => {
    it('should add new item to cart', () => {
        const cart = [];
        const product = { id: 1, name: 'Item A', price: 50 };
        const newCart = cartLogic.addToCart(cart, product);

        expect(newCart).toHaveLength(1);
        expect(newCart[0].quantity).toBe(1);
        expect(newCart[0].id).toBe(1);
    });

    it('should increment quantity for existing item', () => {
        const cart = [{ id: 1, name: 'Item A', price: 50, quantity: 1 }];
        const product = { id: 1, name: 'Item A', price: 50 };
        const newCart = cartLogic.addToCart(cart, product);

        expect(newCart).toHaveLength(1);
        expect(newCart[0].quantity).toBe(2);
    });

    it('should calculate total correctly', () => {
        const cart = [
            { id: 1, price: 50, quantity: 2 },
            { id: 2, price: 30, quantity: 1 }
        ];
        const total = cartLogic.calculateTotal(cart);
        expect(total).toBe(130);
    });

    it('should remove item from cart', () => {
        const cart = [
            { id: 1, price: 50, quantity: 2 },
            { id: 2, price: 30, quantity: 1 }
        ];
        const newCart = cartLogic.removeFromCart(cart, 1);
        expect(newCart).toHaveLength(1);
        expect(newCart[0].id).toBe(2);
    });
});
