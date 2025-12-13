
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { MessageSquare, CheckCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        const { data, error } = await supabase
            .from('jarvis_feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error) {
            setFeedbacks(data);
        }
        setLoading(false);
    };

    const updateStatus = async (id, newStatus) => {
        const { error } = await supabase
            .from('jarvis_feedback')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            fetchFeedback(); // Refresh
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="text-purple-600" />
                    JARVIS Feedback Received
                </h1>
                <button
                    onClick={fetchFeedback}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading JARVIS memory...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Type</th>
                                <th className="p-4 font-semibold text-gray-600">Message</th>
                                <th className="p-4 font-semibold text-gray-600">Page</th>
                                <th className="p-4 font-semibold text-gray-600">Date</th>
                                <th className="p-4 font-semibold text-gray-600">Status</th>
                                <th className="p-4 font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {feedbacks.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        No reports yet. JARVIS is waiting.
                                    </td>
                                </tr>
                            ) : feedbacks.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.type === 'bug' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="p-4 max-w-xs truncate" title={item.message}>
                                        {item.message}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {item.path}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(item.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                            {item.status || 'open'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        {item.status !== 'resolved' && (
                                            <button
                                                onClick={() => updateStatus(item.id, 'resolved')}
                                                className="p-1 hover:bg-green-100 rounded text-green-600"
                                                title="Mark Resolved"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        {item.status !== 'in_progress' && (
                                            <button
                                                onClick={() => updateStatus(item.id, 'in_progress')}
                                                className="p-1 hover:bg-blue-100 rounded text-blue-600"
                                                title="Mark In Progress"
                                            >
                                                <Clock size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
}
