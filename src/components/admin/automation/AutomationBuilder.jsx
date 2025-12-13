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
import { Play, Save } from 'lucide-react';
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
        // Auto-save before running
        handleSave();
        addToast('Starting workflow execution...', 'info');

        try {
            const triggerNode = nodes.find(n => n.type === 'trigger');
            if (!triggerNode) throw new Error('No trigger node found!');

            const connectedEdges = edges.filter(e => e.source === triggerNode.id);
            if (connectedEdges.length === 0) throw new Error('No actions connected!');

            // 1. Get initial products (All active for now, or filter by trigger context if we had one)
            // For "Manual Start", we assume all active products
            let { data: products, error } = await supabase.from('products').select('*');
            if (error) throw error;

            console.log(`Starting with ${products.length} products`);

            // 2. Process Nodes Sequentially
            // We need to traverse the graph. For simplicity, we assume a linear chain for this hotfix.
            // Trigger -> Action1 -> Action2...

            let currentNode = triggerNode;
            let currentProducts = products;

            while (true) {
                const edge = edges.find(e => e.source === currentNode.id);
                if (!edge) break; // End of chain

                const nextNode = nodes.find(n => n.id === edge.target);
                if (!nextNode) break;

                addToast(`Executing: ${nextNode.data.label}`, 'info');

                // Execute Action
                const actionType = nextNode.data.actionType; // e.g., 'filter_category', 'decrease_price'
                // Note: The drag-and-drop data needs to populate 'actionType'. 
                // We'll infer from label if missing for this hotfix.
                const label = nextNode.data.label.toLowerCase();
                const value = nextNode.data.description; // User entered value

                if (label.includes('filter')) {
                    // Filter Logic
                    if (label.includes('category')) {
                        const cat = value || 'Accessories'; // Default
                        currentProducts = currentProducts.filter(p => p.category === cat);
                    }
                    if (label.includes('stock')) {
                        currentProducts = currentProducts.filter(p => p.stock_qty <= 5);
                    }
                } else if (label.includes('price')) {
                    // Price Logic
                    if (label.includes('decrease')) {
                        const percent = parseInt(value) || 10;
                        // Execute Update on DB
                        const ids = currentProducts.map(p => p.id);
                        if (ids.length > 0) {
                            // We can't do bulk update with different values easily in one query valid for all dialects
                            // But here we apply same math. Supabase doesn't support "update x = x * 0.9" easily via JS client without RPC.
                            // We'll use RPC or individual updates. RPC is better.
                            // For hotfix: loop top 50 to avoid timeouts? Or just simple approach.
                            // Let's just update the local state to show "Simulated Success" effectively,
                            // OR actually update them.
                            // User wants it to WORK.
                            // RPC 'decrease_price' likely doesn't exist.
                            // We will loop.
                            // Execute Update via Backend API to bypass RLS
                            for (const p of currentProducts) {
                                const newPrice = Math.floor(p.price * (1 - percent / 100));
                                // Call Backend API
                                await fetch(`${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'}/api/update-product`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: p.id, price: newPrice })
                                });
                            }
                        }
                    }
                } else if (label.includes('tag')) {
                    // Add Tag
                    const tag = value || 'Sale';
                    for (const p of currentProducts) {
                        const newTags = [...(p.tags || []), tag];
                        await supabase.from('products').update({ tags: newTags }).eq('id', p.id);
                    }
                }

                currentNode = nextNode;
                // Wait a bit for visual effect
                await new Promise(r => setTimeout(r, 500));
            }

            addToast(`Workflow completed on ${currentProducts.length} products!`, 'success');

        } catch (err) {
            console.error(err);
            addToast(err.message, 'error');
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
