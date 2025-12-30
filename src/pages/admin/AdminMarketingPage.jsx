import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import metaService from '../../services/metaService';
import { supabase } from '../../supabase';
import {
    Zap,
    Megaphone,
    Save,
    AlertTriangle,
    Mail,
    Send,
    Users,
    Target,
    TrendingUp,
    Calendar,
    Gift,
    Tag,
    Percent,
    Facebook,
    Instagram,
    Video,
    Image as ImageIcon,
    BarChart3,
    Clock,
    Heart,
    MessageCircle,
    Share2,
    Eye,
    ThumbsUp,
    Plus,
    CheckCircle,
    AlertCircle,
    Loader2,
    ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminMarketingPage() {
    const [activeTab, setActiveTab] = useState('overview');

    // Campaign State
    const [campaignName, setCampaignName] = useState('');
    const [campaignType, setCampaignType] = useState('email');
    const [targetAudience, setTargetAudience] = useState('all');
    const [message, setMessage] = useState('');
    const [discount, setDiscount] = useState('');

    // Social Media State
    const [socialPlatform, setSocialPlatform] = useState('facebook');
    const [postContent, setPostContent] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    // Meta Integration State
    const [isConnected, setIsConnected] = useState(false);
    const [pages, setPages] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    const [isPosting, setIsPosting] = useState(false);
    const [postStatus, setPostStatus] = useState(null); // { type: 'success' | 'error', message: string }

    // Banner Settings State
    const [bannerSettings, setBannerSettings] = useState({
        text: 'Flash Sale: Up to 70% OFF!',
        end_date: '2025-12-31T00:00:00Z',
        is_active: true
    });
    const [savingBanner, setSavingBanner] = useState(false);

    useEffect(() => {
        // Check if already connected
        if (metaService.isAuthenticated()) {
            setIsConnected(true);
            loadPages();
        }
        fetchBannerSettings();
    }, []);

    const fetchBannerSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'flash_sale')
                .single();

            if (data) {
                setBannerSettings(data.value);
            }
        } catch (error) {
            console.error('Error fetching banner settings:', error);
        }
    };

    const handleSaveBanner = async (e) => {
        e.preventDefault();
        setSavingBanner(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    key: 'flash_sale',
                    value: bannerSettings,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            alert('Banner settings saved successfully!');
        } catch (error) {
            console.error('Error saving banner settings:', error);
            alert('Failed to save banner settings');
        } finally {
            setSavingBanner(false);
        }
    };

    const loadPages = async () => {
        try {
            const pagesList = await metaService.getFacebookPages();
            setPages(pagesList);
            if (pagesList.length > 0) {
                // Select the first page by default
                const firstPage = pagesList[0];
                setSelectedPage(firstPage);
                metaService.setFacebookPage(firstPage.id, firstPage.access_token);

                // Try to get linked Instagram account
                try {
                    await metaService.getInstagramAccount();
                } catch (e) {
                    console.log('No Instagram account linked to this page');
                }
            }
        } catch (error) {
            console.error('Failed to load pages:', error);
        }
    };

    const handleConnectFacebook = async () => {
        try {
            await metaService.loginWithFacebook();
            setIsConnected(true);
            await loadPages();
            setPostStatus({ type: 'success', message: 'Connected to Facebook successfully!' });
        } catch (error) {
            setPostStatus({ type: 'error', message: 'Failed to connect: ' + error.message });
        }
    };

    const handlePageChange = (e) => {
        const pageId = e.target.value;
        const page = pages.find(p => p.id === pageId);
        if (page) {
            setSelectedPage(page);
            metaService.setFacebookPage(page.id, page.access_token);
            // Reload Instagram account for new page
            metaService.getInstagramAccount().catch(() => { });
        }
    };

    const handleCreateCampaign = (e) => {
        e.preventDefault();

        const newCampaign = {
            id: Date.now(),
            name: campaignName,
            type: campaignType,
            audience: targetAudience,
            message,
            discount,
            status: 'Scheduled',
            sent: 0,
            opened: 0,
            clicked: 0,
            date: new Date().toLocaleDateString()
        };

        // Save to LocalStorage
        const existing = JSON.parse(localStorage.getItem('okasina_campaigns') || '[]');
        localStorage.setItem('okasina_campaigns', JSON.stringify([newCampaign, ...existing]));

        alert('Campaign Created Successfully! (Saved to local storage)');

        // Reset Form
        setCampaignName('');
        setMessage('');
        setDiscount('');
    };

    const handlePost = async (e) => {
        e.preventDefault();

        if (!isConnected) {
            setPostStatus({ type: 'error', message: 'Please connect to Facebook first!' });
            return;
        }

        if (socialPlatform === 'instagram' && !imageUrl) {
            setPostStatus({ type: 'error', message: 'Image is required for Instagram posts!' });
            return;
        }

        setIsPosting(true);
        setPostStatus(null);

        try {
            let result;

            if (socialPlatform === 'all') {
                result = await metaService.postToAll({ message: postContent, imageUrl });
            } else if (socialPlatform === 'facebook') {
                result = await metaService.postToFacebook({ message: postContent, imageUrl });
            } else if (socialPlatform === 'instagram') {
                result = await metaService.postToInstagram({ caption: postContent, imageUrl });
            } else {
                // TikTok not supported via API yet
                throw new Error('TikTok posting is not supported via API yet. Please post manually.');
            }

            setPostStatus({
                type: 'success',
                message: `Successfully posted to ${socialPlatform === 'all' ? 'Facebook & Instagram' : socialPlatform}!`
            });
            setPostContent('');
            setImageUrl('');

        } catch (error) {
            setPostStatus({ type: 'error', message: error.message });
        } finally {
            setIsPosting(false);
        }
    };

    const socialStats = {
        facebook: {
            followers: '2,450',
            engagement: '8.5%',
            reach: '12.3K',
            posts: 45
        },
        instagram: {
            followers: '1,789',
            engagement: '12.3%',
            reach: '8.9K',
            posts: 67
        },
        tiktok: {
            followers: '3,210',
            engagement: '15.7%',
            reach: '25.4K',
            posts: 34
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link to="/admin" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Marketing Hub</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your storefront promotions and social reach</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-gray-100 rounded-xl border border-gray-200 p-1.5 shadow-inner">
                    <div className="flex flex-wrap gap-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'overview'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('social')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'social'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Social Media
                        </button>
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'email'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Email & SMS
                        </button>
                        <button
                            onClick={() => setActiveTab('promotions')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'promotions'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Promotions
                        </button>
                        <button
                            onClick={() => setActiveTab('banner')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'banner'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Flash Sale Banner
                        </button>
                    </div>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Active Campaigns</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Megaphone className="text-blue-600" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Reach</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">46.6K</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Users className="text-purple-600" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Avg. Engagement</p>
                                        <p className="text-3xl font-bold text-green-600 mt-2">12.2%</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="text-green-600" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Active Discounts</p>
                                        <p className="text-3xl font-bold text-orange-600 mt-2">5</p>
                                    </div>
                                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <Percent className="text-orange-600" size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                                <Mail size={32} className="mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Email Marketing</h3>
                                <p className="text-blue-100 mb-4">Send targeted emails to your customers</p>
                                <button
                                    onClick={() => setActiveTab('email')}
                                    className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                                >
                                    Create Email
                                </button>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                                <Share2 size={32} className="mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Social Media</h3>
                                <p className="text-purple-100 mb-4">Post to Facebook, Instagram & TikTok</p>
                                <button
                                    onClick={() => setActiveTab('social')}
                                    className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                                >
                                    Create Post
                                </button>
                            </div>

                            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
                                <Gift size={32} className="mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Promotions</h3>
                                <p className="text-pink-100 mb-4">Create discount codes and special offers</p>
                                <button
                                    onClick={() => setActiveTab('promotions')}
                                    className="px-4 py-2 bg-white text-pink-600 rounded-lg hover:bg-pink-50 transition-colors font-medium"
                                >
                                    Create Promo
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Social Media Tab */}
                {activeTab === 'social' && (
                    <>
                        {/* Connection Status */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        <Facebook className={isConnected ? 'text-green-600' : 'text-gray-400'} size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Facebook & Instagram Integration</h3>
                                        <p className="text-sm text-gray-500">
                                            {isConnected
                                                ? `Connected to ${selectedPage ? selectedPage.name : 'Facebook'}`
                                                : 'Connect your Facebook Page to post directly'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {!isConnected ? (
                                        <button
                                            onClick={handleConnectFacebook}
                                            className="px-6 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors font-medium flex items-center gap-2"
                                        >
                                            <Facebook size={20} />
                                            Connect Facebook
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <select
                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                value={selectedPage?.id || ''}
                                                onChange={handlePageChange}
                                            >
                                                {pages.map(page => (
                                                    <option key={page.id} value={page.id}>{page.name}</option>
                                                ))}
                                            </select>
                                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center gap-2">
                                                <CheckCircle size={16} />
                                                Connected
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Social Media Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Facebook */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Facebook className="text-blue-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Facebook</h3>
                                        <p className="text-sm text-gray-500">@okasina.trading</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Followers</p>
                                        <p className="text-2xl font-bold text-gray-900">{socialStats.facebook.followers}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Engagement</p>
                                        <p className="text-2xl font-bold text-green-600">{socialStats.facebook.engagement}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Reach</p>
                                        <p className="text-lg font-semibold text-gray-900">{socialStats.facebook.reach}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Posts</p>
                                        <p className="text-lg font-semibold text-gray-900">{socialStats.facebook.posts}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Instagram */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                        <Instagram className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Instagram</h3>
                                        <p className="text-sm text-gray-500">@okasina.trading</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Followers</p>
                                        <p className="text-2xl font-bold text-gray-900">{socialStats.instagram.followers}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Engagement</p>
                                        <p className="text-2xl font-bold text-green-600">{socialStats.instagram.engagement}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Reach</p>
                                        <p className="text-lg font-semibold text-gray-900">{socialStats.instagram.reach}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Posts</p>
                                        <p className="text-lg font-semibold text-gray-900">{socialStats.instagram.posts}</p>
                                    </div>
                                </div>
                            </div>

                            {/* TikTok */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                                        <Video className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">TikTok</h3>
                                        <p className="text-sm text-gray-500">@okasina.trading</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Followers</p>
                                        <p className="text-2xl font-bold text-gray-900">{socialStats.tiktok.followers}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Engagement</p>
                                        <p className="text-2xl font-bold text-green-600">{socialStats.tiktok.engagement}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Reach</p>
                                        <p className="text-lg font-semibold text-gray-900">{socialStats.tiktok.reach}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Videos</p>
                                        <p className="text-lg font-semibold text-gray-900">{socialStats.tiktok.posts}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Create Social Post */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Social Media Post</h2>

                            {postStatus && (
                                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${postStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                    {postStatus.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    {postStatus.message}
                                </div>
                            )}

                            <form onSubmit={handlePost} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Platform
                                        </label>
                                        <select
                                            value={socialPlatform}
                                            onChange={(e) => setSocialPlatform(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="facebook">Facebook</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="all">Facebook & Instagram</option>
                                            <option value="tiktok">TikTok (Manual only)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Schedule Date & Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Post Content
                                    </label>
                                    <textarea
                                        value={postContent}
                                        onChange={(e) => setPostContent(e.target.value)}
                                        placeholder="Write your post content here... Include hashtags for better reach! #OkasinaTrading #Fashion #Mauritius"
                                        rows={6}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        {postContent.length} characters
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Image URL {socialPlatform === 'instagram' && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="url"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required={socialPlatform === 'instagram'}
                                        />
                                        <p className="text-sm text-gray-500">
                                            Enter a direct URL to an image (JPG/PNG). For Instagram, image is required.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                                        onClick={() => alert('Scheduling requires backend setup. Posting immediately for now.')}
                                    >
                                        <Clock size={20} />
                                        Schedule Post
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPosting || !isConnected}
                                        className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center gap-2 font-medium ${isPosting || !isConnected
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700'
                                            }`}
                                    >
                                        {isPosting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                        {isPosting ? 'Posting...' : 'Post Now'}
                                    </button>
                                    <button
                                        type="button"
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        Save Draft
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Recent Social Posts */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Posts</h2>
                            <div className="space-y-4">
                                {[
                                    {
                                        platform: 'Instagram',
                                        icon: Instagram,
                                        color: 'from-purple-500 to-pink-500',
                                        content: 'New arrivals! Beautiful sarees collection 🌸 #OkasinaTrading #Fashion',
                                        date: '2 hours ago',
                                        likes: 234,
                                        comments: 45,
                                        shares: 12
                                    },
                                    {
                                        platform: 'Facebook',
                                        icon: Facebook,
                                        color: 'from-blue-500 to-blue-600',
                                        content: 'Flash Sale! 30% off on all kurtis this weekend only! 🎉',
                                        date: '5 hours ago',
                                        likes: 189,
                                        comments: 32,
                                        shares: 28
                                    },
                                    {
                                        platform: 'TikTok',
                                        icon: Video,
                                        color: 'from-black to-gray-800',
                                        content: 'How to style your lehenga for weddings 💃 #FashionTips',
                                        date: '1 day ago',
                                        likes: 567,
                                        comments: 89,
                                        shares: 45
                                    }
                                ].map((post, index) => {
                                    const Icon = post.icon;
                                    return (
                                        <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className={`w-12 h-12 bg-gradient-to-br ${post.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                <Icon className="text-white" size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-medium text-gray-900">{post.platform}</h3>
                                                    <span className="text-sm text-gray-500">{post.date}</span>
                                                </div>
                                                <p className="text-gray-700 mb-3">{post.content}</p>
                                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Heart size={16} />
                                                        <span>{post.likes}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MessageCircle size={16} />
                                                        <span>{post.comments}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Share2 size={16} />
                                                        <span>{post.shares}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* Email & SMS Tab */}
                {activeTab === 'email' && (
                    <>
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Email/SMS Campaign</h2>
                            <form onSubmit={handleCreateCampaign} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Campaign Name
                                        </label>
                                        <input
                                            type="text"
                                            value={campaignName}
                                            onChange={(e) => setCampaignName(e.target.value)}
                                            placeholder="e.g., Summer Sale 2024"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Campaign Type
                                        </label>
                                        <select
                                            value={campaignType}
                                            onChange={(e) => setCampaignType(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="email">Email Campaign</option>
                                            <option value="sms">SMS Campaign</option>
                                            <option value="both">Email + SMS</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Target Audience
                                        </label>
                                        <select
                                            value={targetAudience}
                                            onChange={(e) => setTargetAudience(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="all">All Customers</option>
                                            <option value="new">New Customers</option>
                                            <option value="returning">Returning Customers</option>
                                            <option value="vip">VIP Customers</option>
                                            <option value="inactive">Inactive Customers</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Discount Code (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={discount}
                                            onChange={(e) => setDiscount(e.target.value)}
                                            placeholder="e.g., SUMMER20"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Write your campaign message here..."
                                        rows={6}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                                    >
                                        <Send size={20} />
                                        Launch Campaign
                                    </button>
                                    <button
                                        type="button"
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        Save as Draft
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Recent Email Campaigns */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Email Campaigns</h2>
                            <div className="space-y-4">
                                {(JSON.parse(localStorage.getItem('okasina_campaigns') || '[]').length > 0 ? JSON.parse(localStorage.getItem('okasina_campaigns')) : [
                                    {
                                        name: 'New Arrivals - Spring Collection',
                                        type: 'Email',
                                        sent: '2,450',
                                        opened: '1,234',
                                        clicked: '456',
                                        status: 'Completed'
                                    },
                                    {
                                        name: 'Flash Sale - 50% Off',
                                        type: 'Email + SMS',
                                        sent: '3,120',
                                        opened: '1,890',
                                        clicked: '892',
                                        status: 'Active'
                                    }
                                ]).map((campaign, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                                <Mail className="text-white" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                                                <p className="text-sm text-gray-500">{campaign.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Sent</p>
                                                <p className="font-medium text-gray-900">{campaign.sent}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Opened</p>
                                                <p className="font-medium text-gray-900">{campaign.opened}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Clicked</p>
                                                <p className="font-medium text-gray-900">{campaign.clicked}</p>
                                            </div>
                                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${campaign.status === 'Active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Promotions Tab */}
                {activeTab === 'promotions' && (
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Promotions & Discount Codes</h2>
                        <div className="space-y-4">
                            {[
                                { code: 'SUMMER20', discount: '20%', uses: 145, limit: 500, expires: '2025-12-31' },
                                { code: 'NEWCUSTOMER', discount: '15%', uses: 89, limit: 200, expires: '2025-12-31' },
                                { code: 'FLASH50', discount: '50%', uses: 234, limit: 300, expires: '2025-11-30' },
                                { code: 'FREESHIP', discount: 'Free Shipping', uses: 567, limit: 1000, expires: '2025-12-31' },
                                { code: 'VIP30', discount: '30%', uses: 45, limit: 100, expires: '2025-12-31' }
                            ].map((promo, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg border border-orange-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <Tag className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{promo.code}</h3>
                                            <p className="text-sm text-gray-600">{promo.discount} off</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600">Uses</p>
                                            <p className="font-medium text-gray-900">{promo.uses}/{promo.limit}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600">Expires</p>
                                            <p className="font-medium text-gray-900">{promo.expires}</p>
                                        </div>
                                        <button className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-colors flex items-center gap-2 font-medium">
                            <Plus size={20} />
                            Create New Promotion
                        </button>
                    </div>
                )}

                {/* Banner Tab */}
                {activeTab === 'banner' && (
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Zap className="text-orange-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Flash Sale Banner Settings</h2>
                                <p className="text-sm text-gray-500">Manage the promotional banner shown at the top of every page</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveBanner} className="space-y-6 max-w-2xl">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                                <p className="text-sm font-medium text-gray-700 mb-2 underline">Live Preview:</p>
                                <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 rounded shadow-sm text-center">
                                    <span className="font-bold text-sm uppercase tracking-wide">
                                        {bannerSettings.text}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100 mb-6">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={bannerSettings.is_active}
                                    onChange={(e) => setBannerSettings(prev => ({ ...prev, is_active: e.target.checked }))}
                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="font-medium text-blue-900">
                                    Show Banner on Site
                                </label>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Banner Text
                                    </label>
                                    <input
                                        type="text"
                                        value={bannerSettings.text}
                                        onChange={(e) => setBannerSettings(prev => ({ ...prev, text: e.target.value }))}
                                        placeholder="e.g. Flash Sale: Up to 70% OFF!"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Keep it short and catchy for best results.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sale End Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={bannerSettings.end_date.slice(0, 16)}
                                        onChange={(e) => setBannerSettings(prev => ({ ...prev, end_date: new Date(e.target.value).toISOString() }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">The countdown timer will count down to this date.</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={savingBanner}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                            >
                                {savingBanner ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                {savingBanner ? 'Saving...' : 'Save Banner Settings'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
