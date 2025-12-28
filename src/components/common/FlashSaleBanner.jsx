import React, { useState, useEffect } from 'react';
import { Timer, Zap } from 'lucide-react';

const FlashSaleBanner = () => {
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        // Target: Midnight tonight
        const calculateTimeLeft = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setHours(24, 0, 0, 0); // Midnight

            const difference = tomorrow - now;

            if (difference > 0) {
                setTimeLeft({
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft(); // Initial call

        return () => clearInterval(timer);
    }, []);

    const formatNumber = (num) => num.toString().padStart(2, '0');

    return (
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white py-2 px-4 shadow-lg animate-gradient-x">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">

                {/* Left: Message */}
                <div className="flex items-center gap-2">
                    <Zap className="fill-yellow-300 text-yellow-300 animate-pulse" size={20} />
                    <span className="font-bold text-sm sm:text-base tracking-wide uppercase">
                        Flash Sale: Up to 70% OFF!
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

                {/* Right: CTA (Hidden on very small screens to save space if needed, or kept terse) */}
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
