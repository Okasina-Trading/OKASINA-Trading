import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
    Play, Zap, Settings, Database, Tag, DollarSign, FileText,
    Package, TrendingUp, TrendingDown, Archive, Filter, Percent,
    Clock, ShoppingCart, Eye, CheckCircle, XCircle, AlertCircle,
    Copy, PlusCircle
} from 'lucide-react';

const NodeWrapper = ({ children, label, icon: Icon, color = 'bg-white', selected }) => (
    <div className={`shadow-lg rounded-lg border-2 ${selected ? 'border-blue-500' : 'border-gray-200'} bg-white min-w-[200px]`}>
        <div className={`p-2 ${color} rounded-t-md flex items-center gap-2 border-b border-gray-100`}>
            {Icon && <Icon size={16} className="text-white" />}
            <span className="text-xs font-bold text-white uppercase tracking-wider">{label}</span>
        </div>
        <div className="p-3">
            {children}
        </div>
    </div>
);

export const TriggerNode = memo(({ data, selected }) => {
    return (
        <NodeWrapper label="Trigger" icon={Zap} color="bg-yellow-500" selected={selected}>
            <div className="text-sm font-medium text-gray-900">{data.label}</div>
            <p className="text-xs text-gray-500 mt-1">{data.description || 'Starts the workflow'}</p>
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-yellow-500" />
        </NodeWrapper>
    );
});

export const ActionNode = memo(({ data, selected }) => {
    const getIcon = () => {
        switch (data.actionType) {
            // Price Actions
            case 'update_price': return DollarSign;
            case 'increase_price': return TrendingUp;
            case 'decrease_price': return TrendingDown;
            case 'apply_discount': return Percent;

            // Stock Actions
            case 'update_stock': return Package;
            case 'add_stock': return PlusCircle;
            case 'set_stock_alert': return AlertCircle;

            // Product Info
            case 'update_description': return FileText;
            case 'add_tag': return Tag;
            case 'duplicate_product': return Copy;

            // Status Actions
            case 'publish': return CheckCircle;
            case 'set_draft': return Eye;
            case 'archive': return Archive;

            // Category Actions
            case 'change_category': return ShoppingCart;
            case 'add_collection': return Tag;

            // Filters
            case 'filter_category': return Filter;
            case 'filter_stock': return Package;
            case 'filter_status': return Tag;

            default: return Settings;
        }
    };

    const getColor = () => {
        const type = data.actionType;
        if (type?.includes('filter')) return 'bg-purple-600';
        if (type?.includes('stock') || type?.includes('add_stock')) return 'bg-green-600';
        if (type === 'publish') return 'bg-green-600';
        if (type === 'set_draft') return 'bg-orange-600';
        if (type === 'archive') return 'bg-gray-600';
        if (type?.includes('category') || type?.includes('collection')) return 'bg-indigo-600';
        return 'bg-blue-600';
    };

    const Icon = getIcon();
    const color = getColor();

    return (
        <NodeWrapper label="Action" icon={Icon} color={color} selected={selected}>
            <Handle type="target" position={Position.Left} className={`w-3 h-3 ${color.replace('bg-', 'bg-')}`} />
            <div className="text-sm font-medium text-gray-900">{data.label}</div>
            <p className="text-xs text-gray-500 mt-1">{data.description || 'Performs an action'}</p>
            <Handle type="source" position={Position.Right} className={`w-3 h-3 ${color.replace('bg-', 'bg-')}`} />
        </NodeWrapper>
    );
});

