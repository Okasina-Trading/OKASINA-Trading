import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, UploadCloud, Sparkles, Check, X, Facebook, Play, CloudLightning } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { metaService } from '../../services/metaService';

export default function AlbumImportPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [albums, setAlbums] = useState([]);
    const [selected, setSelected] = useState('');
    const [fetching, setFetching] = useState(false);

    // Import State
    const [importStatus, setImportStatus] = useState('idle'); // idle, fetching_list, processing, complete, error
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
    const [currentPhoto, setCurrentPhoto] = useState(null); // Name of photo being processed
    const [logs, setLogs] = useState([]);

    const [useAI, setUseAI] = useState(true);
    const [createProducts, setCreateProducts] = useState(true);

    if (authLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
    if (!isAdmin()) return <div className="p-8 text-red-600">Access denied.</div>;

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 50));
    };

    const loadAlbums = async () => {
        console.log('[AlbumImport] Starting loadAlbums...');
        setFetching(true);
        try {
            const res = await fetch('/api/facebook/list-albums');
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || `Failed ${res.status}`);

            setAlbums(data.albums || []);
            addLog(`Loaded ${data.albums?.length || 0} albums`, 'success');
        } catch (err) {
            console.error(err);
            addLog(`Failed to list albums: ${err.message}`, 'error');
        } finally {
            setFetching(false);
        }
    };

    const startBatchImport = async () => {
        if (!selected) return;

        setImportStatus('fetching_list');
        setProgress({ current: 0, total: 0, success: 0, failed: 0 });
        setLogs([]); // Clear previous logs
        addLog('Starting Batch Import...', 'info');

        try {
            // STEP 1: Get List of Photos
            addLog('Fetching photo list from Facebook...', 'info');
            const listRes = await fetch('/api/facebook/get-album-photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ albumId: selected })
            });

            const listData = await listRes.json();

            if (!listRes.ok) throw new Error(listData.error || 'Failed to get photos');
            if (!listData.photos || listData.photos.length === 0) throw new Error('No photos found in this album');

            const photosToImport = listData.photos;
            const total = photosToImport.length;

            setProgress(prev => ({ ...prev, total }));
            setImportStatus('processing');
            addLog(`Found ${total} photos. Starting import loop...`, 'success');

            // STEP 2: Loop and Process One by One
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < total; i++) {
                const photo = photosToImport[i];
                setCurrentPhoto(photo.caption || `Photo #${i + 1}`);
                setProgress(prev => ({ ...prev, current: i + 1 }));

                try {
                    const importRes = await fetch('/api/facebook/import-photo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: photo.id,
                            url: photo.url,
                            caption: photo.caption,
                            useAI,
                            createProducts
                        })
                    });

                    const importResult = await importRes.json();

                    if (!importRes.ok) {
                        throw new Error(importResult.error || 'Import failed');
                    }

                    successCount++;
                    addLog(`Imported: ${photo.caption?.substring(0, 30) || photo.id}`, 'success');
                } catch (err) {
                    console.error('Single photo fail:', err);
                    failCount++;
                    addLog(`Failed photo ${i + 1}: ${err.message}`, 'warning');
                    // We DO NOT break the loop here! We continue to next photo.
                }

                // Update counts LIVE
                setProgress(prev => ({ ...prev, success: successCount, failed: failCount }));

                // Small delay to be nice to server resources
                await new Promise(r => setTimeout(r, 500));
            }

            setImportStatus('complete');
            addLog('Batch Import Process Finished!', 'success');

        } catch (err) {
            console.error('Batch Fatal Error:', err);
            setImportStatus('error');
            addLog(`Critical Error: ${err.message}`, 'error');
        }
    };

    useEffect(() => {
        loadAlbums();
    }, []);

    // Calculate progress percentage
    const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto p-4 lg:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-2">
                        <Facebook className="text-blue-600" />
                        Album Importer <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">v2.0 Stable</span>
                    </h1>
                    <p className="text-gray-600">Batch importer: Connects to Facebook, downloads photos, and creates products safely.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN: Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* 1. Select Album */}
                        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                            <h3 className="font-semibold mb-3 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</div> Select Album</h3>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700">Available Albums</label>
                                <select
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={selected}
                                    onChange={e => setSelected(e.target.value)}
                                    disabled={importStatus === 'processing'}
                                >
                                    <option value="" disabled>— Select an Album —</option>
                                    {albums.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({a.count ?? 0})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={loadAlbums}
                                disabled={fetching || importStatus === 'processing'}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                                <RefreshCw className={`w-3 h-3 ${fetching ? 'animate-spin' : ''}`} />
                                Refresh List
                            </button>
                        </div>

                        {/* 2. Options */}
                        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                            <h3 className="font-semibold mb-3 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">2</div> Configuration</h3>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                                    <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="rounded text-blue-600" disabled={importStatus === 'processing'} />
                                    <div className="text-sm">
                                        <span className="font-medium block">Use AI Analysis</span>
                                        <span className="text-xs text-gray-500">Auto-categorize products</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                                    <input type="checkbox" checked={createProducts} onChange={e => setCreateProducts(e.target.checked)} className="rounded text-blue-600" disabled={importStatus === 'processing'} />
                                    <div className="text-sm">
                                        <span className="font-medium block">Create Products</span>
                                        <span className="text-xs text-gray-500">Add to database as 'Draft'</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* 3. Action */}
                        <button
                            onClick={startBatchImport}
                            disabled={!selected || importStatus === 'processing' || importStatus === 'fetching_list'}
                            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg transition-all
                                ${!selected
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : importStatus === 'processing'
                                        ? 'bg-blue-50 text-blue-400 cursor-wait'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02]'
                                }
                            `}
                        >
                            {importStatus === 'processing' || importStatus === 'fetching_list' ? (
                                <>
                                    <Loader2 className="animate-spin" /> Processing...
                                </>
                            ) : (
                                <>
                                    <Play className="fill-current" /> Start Batch Import
                                </>
                            )}
                        </button>
                    </div>

                    {/* RIGHT COLUMN: Terminal & Progress */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Progress Card */}
                        <div className="bg-white rounded-xl shadow-lg border border-blue-50 overflow-hidden">
                            <div className="p-6 bg-gradient-to-b from-white to-blue-50/50">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">Job Status</h2>
                                        <p className="text-sm text-gray-500">
                                            {importStatus === 'idle' && 'Waiting to start...'}
                                            {importStatus === 'fetching_list' && 'Fetching photo list from Facebook...'}
                                            {importStatus === 'processing' && `Processing photo ${progress.current} of ${progress.total}...`}
                                            {importStatus === 'complete' && 'Job Completed!'}
                                            {importStatus === 'error' && 'Job Stopped due to Error'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-4xl font-black text-blue-600">{percent}%</span>
                                    </div>
                                </div>

                                {/* Main Progress Bar */}
                                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-300 ease-out flex items-center justify-end pr-1"
                                        style={{ width: `${percent}%` }}
                                    >
                                        <div className="w-full h-full bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    <span>Start</span>
                                    <span>{progress.current} / {progress.total}</span>
                                    <span>End</span>
                                </div>
                            </div>

                            {/* Detailed Stats */}
                            <div className="grid grid-cols-3 divide-x border-t border-gray-100 bg-white">
                                <div className="p-4 text-center">
                                    <div className="text-2xl font-bold text-gray-800">{progress.total}</div>
                                    <div className="text-xs text-gray-500 uppercase">Total Items</div>
                                </div>
                                <div className="p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{progress.success}</div>
                                    <div className="text-xs text-green-600 uppercase">Successful</div>
                                </div>
                                <div className="p-4 text-center">
                                    <div className="text-2xl font-bold text-red-500">{progress.failed}</div>
                                    <div className="text-xs text-red-500 uppercase">Failed</div>
                                </div>
                            </div>
                        </div>

                        {/* Live Terminal Log */}
                        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 overflow-hidden flex flex-col h-[400px]">
                            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="ml-2 text-xs font-mono text-gray-400">console_output.log</span>
                                </div>
                                <button onClick={() => setLogs([])} className="text-xs text-gray-500 hover:text-white">Clear</button>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
                                {logs.length === 0 && (
                                    <div className="text-gray-600 italic">Ready for output...</div>
                                )}
                                {logs.map((log, i) => (
                                    <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' :
                                            log.type === 'success' ? 'text-green-400' :
                                                log.type === 'warning' ? 'text-yellow-400' : 'text-blue-300'
                                        }`}>
                                        <span className="text-gray-500">[{log.time}]</span>
                                        <span>{log.type === 'success' ? '✔' : log.type === 'error' ? '✖' : 'ℹ'}</span>
                                        <span>{log.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

