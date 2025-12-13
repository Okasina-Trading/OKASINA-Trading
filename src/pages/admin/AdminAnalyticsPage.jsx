import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Target } from 'lucide-react';
import { API_URL } from '../../api';

// Simple Linear Regression for Forecasting
const calculateTrend = (dataPoints) => {
    if (!dataPoints || dataPoints.length < 2) return null;

    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    dataPoints.forEach((point, index) => {
        sumX += index;
        sumY += point;
        sumXY += index * point;
        sumXX += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
};

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        conversionRate: 2.4, // Mocked for now
        salesHistory: [1200, 1500, 1100, 1800, 2000, 1700, 2200] // Last 7 days
    });
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock API call - In real app, fetch from /api/quant/metrics
        // simulating delay
        setTimeout(() => {
            const trend = calculateTrend(stats.salesHistory);
            if (trend) {
                const nextDayIndex = stats.salesHistory.length;
                const prediction = trend.slope * nextDayIndex + trend.intercept;
                setForecast({
                    nextDay: Math.round(prediction),
                    trendDirection: trend.slope > 0 ? 'up' : 'down',
                    confidence: 85 // Mock confidence
                });
            }
            setLoading(false);
        }, 1000);
    }, [stats]);

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex justify-between items-center bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-2xl shadow-xl text-white">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <BarChart3 className="text-purple-400" />
                        Quant Intelligence
                    </h1>
                    <p className="text-purple-200 mt-1">AI-Powered Sales Forecasting & Metrics</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 font-medium mb-2">Total Sales (7 Days)</h3>
                    <div className="text-3xl font-bold text-gray-900">Rs {stats.salesHistory.reduce((a, b) => a + b, 0)}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 font-medium mb-2">Avg. Order Value</h3>
                    <div className="text-3xl font-bold text-gray-900">Rs 2,500</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 font-medium mb-2">Conversion Rate</h3>
                    <div className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</div>
                </div>
            </div>

            {/* FORECAST SECTION */}
            <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-purple-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                        <Target className="text-purple-600" />
                        Predictive Analysis (Quant)
                    </h2>
                    <span className="px-3 py-1 bg-purple-200 text-purple-800 text-xs font-bold rounded-full uppercase">
                        Beta Model
                    </span>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <p className="text-gray-500 mb-4">
                            Based on your last 7 days of performance, our linear regression model predicts the following trajectory for tomorrow.
                        </p>

                        {forecast && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Predicted Sales (Tomorrow)</span>
                                    <span className="text-2xl font-bold text-gray-900">Rs {forecast.nextDay}</span>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Trend Direction</span>
                                    <div className="flex items-center gap-2">
                                        {forecast.trendDirection === 'up' ?
                                            <TrendingUp className="text-green-500" /> :
                                            <TrendingDown className="text-red-500" />
                                        }
                                        <span className={`font-bold ${forecast.trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                            {forecast.trendDirection.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-64 flex items-end justify-between gap-2 px-4 border-b border-l border-gray-300 relative">
                        {stats.salesHistory.map((val, i) => (
                            <div key={i} className="w-full bg-indigo-200 hover:bg-indigo-300 transition-colors rounded-t-sm relative group" style={{ height: `${(val / 3000) * 100}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    Rs {val}
                                </div>
                            </div>
                        ))}
                        {/* Prediction Bar */}
                        {forecast && (
                            <div className="w-full bg-purple-500/50 border-2 border-dashed border-purple-600 rounded-t-sm relative group animate-pulse" style={{ height: `${(forecast.nextDay / 3000) * 100}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-purple-900 text-white text-xs px-2 py-1 rounded">
                                    Est: Rs {forecast.nextDay}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
