import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Log a system event to Supabase (Sentinel Agent)
 * @param {string} level - 'info', 'warn', 'error'
 * @param {string} message - Brief description
 * @param {object} context - Additional data (stack trace, component, etc.)
 */
export const logSystemEvent = async (level, message, context = {}) => {
    try {
        // Always log to console in dev
        if (import.meta.env.DEV) {
            console.log(`[${level.toUpperCase()}] ${message}`, context);
        }

        // In production, or if critical error, send to Supabase
        // We buffer non-critical logs? For now, send all errors.
        if (level === 'error' || level === 'warn') {
            const { error } = await supabase.from('system_logs').insert({
                level,
                message,
                context,
                url: window.location.href,
                user_agent: navigator.userAgent
            });

            if (error) console.error('Failed to send log to Supabase:', error);
        }
    } catch (err) {
        // Fail silently to avoid infinite loops
        console.error('Logger failed:', err);
    }
};

export const logger = {
    info: (msg, ctx) => logSystemEvent('info', msg, ctx),
    warn: (msg, ctx) => logSystemEvent('warn', msg, ctx),
    error: (msg, ctx) => logSystemEvent('error', msg, ctx)
};
