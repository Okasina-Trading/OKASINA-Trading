import { useState, useCallback, useEffect } from 'react';
import { api } from '../api';
import { logger } from '../services/logger';

export const useStylistChat = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // Load messages from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('stylist_chat_history');
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                logger.warn('Failed to parse chat history', e);
            }
        } else {
            // Initial welcome message
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                text: "Hi! I'm your personal AI Stylist. Looking for something specific or need outfit advice?",
                timestamp: new Date().toISOString()
            }]);
        }
    }, []);

    // Save to local storage whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('stylist_chat_history', JSON.stringify(messages));
        }
    }, [messages]);

    const toggleChat = () => {
        setIsOpen(prev => !prev);
        if (!isOpen) setHasUnread(false);
    };

    const sendMessage = useCallback(async (text) => {
        if (!text.trim()) return;

        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            text,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // Call backend API
            const response = await api.post('/api/stylist-chat', {
                message: text,
                history: messages.slice(-5) // Send last 5 messages for context
            });

            const aiMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: response.data.replyText,
                suggestedProductIds: response.data.suggestedProductIds,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, aiMsg]);

            if (!isOpen) setHasUnread(true);

        } catch (error) {
            logger.error('Stylist chat error', error);

            // Fallback error message
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: "I'm having a little trouble connecting right now. Please try again in a moment!",
                isError: true,
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, isOpen]);

    const clearChat = () => {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            text: "Hi! I'm your personal AI Stylist. Looking for something specific or need outfit advice?",
            timestamp: new Date().toISOString()
        }]);
        localStorage.removeItem('stylist_chat_history');
    };

    return {
        messages,
        isLoading,
        isOpen,
        hasUnread,
        toggleChat,
        sendMessage,
        clearChat
    };
};
