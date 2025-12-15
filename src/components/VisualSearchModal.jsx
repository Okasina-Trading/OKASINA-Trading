import React, { useState, useRef } from 'react';
import { Upload, X, Camera, Search, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VisualSearchModal({ isOpen, onClose }) {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [results, setResults] = useState([]);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result);
            analyzeImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const analyzeImage = async (base64Data) => {
        setLoading(true);
        setAnalysis(null);
        setResults([]);

        try {
            const res = await fetch('/api/visual-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64Data })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setAnalysis(data.analysis);
            setResults(data.products || []);

        } catch (error) {
            console.error(error);
            alert('Failed to analyze image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="text-purple-600" />
                        Visual Search
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!image ? (
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="bg-purple-100 text-purple-600 p-4 rounded-full mb-4">
                                <Camera size={32} />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Upload or Take Photo</h3>
                            <p className="text-gray-500 mb-4">Find similar products instantly using AI</p>
                            <button className="bg-black text-white px-6 py-2 rounded-full font-medium">
                                Select Image
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Uploaded Image & Loading State */}
                            <div className="flex gap-6 items-start">
                                <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200 shrink-0 relative">
                                    <img src={image} alt="Upload" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setImage(null)}
                                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full text-xs"
                                    > <X size={12} /> </button>
                                </div>

                                <div className="flex-1">
                                    {loading ? (
                                        <div className="h-full flex flex-col justify-center text-purple-600">
                                            <div className="flex items-center gap-2 mb-2 font-medium">
                                                <Loader2 className="animate-spin" />
                                                Analyzing Style...
                                            </div>
                                            <p className="text-sm text-gray-400">Our AI is identifying colors, patterns, and categories.</p>
                                        </div>
                                    ) : analysis ? (
                                        <div>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                                                    {analysis.color}
                                                </span>
                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                                                    {analysis.category}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm italic">
                                                Found {results.length} similar items for "{analysis.searchTerms?.join(', ')}"
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Results Grid */}
                            {!loading && results.length > 0 && (
                                <div>
                                    <h3 className="font-bold mb-4">Matching Products</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {results.map(product => (
                                            <div
                                                key={product.id}
                                                className="border rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow"
                                                onClick={() => {
                                                    navigate(`/product/${product.id}`);
                                                    onClose();
                                                }}
                                            >
                                                <div className="aspect-[3/4] rounded bg-gray-100 mb-2 overflow-hidden">
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                                                <p className="text-xs text-gray-500">Rs {product.price_mur || product.price}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!loading && analysis && results.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No exact matches found. Try a different angle?</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
