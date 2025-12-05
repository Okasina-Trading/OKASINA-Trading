import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, MessageCircle } from 'lucide-react';
import NewsletterSignup from './NewsletterSignup';
import { supabase } from '../supabase';

export default function Footer() {
    const [socialMedia, setSocialMedia] = useState({
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        whatsapp: ''
    });

    useEffect(() => {
        fetchSocialMedia();
    }, []);

    const fetchSocialMedia = async () => {
        try {
            const { data } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'social_media')
                .single();

            if (data?.value) {
                setSocialMedia(data.value);
            }
        } catch (error) {
            console.error('Error fetching social media:', error);
        }
    };

    return (
        <footer className="bg-[#111111] text-white pt-20 pb-10 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <h3 className="text-2xl font-serif font-bold text-white mb-6 tracking-widest">OKASINA</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Redefining elegance with a curated collection of modern Indian wear. Tradition meets contemporary style.
                        </p>
                        <div className="flex space-x-4">
                            {socialMedia.facebook && (
                                <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <Facebook size={18} />
                                </a>
                            )}
                            {socialMedia.instagram && (
                                <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <Instagram size={18} />
                                </a>
                            )}
                            {socialMedia.twitter && (
                                <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <Twitter size={18} />
                                </a>
                            )}
                            {socialMedia.youtube && (
                                <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <Youtube size={18} />
                                </a>
                            )}
                            {socialMedia.whatsapp && (
                                <a href={`https://wa.me/${socialMedia.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <MessageCircle size={18} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-white">Shop</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="/new-arrivals" className="hover:text-white transition-colors block">New Arrivals</Link></li>
                            <li><Link to="/shop?category=clothing" className="hover:text-white transition-colors block">Best Sellers</Link></li>
                            <li><Link to="/shop?category=Accessories" className="hover:text-white transition-colors block">Accessories</Link></li>
                            <li><Link to="/shop?sale=true" className="hover:text-white transition-colors block">Sale</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-white">Support</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="/orders" className="hover:text-white transition-colors">Track Order</Link></li>
                            <li><Link to="/feedback" className="hover:text-white transition-colors">Feedback</Link></li>
                            <li><Link to="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
                            <li><Link to="/account" className="hover:text-white transition-colors">My Account</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-white">Stay Updated</h4>
                        <p className="text-gray-400 text-sm mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
                        <NewsletterSignup />
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 uppercase tracking-wider">
                    <p>&copy; {new Date().getFullYear()} OKASINA FASHION. ALL RIGHTS RESERVED.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
                        <Link to="/terms-of-service" className="hover:text-white">Terms of Service</Link>
                        <Link to="/admin" className="hover:text-white">Admin Dashboard</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
