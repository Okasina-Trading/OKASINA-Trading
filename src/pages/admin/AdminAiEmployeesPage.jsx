import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Bot, Eye, ShieldCheck, TrendingUp, Play, Activity, CheckCircle, Upload, Image as ImageIcon, Sparkles, Megaphone, MessageCircle, Package } from 'lucide-react';
import api, { API_URL } from '../../api';

export default function AdminAiEmployeesPage() {
    const [agents, setAgents] = useState([
        {
            id: 'vision',
            name: 'Vision (JARVIS)',
            role: 'The Merchandiser',
            description: 'Auto-populates product details from images using JARVIS AI. Generates SEO-friendly titles and descriptions.',
            status: 'idle',
            lastRun: 'Never',
            icon: Eye,
            color: 'blue',
            performance: { successRate: 0, tasksCompleted: 0, avgTime: 0 },
            learning: { phase: 'idle', progress: 0, insights: [] }
        },
        {
            id: 'sentinel',
            name: 'Sentinel (AZ)',
            role: 'The QA Tester',
            description: 'Runs automated health checks using AION-ZERO scripts to ensure site reliability.',
            status: 'idle',
            lastRun: 'Never',
            icon: ShieldCheck,
            color: 'green',
            performance: { successRate: 0, tasksCompleted: 0, avgTime: 0 },
            learning: { phase: 'idle', progress: 0, insights: [] }
        },
        {
            id: 'analyst',
            name: 'Analyst (JARVIS)',
            role: 'The Strategist',
            description: 'Analyzes sales data using JARVIS to suggest pricing adjustments and stock reorders.',
            status: 'idle',
            lastRun: 'Never',
            icon: TrendingUp,
            color: 'purple',
            performance: { successRate: 0, tasksCompleted: 0, avgTime: 0 },
            learning: { phase: 'idle', progress: 0, insights: [] }
        },
        {
            id: 'marketing',
            name: 'Marketing (JARVIS)',
            role: 'The Content Creator',
            description: 'Generates engaging social media posts, hashtags, and marketing copy for products.',
            status: 'idle',
            lastRun: 'Never',
            icon: Megaphone,
            color: 'pink',
            performance: { successRate: 0, tasksCompleted: 0, avgTime: 0 },
            learning: { phase: 'idle', progress: 0, insights: [] }
        },
        {
            id: 'customer-service',
            name: 'Customer Service (JARVIS)',
            role: 'The Support Agent',
            description: 'Automatically generates helpful responses to customer inquiries and FAQs.',
            status: 'idle',
            lastRun: 'Never',
            icon: MessageCircle,
            color: 'indigo',
            performance: { successRate: 0, tasksCompleted: 0, avgTime: 0 },
            learning: { phase: 'idle', progress: 0, insights: [] }
        },
        {
            id: 'inventory',
            name: 'Inventory (JARVIS)',
            role: 'The Stock Manager',
            description: 'Predicts stock needs and suggests reorders based on sales patterns and inventory levels.',
            status: 'idle',
            lastRun: 'Never',
            icon: Package,
            color: 'orange',
            performance: { successRate: 0, tasksCompleted: 0, avgTime: 0 },
            learning: { phase: 'idle', progress: 0, insights: [] }
        }
    ]);

    const [showVisionModal, setShowVisionModal] = useState(false);
    const [visionData, setVisionData] = useState({
        image: null,
        imagePreview: null,
        rawDetails: ''
    });

    const handleRunAgent = async (id) => {
        if (id === 'vision') {
            setShowVisionModal(true);
            return;
        }

        setAgents(prev => prev.map(agent =>
            agent.id === id ? { ...agent, status: 'working' } : agent
        ));

        try {
            let endpoint = '';
            let body = {};

            if (id === 'sentinel') {
                endpoint = `${API_URL}/api/ai-agent/az/sentinel`;
            } else if (id === 'analyst') {
                endpoint = `${API_URL}/api/ai-agent/jarvis/analyst`;
                body = { salesData: { totalSales: 1000, products: [] } };
            } else if (id === 'marketing') {
                endpoint = `${API_URL}/api/ai-agent/jarvis/marketing`;
                body = { productData: { name: 'Sample Product', price: 50 }, platform: 'Instagram' };
            } else if (id === 'customer-service') {
                endpoint = `${API_URL}/api/ai-agent/jarvis/customer-service`;
                body = { customerQuery: 'What is your return policy?', context: 'General inquiry' };
            } else if (id === 'inventory') {
                endpoint = `${API_URL}/api/ai-agent/jarvis/inventory`;
                body = { stockData: {}, salesHistory: {} };
            }

            const response = await api.post(endpoint, body);

            const result = response.data;

            setAgents(prev => prev.map(agent =>
                agent.id === id ? { ...agent, status: result.success ? 'idle' : 'error', lastRun: 'Just now' } : agent
            ));

            alert(`${id.charAt(0).toUpperCase() + id.slice(1)} Agent: ${result.message || 'Completed'}\\n\\nOutput: ${JSON.stringify(result, null, 2)}`);
        } catch (error) {
            setAgents(prev => prev.map(agent =>
                agent.id === id ? { ...agent, status: 'error', lastRun: 'Failed' } : agent
            ));
            alert(`Error: ${error.message}`);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVisionData(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleVisionSubmit = async () => {
        if (!visionData.image || !visionData.rawDetails) {
            alert('Please upload an image and provide product details');
            return;
        }

        console.log('🚀 [Frontend] Starting Vision Agent task...');
        setAgents(prev => prev.map(agent =>
            agent.id === 'vision' ? { ...agent, status: 'working' } : agent
        ));

        try {
            // First upload image to Cloudinary
            console.log('📤 [Frontend] Uploading image to Cloudinary...');
            const formData = new FormData();
            formData.append('file', visionData.image);

            const uploadResponse = await api.post(`${API_URL}/api/upload-image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const uploadResult = uploadResponse.data;
            console.log('✅ [Frontend] Image uploaded:', uploadResult.url);

            // Then call Vision Agent with image URL
            console.log('🤖 [Frontend] Calling Vision Agent API...');
            const visionResponse = await api.post(`${API_URL}/api/ai-agent/jarvis/vision`, {
                imageUrl: uploadResult.url,
                rawDetails: visionData.rawDetails
            });

            const visionResult = visionResponse.data;
            console.log('✨ [Frontend] Vision Agent response:', visionResult);

            // Axios throws on non-2xx, so we don't need manual check unless status is 200 but success is false
            if (!visionResult.success && visionResult.error) {
                throw new Error(visionResult.error || 'Vision Agent failed');
            }

            setAgents(prev => prev.map(agent =>
                agent.id === 'vision' ? { ...agent, status: 'idle', lastRun: 'Just now' } : agent
            ));

            setShowVisionModal(false);
            setVisionData({ image: null, imagePreview: null, rawDetails: '' });

            alert(`Vision Agent Complete!\\n\\nGenerated Product:\\n${JSON.stringify(visionResult.product, null, 2)}`);
        } catch (error) {
            console.error('❌ [Frontend] Error:', error);
            setAgents(prev => prev.map(agent =>
                agent.id === 'vision' ? { ...agent, status: 'error', lastRun: 'Failed' } : agent
            ));
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">AI Team</h1>
                        <p className="text-gray-600">Manage your autonomous AI employees powered by JARVIS & AION-ZERO.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                        <Bot className="text-indigo-600" size={24} />
                        <span className="font-medium text-indigo-700">6 Agents Active</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {agents.map((agent) => {
                        const Icon = agent.icon;
                        return (
                            <div key={agent.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg bg-${agent.color}-100`}>
                                        <Icon className={`text-${agent.color}-600`} size={24} />
                                    </div>
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${agent.status === 'working' ? 'bg-yellow-100 text-yellow-700' :
                                        agent.status === 'error' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {agent.status === 'working' && <Activity size={12} className="animate-spin" />}
                                        {agent.status.toUpperCase()}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>
                                <p className="text-sm font-medium text-gray-500 mb-2">{agent.role}</p>
                                <p className="text-sm text-gray-600 mb-6 min-h-[48px]">{agent.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <span className="text-xs text-gray-500">Last run: {agent.lastRun}</span>
                                    <button
                                        onClick={() => handleRunAgent(agent.id)}
                                        disabled={agent.status === 'working'}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${agent.status === 'working'
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : `bg-${agent.color}-600 text-white hover:bg-${agent.color}-700`
                                            }`}
                                    >
                                        {agent.status === 'working' ? (
                                            <>Working...</>
                                        ) : (
                                            <>
                                                <Play size={16} />
                                                {agent.id === 'vision' ? 'Upload Image' : 'Run Task'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Vision Agent Modal */}
                {showVisionModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-blue-100">
                                        <Sparkles className="text-blue-600" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Vision Agent</h2>
                                        <p className="text-sm text-gray-600">Upload product image for AI analysis</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowVisionModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Image
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                                        {visionData.imagePreview ? (
                                            <div className="space-y-4">
                                                <img
                                                    src={visionData.imagePreview}
                                                    alt="Preview"
                                                    className="max-h-64 mx-auto rounded-lg"
                                                />
                                                <button
                                                    onClick={() => setVisionData(prev => ({ ...prev, image: null, imagePreview: null }))}
                                                    className="text-sm text-red-600 hover:text-red-700"
                                                >
                                                    Remove Image
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer">
                                                <ImageIcon className="mx-auto text-gray-400 mb-2" size={48} />
                                                <p className="text-sm text-gray-600 mb-1">Click to upload product image</p>
                                                <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Raw Details */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Details (Raw)
                                    </label>
                                    <textarea
                                        value={visionData.rawDetails}
                                        onChange={(e) => setVisionData(prev => ({ ...prev, rawDetails: e.target.value }))}
                                        placeholder="E.g., Blue summer dress, size M-L, cotton blend, $45"
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={4}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowVisionModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleVisionSubmit}
                                        disabled={!visionData.image || !visionData.rawDetails}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={16} />
                                        Generate Product
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Activity Log */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-bold text-gray-900">Agent Activity Log</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        <div className="px-6 py-4 flex items-center gap-4">
                            <div className="p-2 bg-green-100 rounded-full">
                                <CheckCircle size={16} className="text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">AI Team initialized successfully.</p>
                                <p className="text-xs text-gray-500">Connected to JARVIS (F:\Dev\Jarvis) and AION-ZERO (F:\AION-ZERO).</p>
                            </div>
                            <span className="text-xs text-gray-400">Just now</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
