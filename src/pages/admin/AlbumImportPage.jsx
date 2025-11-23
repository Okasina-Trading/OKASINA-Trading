import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, UploadCloud } from 'lucide-react';

export default function AlbumImportPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [albums, setAlbums] = useState([]);
    const [selected, setSelected] = useState('');
    const [fetching, setFetching] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);

    // Guard: only admins can see this page
    if (authLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
    if (!isAdmin()) return <div className="p-8 text-red-600">Access denied.</div>;

    const loadAlbums = async () => {
        setFetching(true);
        const res = await fetch('/api/facebook/list-albums');
        const data = await res.json();
        setAlbums(data.albums || []);
        setFetching(false);
    };

    const startImport = async () => {
        if (!selected) return;
        setImporting(true);
        setResult(null);
        const res = await fetch('/api/facebook/import-album', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ albumId: selected }),
        });
        const data = await res.json();
        setResult(data);
        setImporting(false);
    };

    useEffect(() => {
        loadAlbums();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Facebook Album Importer</h1>

            <button
                onClick={loadAlbums}
                disabled={fetching}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center mb-4"
            >
                <RefreshCw className="mr-2" size={16} />
                {fetching ? 'Refreshing…' : 'Refresh Album List'}
            </button>

            <select
                className="w-full p-2 border rounded mb-4"
                value={selected}
                onChange={e => setSelected(e.target.value)}
            >
                <option value="" disabled>— Select an Album —</option>
                {albums.map(a => (
                    <option key={a.id} value={a.id}>
                        {a.name} ({a.count ?? 0} photos)
                    </option>
                ))}
            </select>

            <button
                onClick={startImport}
                disabled={!selected || importing}
                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
            >
                <UploadCloud className="mr-2" size={18} />
                {importing ? 'Importing…' : 'Import Selected Album'}
            </button>

            {result && (
                <div className="mt-6 p-4 bg-gray-50 rounded">
                    <h2 className="text-xl font-semibold mb-2">Result</h2>
                    <p>{result.message || result.error}</p>
                    {result.csv && (
                        <div className="mt-4">
                            <h3 className="font-medium mb-1">CSV (copy‑paste)</h3>
                            <textarea
                                readOnly
                                className="w-full h-48 p-2 border rounded font-mono text-sm"
                                value={result.csv}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
