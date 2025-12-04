import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('USD');
    const [isMauritius, setIsMauritius] = useState(false);
    const [loading, setLoading] = useState(true);

    const rates = {
        USD: 1,
        EUR: 0.92,
        MUR: 45.0, // Fixed rate for now, ideally fetch live
        GBP: 0.79
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
                // Use a free IP geolocation API
                const response = await fetch('https://ipapi.co/json/');
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
            } catch (error) {
                console.error('Error detecting location:', error);
                // Fallback: check local storage or default to USD
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

    const formatPrice = (priceInUSD) => {
        if (!priceInUSD) return symbols[currency] + '0.00';

        const rate = rates[currency];
        const converted = priceInUSD * rate;

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
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
