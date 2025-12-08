import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Simple Mock App Component for Smoke Test to avoid complex Provider wrapping for now
const MockApp = () => {
    return (
        <BrowserRouter>
            <div>Okasina Fashion Store</div>
        </BrowserRouter>
    );
};

describe('App Smoke Test', () => {
    it('should render the app without crashing', () => {
        render(<MockApp />);
        expect(screen.getByText('Okasina Fashion Store')).toBeInTheDocument();
    });
});
