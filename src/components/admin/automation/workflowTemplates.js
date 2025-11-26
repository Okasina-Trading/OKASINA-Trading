// Pre-built Workflow Templates for Okasina Fashion Store

export const workflowTemplates = [
    {
        id: 'bulk-publish-drafts',
        name: 'Publish All Draft Products',
        description: 'Automatically publish all products in draft status',
        nodes: [
            {
                id: '1',
                type: 'trigger',
                position: { x: 100, y: 100 },
                data: { label: 'Manual Start', description: 'Click to run' }
            },
            {
                id: '2',
                type: 'action',
                position: { x: 400, y: 100 },
                data: {
                    label: 'Filter by Status',
                    actionType: 'filter_status',
                    description: 'Select draft products'
                }
            },
            {
                id: '3',
                type: 'action',
                position: { x: 700, y: 100 },
                data: {
                    label: 'Publish',
                    actionType: 'publish',
                    description: 'Make products active'
                }
            }
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' }
        ]
    },
    {
        id: 'seasonal-discount',
        name: 'Apply Seasonal Discount',
        description: 'Apply 20% discount to all clothing items',
        nodes: [
            {
                id: '1',
                type: 'trigger',
                position: { x: 100, y: 100 },
                data: { label: 'Manual Start' }
            },
            {
                id: '2',
                type: 'action',
                position: { x: 400, y: 100 },
                data: {
                    label: 'Filter by Category',
                    actionType: 'filter_category',
                    description: 'Select Clothing'
                }
            },
            {
                id: '3',
                type: 'action',
                position: { x: 700, y: 100 },
                data: {
                    label: 'Apply Discount',
                    actionType: 'apply_discount',
                    description: '20% off'
                }
            }
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' }
        ]
    },
    {
        id: 'low-stock-alert',
        name: 'Set Low Stock Alerts',
        description: 'Configure alerts for products with low inventory',
        nodes: [
            {
                id: '1',
                type: 'trigger',
                position: { x: 100, y: 100 },
                data: { label: 'Manual Start' }
            },
            {
                id: '2',
                type: 'action',
                position: { x: 400, y: 100 },
                data: {
                    label: 'Filter by Stock',
                    actionType: 'filter_stock',
                    description: 'Low stock items'
                }
            },
            {
                id: '3',
                type: 'action',
                position: { x: 700, y: 100 },
                data: {
                    label: 'Set Low Stock Alert',
                    actionType: 'set_stock_alert',
                    description: 'Alert at 5 units'
                }
            }
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' }
        ]
    },
    {
        id: 'price-increase',
        name: 'Increase Prices by 10%',
        description: 'Raise all active product prices by 10%',
        nodes: [
            {
                id: '1',
                type: 'trigger',
                position: { x: 100, y: 100 },
                data: { label: 'Manual Start' }
            },
            {
                id: '2',
                type: 'action',
                position: { x: 400, y: 100 },
                data: {
                    label: 'Filter by Status',
                    actionType: 'filter_status',
                    description: 'Active products'
                }
            },
            {
                id: '3',
                type: 'action',
                position: { x: 700, y: 100 },
                data: {
                    label: 'Increase Price',
                    actionType: 'increase_price',
                    description: '+10%'
                }
            }
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' }
        ]
    },
    {
        id: 'archive-out-of-stock',
        name: 'Archive Out of Stock Products',
        description: 'Move all out-of-stock items to archive',
        nodes: [
            {
                id: '1',
                type: 'trigger',
                position: { x: 100, y: 100 },
                data: { label: 'Manual Start' }
            },
            {
                id: '2',
                type: 'action',
                position: { x: 400, y: 100 },
                data: {
                    label: 'Filter by Stock',
                    actionType: 'filter_stock',
                    description: 'Out of stock'
                }
            },
            {
                id: '3',
                type: 'action',
                position: { x: 700, y: 100 },
                data: {
                    label: 'Archive',
                    actionType: 'archive',
                    description: 'Move to archive'
                }
            }
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' }
        ]
    },
    {
        id: 'new-collection',
        name: 'Create Summer Collection',
        description: 'Tag selected products for summer collection',
        nodes: [
            {
                id: '1',
                type: 'trigger',
                position: { x: 100, y: 100 },
                data: { label: 'Manual Start' }
            },
            {
                id: '2',
                type: 'action',
                position: { x: 400, y: 100 },
                data: {
                    label: 'Filter by Category',
                    actionType: 'filter_category',
                    description: 'Select category'
                }
            },
            {
                id: '3',
                type: 'action',
                position: { x: 700, y: 100 },
                data: {
                    label: 'Add to Collection',
                    actionType: 'add_collection',
                    description: 'Summer 2025'
                }
            }
        ],
        edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' }
        ]
    }
];
