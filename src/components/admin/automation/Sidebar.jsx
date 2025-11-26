import React from 'react';
import {
    Zap, DollarSign, FileText, Tag, PlusCircle,
    Package, TrendingUp, TrendingDown, Archive,
    Filter, Percent, Clock, ShoppingCart, Eye,
    CheckCircle, XCircle, AlertCircle, Copy
} from 'lucide-react';

export default function Sidebar() {
    const onDragStart = (event, nodeType, actionType = null, label = 'New Node') => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        if (actionType) event.dataTransfer.setData('actionType', actionType);
        event.dataTransfer.setData('label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    const NodeCard = ({ icon: Icon, label, description, actionType, color = 'blue' }) => (
        <div
            className={`flex items-center gap-3 p-3 bg-${color}-50 border border-${color}-200 rounded-lg cursor-grab hover:shadow-md transition-shadow`}
            onDragStart={(event) => onDragStart(event, 'action', actionType, label)}
            draggable
        >
            <div className={`w-8 h-8 bg-${color}-100 rounded-full flex items-center justify-center text-${color}-600`}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </div>
    );

    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-6 h-full overflow-y-auto">
            {/* Triggers */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Triggers</h3>
                <div className="space-y-3">
                    <div
                        className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-grab hover:shadow-md transition-shadow"
                        onDragStart={(event) => onDragStart(event, 'trigger', null, 'Manual Start')}
                        draggable
                    >
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                            <Zap size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Manual Start</p>
                            <p className="text-xs text-gray-500">Click to run</p>
                        </div>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-grab hover:shadow-md transition-shadow"
                        onDragStart={(event) => onDragStart(event, 'trigger', 'schedule', 'Scheduled')}
                        draggable
                    >
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                            <Clock size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Scheduled</p>
                            <p className="text-xs text-gray-500">Run on schedule</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Filters</h3>
                <div className="space-y-3">
                    <NodeCard icon={Filter} label="Filter by Category" description="Select category" actionType="filter_category" color="purple" />
                    <NodeCard icon={Package} label="Filter by Stock" description="Low/Out of stock" actionType="filter_stock" color="purple" />
                    <NodeCard icon={Tag} label="Filter by Status" description="Active/Draft/Archived" actionType="filter_status" color="purple" />
                </div>
            </div>

            {/* Price Actions */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Price Actions</h3>
                <div className="space-y-3">
                    <NodeCard icon={DollarSign} label="Update Price" description="Set new price" actionType="update_price" />
                    <NodeCard icon={TrendingUp} label="Increase Price" description="Raise by %" actionType="increase_price" />
                    <NodeCard icon={TrendingDown} label="Decrease Price" description="Lower by %" actionType="decrease_price" />
                    <NodeCard icon={Percent} label="Apply Discount" description="Add discount %" actionType="apply_discount" />
                </div>
            </div>

            {/* Stock Actions */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Stock Actions</h3>
                <div className="space-y-3">
                    <NodeCard icon={Package} label="Update Stock" description="Set quantity" actionType="update_stock" color="green" />
                    <NodeCard icon={PlusCircle} label="Add Stock" description="Increase qty" actionType="add_stock" color="green" />
                    <NodeCard icon={AlertCircle} label="Set Low Stock Alert" description="Alert threshold" actionType="set_stock_alert" color="green" />
                </div>
            </div>

            {/* Product Info Actions */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Product Info</h3>
                <div className="space-y-3">
                    <NodeCard icon={FileText} label="Update Description" description="Modify text" actionType="update_description" />
                    <NodeCard icon={Tag} label="Add Tag" description="Tag products" actionType="add_tag" />
                    <NodeCard icon={Copy} label="Duplicate Product" description="Create copy" actionType="duplicate_product" />
                </div>
            </div>

            {/* Status Actions */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Status Actions</h3>
                <div className="space-y-3">
                    <NodeCard icon={CheckCircle} label="Publish" description="Make active" actionType="publish" color="green" />
                    <NodeCard icon={Eye} label="Set to Draft" description="Hide from store" actionType="set_draft" color="orange" />
                    <NodeCard icon={Archive} label="Archive" description="Archive products" actionType="archive" color="gray" />
                </div>
            </div>

            {/* Category Actions */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Category Actions</h3>
                <div className="space-y-3">
                    <NodeCard icon={ShoppingCart} label="Change Category" description="Move to category" actionType="change_category" color="indigo" />
                    <NodeCard icon={Tag} label="Add to Collection" description="Create collection" actionType="add_collection" color="indigo" />
                </div>
            </div>
        </aside>
    );
}
