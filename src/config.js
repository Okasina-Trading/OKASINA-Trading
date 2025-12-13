// Environment configuration
export const IS_DEVELOPMENT = import.meta.env.MODE === 'development';
export const API_BASE_URL = import.meta.env.VITE_API_URL || (IS_DEVELOPMENT ? 'http://localhost:3001' : ''); // Relative path in prod

// Supabase Configuration
// Note: These are also exported in supabaseConfig.js, but keeping central config here is good practice
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const OBSERVER_MODE = true; // For monitoring only
