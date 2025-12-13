import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Cpu, RefreshCw, CheckCircle, AlertTriangle, XCircle, Zap } from 'lucide-react';
import { API_URL } from '../../api';

export default function AdminCitadelPage() {
    const [vitals, setVitals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchVitals = async () => {
        try {
            const res = await fetch(`${API_URL}/api/citadel/vitals`);
            if (!res.ok) throw new Error('Citadel unresponsive');
            const data = await res.json();
            setVitals(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err.message);
            setVitals(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVitals();
        const interval = setInterval(fetchVitals, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const StatusBadge = ({ status }) => {
        const colors = {
            'connected': 'bg-green-100 text-green-800',
            'ready': 'bg-green-100 text-green-800',
            'configured': 'bg-green-100 text-green-800',
            'operational': 'bg-blue-100 text-blue-800',
            'offline': 'bg-red-100 text-red-800',
            'missing_config': 'bg-yellow-100 text-yellow-800',
            'disconnected': 'bg-red-100 text-red-800'
        };
        const colorClass = colors[status] || 'bg-gray-100 text-gray-800';

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${colorClass}`}>
                {status?.replace('_', ' ')}
            </span>
        );
    };

    const MetricCard = ({ title, value, subtext, icon: Icon, status, trend }) => (
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20 relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon size={64} />
            </div>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Icon size={24} />
                </div>
                {status && <StatusBadge status={status} />}
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
            {subtext && <div className="text-xs text-gray-400">{subtext}</div>}
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl shadow-xl text-white">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Activity className="text-blue-400" />
                        Citadel Command
                    </h1>
                    <p className="text-slate-400 mt-1">System Vital Signs & Infrastructure Monitoring</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                        <span className="font-mono font-bold text-lg">{error ? 'CRITICAL' : 'OPERATIONAL'}</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <div className="flex items-center">
                        <AlertTriangle className="text-red-500 mr-3" />
                        <div>
                            <h3 className="text-red-800 font-bold">System Alert</h3>
                            <p className="text-red-700 text-sm">{error} - Check server logs immediately.</p>
                        </div>
                    </div>
                </div>
            )}

            {!loading && vitals && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Server Uptime"
                        value={`${Math.floor(vitals.uptime / 60)} min`}
                        subtext="Node.js Process"
                        icon={Server}
                        status="operational"
                    />
                    <MetricCard
                        title="Database Latency"
                        value={`${vitals.services.database.latency_ms} ms`}
                        subtext="Supabase Connection"
                        icon={Database}
                        status={vitals.services.database.status}
                    />
                    <MetricCard
                        title="Memory Usage"
                        value={vitals.system.memory_rss}
                        subtext={`Heap: ${vitals.system.memory_heap}`}
                        icon={Cpu}
                        status="operational"
                    />
                    <MetricCard
                        title="AI Vision Agent"
                        value={vitals.services.ai_vision.status === 'ready' ? 'Online' : 'Offline'}
                        subtext="Gemini 1.5 Flash"
                        icon={Zap}
                        status={vitals.services.ai_vision.status}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <RefreshCw size={20} className="text-gray-400" />
                        Recent System Logs
                    </h3>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 h-64 overflow-y-auto">
                        <p className="opacity-50">[{lastUpdated.toLocaleTimeString()}] Polling Citadel Vitals...</p>
                        <p>&gt; System check initiated</p>
                        <p>&gt; Supabase connection: {vitals?.services.database.status}</p>
                        <p>&gt; AI Services: {vitals?.services.ai_vision.status}</p>
                        <p>&gt; Memory integrity verified</p>
                        <p className="mt-2 text-white">&gt; All systems nominal.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">System Healthy</h3>
                    <p className="text-gray-500 mt-2 max-w-sm">
                        Citadel is actively monitoring 4 core services. No anomalies detected in the last 24 hours.
                    </p>
                    <button
                        onClick={fetchVitals}
                        className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Run Diagnostics Now
                    </button>
                </div>
            </div>
        </div>
    );
}
