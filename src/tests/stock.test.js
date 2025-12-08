import { describe, it, expect } from 'vitest';

// Simulating the backend logic we want to guard against
const calculateNewStock = (currentStock, changeAmount) => {
    const newStock = currentStock + changeAmount;
    if (newStock < 0) return 0; // Guardrail: No negative stock
    return newStock;
};

describe('Stock Logic Guardrails', () => {
    it('should correctly reduce stock', () => {
        const result = calculateNewStock(10, -3);
        expect(result).toBe(7);
    });

    it('should prevent negative stock (Guardrail)', () => {
        const result = calculateNewStock(2, -5);
        expect(result).toBe(0); // Should floor at 0
    });

    it('should correctly increase stock', () => {
        const result = calculateNewStock(5, 5);
        expect(result).toBe(10);
    });
});
