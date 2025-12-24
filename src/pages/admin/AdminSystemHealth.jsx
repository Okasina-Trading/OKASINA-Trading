
import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Play, AlertCircle, CheckCircle, Terminal } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export default function AdminSystemHealth() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [auditLog, setAuditLog] = useState("");
    const [doctorOutput, setDoctorOutput] = useState("");

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const res = await fetch(`${API_URL}/api/titan/inspector/report`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
        } catch (e) {
            console.error("Failed to fetch report", e);
        }
    };

    const runInspector = async () => {
        setLoading(true);
        setAuditLog("Initializing Inspector... Please wait (this can take 30-60s)...");
        try {
            const res = await fetch(`${API_URL}/api/titan/inspector/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'journey' })
            });
            const data = await res.json();

            if (data.success) {
                addToast("Inspector Cycle Complete");
                setAuditLog(data.output);
                setReport(data.report);
            } else {
                setAuditLog("Inspector Failed: " + (data.error || "Unknown Error"));
            }
        } catch (e) {
            setAuditLog("Network/Server Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const runDoctor = async () => {
        setLoading(true);
        setDoctorOutput("Summoning Doctor...");
        try {
            const res = await fetch(`${API_URL}/api/titan/doctor/run`, { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                addToast("Doctor Cycle Complete");
                setDoctorOutput(data.output);
                // Refresh report as Doctor might have fixed things (or at least we want to see status)
                // Actually doctor acts on report, so report is same until Inspector runs again.
            } else {
                setDoctorOutput("Doctor Failed: " + data.error);
            }
        } catch (e) {
            setDoctorOutput("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (status === 'PASS') return 'text-green-600 bg-green-50 border-green-200';
        if (status === 'FAIL') return 'text-red-600 bg-red-50 border-red-200';
        return 'text-gray-600 bg-gray-50 border-gray-200';
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <ShieldCheck className="text-blue-600" />
                System Health (Titan)
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Inspector Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Activity size={20} /> Inspector
                            </h2>
                            <p className="text-gray-500 text-sm">Automated QA & Activity Monitor</p>
                        </div>
                        <div className={`px-3 py-1 rounded border text-sm font-bold ${getStatusColor(report?.status)}`}>
                            {report?.status || "UNKNOWN"}
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-4">Last Run: {report?.timestamp ? new Date(report.timestamp).toLocaleString() : 'Never'}</p>

                    <button
                        onClick={runInspector}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Running...' : <><Play size={16} /> Run Inspection</>}
                    </button>

                    {/* Report Summary */}
                    {report && (
                        <div className="mt-4 space-y-2">
                            <div className="text-sm">
                                <span className="font-bold">Journeys:</span>
                                {report.journeys?.length > 0 ? report.journeys.map((j, i) => (
                                    <div key={i} className={`ml-2 text-xs flex items-center gap-1 ${j.status === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                                        {j.status === 'PASS' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                        {j.name}: {j.status}
                                    </div>
                                )) : <span className="text-gray-400 italic ml-2">None</span>}
                            </div>
                            <div className="text-sm">
                                <span className="font-bold">Broken Links:</span> {report.broken_links?.length || 0}
                            </div>
                            <div className="text-sm">
                                <span className="font-bold">Console Errors:</span> {report.console_errors?.length || 0}
                            </div>
                        </div>
                    )}
                </div>

                {/* Doctor Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Activity size={20} className="text-red-500" /> Doctor
                            </h2>
                            <p className="text-gray-500 text-sm">Auto-Repair & Diagnostics</p>
                        </div>
                    </div>

                    <button
                        onClick={runDoctor}
                        disabled={loading}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
                    >
                        <ShieldCheck size={16} /> Run Auto-Repair
                    </button>

                    <div className="bg-gray-900 text-green-400 p-4 rounded text-xs font-mono h-48 overflow-y-auto">
                        <div className="flex items-center gap-2 border-b border-gray-700 pb-2 mb-2">
                            <Terminal size={12} /> Titan Console
                        </div>
                        <pre className="whitespace-pre-wrap">
                            {doctorOutput || "Waiting for command..."}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Full Log */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold">Inspection Log</h3>
                </div>
                <div className="p-4 bg-gray-50 h-64 overflow-y-auto font-mono text-xs text-gray-600">
                    <pre className="whitespace-pre-wrap">{auditLog || "No logs available."}</pre>
                </div>
            </div>
        </div>
    );
}
