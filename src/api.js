import axios from 'axios';
import { logger } from './services/logger';

const isDevelopment = import.meta.env.MODE === 'development';
export const API_URL = isDevelopment ? 'http://localhost:3001' : '';

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // Increased timeout for AI endpoints
    headers: {
        'Content-Type': 'application/json'
    }
});

// Circuit Breaker State
const circuitBreaker = {
    failures: 0,
    isOpen: false,
    lastFailure: 0,
    THRESHOLD: 5,
    RESET_TIMEOUT: 60000 // 1 minute
};

// Request Interceptor
api.interceptors.request.use(config => {
    // Check Circuit Breaker for AI endpoints
    if (config.url?.includes('/ai-agent') && circuitBreaker.isOpen) {
        const now = Date.now();
        if (now - circuitBreaker.lastFailure > circuitBreaker.RESET_TIMEOUT) {
            // Half-open: try one request
            circuitBreaker.isOpen = false;
            circuitBreaker.failures = 0;
            logger.info('Circuit Breaker resetting (Half-Open)', { url: config.url });
        } else {
            return Promise.reject(new Error('Circuit Breaker Open: AI Service temporarily disabled'));
        }
    }
    return config;
}, error => Promise.reject(error));

// Response Interceptor (Retry Logic)
api.interceptors.response.use(response => {
    // Successful response, reset failures if it was an AI endpoint
    if (response.config.url?.includes('/ai-agent')) {
        circuitBreaker.failures = 0;
    }
    return response;
}, async error => {
    const config = error.config;

    // Don't retry if no config or already retried max times
    if (!config || config.__retryCount >= 3) {
        // Update Circuit Breaker on failure
        if (config?.url?.includes('/ai-agent')) {
            circuitBreaker.failures++;
            if (circuitBreaker.failures >= circuitBreaker.THRESHOLD) {
                circuitBreaker.isOpen = true;
                circuitBreaker.lastFailure = Date.now();
                logger.error('Circuit Breaker Opened', { url: config.url, failures: circuitBreaker.failures });
            }
        }

        // Log final error
        logger.error('API Request Failed', {
            url: config?.url,
            status: error.response?.status,
            message: error.message
        });
        return Promise.reject(error);
    }

    // Check if retryable (5xx or network error)
    if (!error.response || (error.response.status >= 500 && error.response.status < 600)) {
        config.__retryCount = (config.__retryCount || 0) + 1;

        // Exponential backoff: 1s, 2s, 4s
        const backoff = Math.pow(2, config.__retryCount - 1) * 1000;

        logger.warn(`Retrying request... (${config.__retryCount}/3)`, { url: config.url });

        await new Promise(resolve => setTimeout(resolve, backoff));
        return api(config);
    }

    return Promise.reject(error);
});

export default api;
