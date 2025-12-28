import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Save, X } from 'lucide-react';
import { supabase } from '../../../supabase';

import Sidebar from './Sidebar';
import { TriggerNode, ActionNode } from './CustomNodes';
import { useToast } from '../../../contexts/ToastContext';
import { workflowTemplates } from './workflowTemplates';

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
};

const initialNodes = [
    {
        id: '1',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: { label: 'Manual Start' },
    },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

const AutomationBuilderContent = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const { addToast } = useToast();

    // Execution Logging State
    const [executionLog, setExecutionLog] = useState(null); // 'open' or null
    const [logs, setLogs] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);

    const addLog = (message) => {
        setLogs(prev => [...prev, message]);
    };

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const actionType = event.dataTransfer.getData('actionType');
            const label = event.dataTransfer.getData('label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: getId(),
                type,
                position,
                data: { label: label, actionType: actionType },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    // Load from LocalStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('okasina_automation_workflow');
        if (saved) {
            try {
                const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
                setNodes(savedNodes);
                setEdges(savedEdges);
                addToast('Restored your saved workflow', 'info');
            } catch (e) {
                console.error('Failed to load workflow', e);
            }
        }
    }, [setNodes, setEdges, addToast]);

    const handleSave = () => {
        const workflow = { nodes, edges };
        localStorage.setItem('okasina_automation_workflow', JSON.stringify(workflow));
        addToast('Workflow saved successfully!', 'success');
    };

    const handleRun = async () => {
        handleSave();
        setExecutionLog('open');
        setLogs([]);
        setIsExecuting(true);
        addLog('🚀 Starting execution sequence...');

        try {
            const triggerNode = nodes.find(n => n.type === 'trigger');
            if (!triggerNode) throw new Error('No trigger node found!');

            const connectedEdges = edges.filter(e => e.source === triggerNode.id);
            if (connectedEdges.length === 0) throw new Error('No actions connected!');

            addLog('📦 Fetching products database...');
            let { data: products, error } = await supabase.from('products').select('*');
            if (error) throw error;
            addLog(`✅ Loaded ${products.length} active products.`);

            let currentNode = triggerNode;
            let currentProducts = products;

            while (true) {
                const edge = edges.find(e => e.source === currentNode.id);
                if (!edge) break;

                const nextNode = nodes.find(n => n.id === edge.target);
                if (!nextNode) break;

                addLog(`⚙️ Step: ${nextNode.data.label}...`);

                const actionType = nextNode.data.actionType;
                const label = nextNode.data.label.toLowerCase();
                const value = nextNode.data.description;

                if (label.includes('filter')) {
                    if (label.includes('category')) {
                        const cat = value || 'Accessories';
                        currentProducts = currentProducts.filter(p => p.category === cat);
                        addLog(`   ↪ Filtered by Category '${cat}'. Remaining: ${currentProducts.length}`);
                    }
                    if (label.includes('stock')) {
                        currentProducts = currentProducts.filter(p => p.stock_qty <= 5);
                        addLog(`   ↪ Filtered by Low Stock. Remaining: ${currentProducts.length}`);
                    }
                } else if (label.includes('price')) {
                    if (label.includes('decrease')) {
                        const percent = parseInt(value) || 10;
                        addLog(`   ↪ Applying ${percent}% discount to ${currentProducts.length} items...`);

                        for (const p of currentProducts) {
                            const currentPrice = p.price;
                            // Ensure valid MRP: If existing MRP > currentPrice, keep it. Else set MRP to currentPrice.
                            const currentMRP = (p.mrp && p.mrp > currentPrice) ? p.mrp : currentPrice;

                            const newPrice = Math.floor(currentPrice * (1 - percent / 100));

                            addLog(`      - Updated ${p.name}: Rs ${currentPrice} -> Rs ${newPrice} (MRP: Rs ${currentMRP})`);

                            // Call Backend API
                            const payload = {
                                id: p.id,
                                price: newPrice,
                                price_mur: newPrice, // Sync MUR
                                mrp: currentMRP // Set MRP to display strike-through
                            };

                            await fetch(`${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'}/api/update-product`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });
                        }
                    }
                } else if (label.includes('tag')) {
                    const tag = value || 'Sale';
                    addLog(`   ↪ Tagging ${currentProducts.length} items with '${tag}'...`);
                    for (const p of currentProducts) {
                        const newTags = [...(p.tags || []), tag];
                        await supabase.from('products').update({ tags: newTags }).eq('id', p.id);
                    }
                }

                currentNode = nextNode;
                await new Promise(r => setTimeout(r, 800)); // Visible delay
            }

            addLog('🎉 Workflow execution completed successfully!');
            addToast(`Workflow completed on ${currentProducts.length} products!`, 'success');

        } catch (err) {
            console.error(err);
            addLog(`❌ Error: ${err.message}`);
            addToast(err.message, 'error');
        } finally {
            setIsExecuting(false);
        }
    };

    const loadTemplate = (templateId) => {
        const template = workflowTemplates.find(t => t.id === templateId);
        if (!template) return;

        setNodes(template.nodes);
        setEdges(template.edges);
        addToast(`Loaded template: ${template.name}`, 'success');
        setSelectedTemplate('');
    };

    // Node Editing State
    const [editingNode, setEditingNode] = useState(null);
    const [editValue, setEditValue] = useState('');

    const onNodeClick = useCallback((event, node) => {
        setEditingNode(node);
        setEditValue(node.data.description || '');
    }, []);

    const saveNodeEdit = () => {
        if (!editingNode) return;

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === editingNode.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            description: editValue,
                        },
                    };
                }
                return node;
            })
        );
        setEditingNode(null);
        addToast('Node updated', 'success');
    };

    return (
        <div className="flex h-[calc(100vh-100px)] bg-gray-50">
            <Sidebar />
            <div className="flex-1 relative" ref={reactFlowWrapper}>
                <div className="absolute top-4 left-4 right-4 z-10 flex gap-2 items-center">
                    <select
                        value={selectedTemplate}
                        onChange={(e) => loadTemplate(e.target.value)}
                        className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg border border-gray-200 text-sm font-medium"
                    >
                        <option value="">Load Template...</option>
                        {workflowTemplates.map(template => (
                            <option key={template.id} value={template.id}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                    <div className="flex-1" />
                    <button
                        onClick={handleRun}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                    >
                        <Play size={18} />
                        Run Workflow
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 flex items-center gap-2 font-medium border border-gray-200"
                    >
                        <Save size={18} />
                        Save
                    </button>
                </div>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Controls />
                    <Background color="#aaa" gap={16} />
                </ReactFlow>

                {/* Edit Node Modal */}
                {editingNode && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-2xl w-96">
                            <h3 className="text-lg font-bold mb-4">Edit Node</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Configuration
                                </label>
                                <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter value (e.g. Category Name)"
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter the specific value for this action (e.g. "Jewelry" or "50%")
                                </p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setEditingNode(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveNodeEdit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Execution Log Modal */}
                {executionLog && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-900 text-green-400 p-6 rounded-xl shadow-2xl w-[600px] font-mono h-[500px] flex flex-col">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Play size={18} className="animate-pulse" />
                                    Execution Log
                                </h3>
                                {!isExecuting && (
                                    <button
                                        onClick={() => setExecutionLog(null)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-black/50 rounded-lg">
                                {logs.map((log, index) => (
                                    <div key={index} className="text-sm border-l-2 border-green-500 pl-2">
                                        <span className="opacity-50 text-xs">[{new Date().toLocaleTimeString()}]</span> {log}
                                    </div>
                                ))}
                                {isExecuting && (
                                    <div className="animate-pulse text-green-600">_</div>
                                )}
                            </div>
                            <div className="mt-4 flex justify-end">
                                {!isExecuting && (
                                    <button
                                        onClick={() => setExecutionLog(null)}
                                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-bold"
                                    >
                                        Close
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function AutomationBuilder() {
    return (
        <ReactFlowProvider>
            <AutomationBuilderContent />
        </ReactFlowProvider>
    );
}
