import React, { useState, useEffect } from 'react';
import { Timer, Zap } from 'lucide-react';
import { supabase } from '../../supabase';

const FlashSaleBanner = () => {
    const [settings, setSettings] = useState({
        text: 'Flash Sale: Up to 70% OFF!',
        end_date: '2025-12-31T00:00:00Z',
        is_active: true
    });
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'flash_sale')
                .single();

            if (data) {
                setSettings(data.value);
            }
        } catch (error) {
            console.error('Error fetching banner settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!settings.is_active) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const targetDate = new Date(settings.end_date);
            const difference = targetDate - now;

            if (difference > 0) {
                setTimeLeft({
                    hours: Math.floor((difference / (1000 * 60 * 60))), // Show total hours, not just 24h mod
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(timer);
    }, [settings]);

    const formatNumber = (num) => num.toString().padStart(2, '0');

    if (loading || !settings.is_active) return null;

    return (
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white py-2 px-4 shadow-lg animate-gradient-x">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">

                {/* Left: Message */}
                <div className="flex items-center gap-2">
                    <Zap className="fill-yellow-300 text-yellow-300 animate-pulse" size={20} />
                    <span className="font-bold text-sm sm:text-base tracking-wide uppercase">
                        {settings.text}
                    </span>
                </div>

                {/* Center: Timer */}
                <div className="flex items-center gap-3 bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm">
                    <span className="text-xs font-medium opacity-90 uppercase tracking-wider">Ends in:</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-lg leading-none">
                        <div className="bg-white/10 rounded px-1.5 py-0.5">{formatNumber(timeLeft.hours)}</div>
                        <span>:</span>
                        <div className="bg-white/10 rounded px-1.5 py-0.5">{formatNumber(timeLeft.minutes)}</div>
                        <span>:</span>
                        <div className="bg-white/10 rounded px-1.5 py-0.5">{formatNumber(timeLeft.seconds)}</div>
                    </div>
                </div>

                {/* Right: CTA */}
                <div className="hidden sm:block">
                    <span className="text-xs bg-white text-red-600 font-bold px-3 py-1 rounded-full uppercase tracking-wider hover:bg-yellow-100 cursor-pointer transition-colors">
                        Shop Now
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FlashSaleBanner;
