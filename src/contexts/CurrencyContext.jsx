import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('MUR'); // Default to MUR (Mauritius Rupees)
    const [isMauritius, setIsMauritius] = useState(false);
    const [loading, setLoading] = useState(true);

    const rates = {
        USD: 0.022, // 1 MUR = 0.022 USD
        EUR: 0.020,
        MUR: 1, // Base Currency
        GBP: 0.017
    };

    const symbols = {
        USD: '$',
        EUR: '€',
        MUR: 'Rs',
        GBP: '£'
    };

    useEffect(() => {
        const detectLocation = async () => {
            try {
                // Safe, non-blocking fetch with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

                const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data.country_code === 'MU') {
                        setIsMauritius(true);
                        setCurrency('MUR');
                    } else {
                        // Check local storage for saved preference
                        const saved = localStorage.getItem('currency');
                        if (saved && rates[saved]) {
                            setCurrency(saved);
                        }
                    }
                }
            } catch (error) {
                // Silently fail for CORS/Network/Timeout (Safe Mode)
                console.warn('Location detection skipped (safe mode):', error.message);
                const saved = localStorage.getItem('currency');
                if (saved) setCurrency(saved);
            } finally {
                setLoading(false);
            }
        };

        detectLocation();
    }, []);

    const changeCurrency = (newCurrency) => {
        if (isMauritius && newCurrency !== 'MUR') return; // Enforce MUR for Mauritius
        setCurrency(newCurrency);
        localStorage.setItem('currency', newCurrency);
    };

    const formatPrice = (priceInMUR) => {
        if (!priceInMUR) return symbols[currency] + '0.00';

        // Price is now stored in MUR in the DB
        // If target currency is MUR, rate is 1.
        // If target is USD, rate is 0.022.
        const rate = rates[currency];
        const converted = priceInMUR * rate;

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(converted);
    };

    const value = {
        currency,
        setCurrency: changeCurrency,
        isMauritius,
        formatPrice,
        rates,
        symbols,
        loading
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
