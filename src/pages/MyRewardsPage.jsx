import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoyaltyService } from '@/services/LoyaltyService';
import { Loader2, Crown, Gift, History, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyRewardsPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prof, hist] = await Promise.all([
                LoyaltyService.getProfile(user.id),
                LoyaltyService.getHistory(user.id)
            ]);
            setProfile(prof || { points_balance: 0, tier: 'Silver', lifetime_points: 0 });
            setHistory(hist || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
    );

    const discountValue = LoyaltyService.calculateDiscount(profile?.points_balance || 0);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-serif font-bold mb-8">My Rewards</h1>

            {/* Status Card */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Crown size={120} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <p className="text-gray-400 uppercase tracking-widest text-sm font-semibold mb-2">Current Balance</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold">{profile.points_balance?.toLocaleString()}</span>
                            <span className="text-xl text-yellow-400">Points</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full">
                            <Gift size={16} className="text-yellow-400" />
                            <span className="text-sm font-medium">Worth Rs {discountValue.toLocaleString()} off</span>
                        </div>
                    </div>

                    <div className="text-center md:text-right">
                        <div className="inline-flex flex-col items-center md:items-end">
                            <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase mb-2">
                                {profile.tier} Member
                            </span>
                            <p className="text-sm text-gray-400">Lifetime Earned: {profile.lifetime_points?.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center gap-2">
                    <History className="text-gray-400" />
                    <h2 className="text-lg font-bold">Transaction History</h2>
                </div>

                {history.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p>No transactions yet. Start shopping to earn points!</p>
                        <Link to="/shop" className="text-blue-600 hover:underline mt-2 inline-block">Go to Shop</Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {history.map((tx) => (
                            <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 p-2 rounded-full ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {tx.amount > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {tx.description || (tx.amount > 0 ? 'Points Earned' : 'Points Redeemed')}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
