import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, UploadCloud, Sparkles, Check, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

export default function AlbumImportPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [albums, setAlbums] = useState([]);
    const [selected, setSelected] = useState('');
    const [fetching, setFetching] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [importError, setImportError] = useState(null);
    const [useAI, setUseAI] = useState(true);
    const [createProducts, setCreateProducts] = useState(true);

    if (authLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
    if (!isAdmin()) return <div className="p-8 text-red-600">Access denied.</div>;

    const loadAlbums = async () => {
        setFetching(true);
        setLoadError(null);
        try {
            const res = await fetch('/api/facebook/list-albums');

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                throw new Error(`Server Error (${res.status}): Check Vercel logs.`);
            }

            if (!res.ok) {
                throw new Error(data.error || `Failed ${res.status}`);
            }

            setAlbums(data.albums || []);
        } catch (err) {
            console.error('Failed to load albums:', err);
            setLoadError(err.message);
            setAlbums([]);
        } finally {
            setFetching(false);
        }
    };

    const startImport = async () => {
        if (!selected) return;
        setImporting(true);
        setImportError(null);
        setResult(null);

        const selectedAlbum = albums.find(a => a.id === selected);

        try {
            const res = await fetch('/api/facebook/import-album', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    albumId: selected,
                    albumName: selectedAlbum?.name || '',
                    useAI,
                    createProducts
                }),
            });

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                throw new Error(`Server Error (${res.status})`);
            }

            if (!res.ok) {
                throw new Error(data.error || `Import failed ${res.status}`);
            }

            setResult(data);
        } catch (err) {
            console.error('Import error:', err);
            setImportError(err.message);
        } finally {
            setImporting(false);
        }
    };

    useEffect(() => {
        loadAlbums();
    }, []);

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto p-4 lg:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl lg:text-3xl font-bold mb-2">Social Media Album Importer</h1>
                    <p className="text-gray-600">Import photos from Facebook and Instagram with AI-powered product generation</p>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <button
                            onClick={loadAlbums}
                            disabled={fetching}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                            {fetching ? 'Loading...' : 'Refresh Album List'}
                        </button>
                    </div>

                    {loadError && (
                        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <p className="font-bold">Error loading albums:</p>
                            <p className="text-sm">{loadError}</p>
                        </div>
                    )}

                    {/* Album Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Select Album</label>
                        <select
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={selected}
                            onChange={e => setSelected(e.target.value)}
                        >
                            <option value="" disabled>— Select an Album —</option>
                            {albums.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({a.count ?? 0} photos) {a.source === 'instagram' ? '📷' : '👤'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* AI Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useAI}
                                onChange={e => setUseAI(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-yellow-500" />
                                    <span className="font-medium">Use AI Analysis</span>
                                </div>
                                <p className="text-xs text-gray-600">Generate names & descriptions with Ollama</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={createProducts}
                                onChange={e => setCreateProducts(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="font-medium">Auto-Create Products</span>
                                </div>
                                <p className="text-xs text-gray-600">Add products to database (as drafts)</p>
                            </div>
                        </label>
                    </div>

                    {/* Import Instructions */}
                    {selected && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Ready to import!</strong> Click the button below to download photos from Facebook and create products in your database.
                            </p>
                        </div>
                    )}

                    {/* Import Button */}
                    <button
                        onClick={startImport}
                        disabled={!selected || importing}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        <UploadCloud className="w-5 h-5" />
                        {importing ? 'Importing...' : 'Import Selected Album'}
                    </button>
                </div>

                {/* Import Error */}
                {importError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <p className="font-bold">Import Error:</p>
                        <p className="text-sm">{importError}</p>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Check className="w-6 h-6 text-green-600" />
                            <h2 className="text-xl font-semibold">Import Complete!</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-600">Photos Imported</p>
                                <p className="text-2xl font-bold text-blue-600">{result.products?.length || 0}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <p className="text-sm text-gray-600">Products Created</p>
                                <p className="text-2xl font-bold text-green-600">{result.productsCreated || 0}</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <p className="text-sm text-gray-600">AI Status</p>
                                <p className="text-2xl font-bold text-purple-600">{result.aiUsed ? '✓ Active' : '○ Offline'}</p>
                            </div>
                        </div>

                        {/* Product Preview */}
                        {result.products && result.products.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-semibold mb-3">Generated Products Preview</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                    {result.products.slice(0, 12).map((product, idx) => (
                                        <div key={idx} className="border rounded-lg p-3 hover:shadow-lg transition-shadow">
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-32 object-cover rounded mb-2"
                                            />
                                            <h4 className="font-medium text-sm truncate">{product.name}</h4>
                                            <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                                                <span className="font-bold text-green-600">Rs {(product.suggestedPrice * 45).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {result.products.length > 12 && (
                                    <p className="text-sm text-gray-500 mt-2">+ {result.products.length - 12} more products</p>
                                )}
                            </div>
                        )}

                        {/* CSV Export */}
                        {result.csv && (
                            <div>
                                <h3 className="font-semibold mb-2">CSV Export (copy-paste)</h3>
                                <textarea
                                    readOnly
                                    className="w-full h-48 p-3 border rounded-lg font-mono text-xs bg-gray-50"
                                    value={result.csv}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
