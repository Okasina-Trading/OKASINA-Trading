import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useToast } from '../../contexts/ToastContext';
import { Facebook, Instagram, Twitter, Youtube, MessageCircle, Save, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminSocialMediaPage() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [socialMedia, setSocialMedia] = useState({
        facebook: '',
        instagram: '',
        twitter: '',
        pinterest: '',
        youtube: '',
        tiktok: '',
        whatsapp: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('key', 'social_media')
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                // If settings don't exist, create them
                if (error.code === 'PGRST116') {
                    await createDefaultSettings();
                }
            } else if (data) {
                setSocialMedia(data.value);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const createDefaultSettings = async () => {
        const { error } = await supabase
            .from('site_settings')
            .insert({
                key: 'social_media',
                value: socialMedia,
                description: 'Social media platform URLs'
            });

        if (error) {
            console.error('Error creating settings:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    key: 'social_media',
                    value: socialMedia,
                    description: 'Social media platform URLs'
                });

            if (error) throw error;

            addToast('Social media links updated successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            addToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (platform, value) => {
        setSocialMedia(prev => ({
            ...prev,
            [platform]: value
        }));
    };

    const platforms = [
        { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourpage', color: 'text-blue-600' },
        { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourprofile', color: 'text-pink-600' },
        { key: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/yourprofile', color: 'text-sky-500' },
        { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourchannel', color: 'text-red-600' },
        { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '+1234567890', color: 'text-green-600' },
        { key: 'pinterest', label: 'Pinterest', icon: ExternalLink, placeholder: 'https://pinterest.com/yourprofile', color: 'text-red-500' },
        { key: 'tiktok', label: 'TikTok', icon: ExternalLink, placeholder: 'https://tiktok.com/@yourprofile', color: 'text-gray-900' }
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading settings...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link to="/admin" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Media Settings</h1>
                    <p className="text-gray-600">Manage your social media links. These will appear in the website footer.</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="space-y-6">
                        {platforms.map((platform) => {
                            const Icon = platform.icon;
                            return (
                                <div key={platform.key} className="flex items-start space-x-4">
                                    <div className={`mt-3 ${platform.color}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-900 mb-2">
                                            {platform.label}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={socialMedia[platform.key] || ''}
                                                onChange={(e) => handleChange(platform.key, e.target.value)}
                                                placeholder={platform.placeholder}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                            />
                                            {socialMedia[platform.key] && (
                                                <a
                                                    href={socialMedia[platform.key]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <ExternalLink size={20} />
                                                </a>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {platform.key === 'whatsapp'
                                                ? 'Enter phone number with country code (e.g., +12345678900)'
                                                : 'Enter the full URL to your profile'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Leave fields empty to hide them from the footer.
                            </p>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center px-6 py-3 bg-black text-white font-bold uppercase text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={16} className="mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="mt-8 bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Preview</h2>
                    <p className="text-sm text-gray-600 mb-4">This is how your social media icons will appear in the footer:</p>
                    <div className="flex space-x-4">
                        {platforms.map((platform) => {
                            const Icon = platform.icon;
                            if (!socialMedia[platform.key]) return null;
                            return (
                                <a
                                    key={platform.key}
                                    href={socialMedia[platform.key]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${platform.color} hover:opacity-70 transition-opacity`}
                                    title={platform.label}
                                >
                                    <Icon size={20} />
                                </a>
                            );
                        })}
                    </div>
                    {Object.values(socialMedia).every(val => !val) && (
                        <p className="text-gray-400 text-sm">No social media links configured yet.</p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
