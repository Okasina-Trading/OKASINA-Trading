import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Mail, Shield, CheckCircle } from 'lucide-react';

export default function DataDeletionPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                            <Trash2 className="text-white" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Data Deletion Instructions</h1>
                            <p className="text-gray-600 mt-1">How to request deletion of your data from OKASINA Trading</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-blue-800">
                            <strong>Your Privacy Matters:</strong> We respect your right to have your personal data deleted from our systems.
                            This page explains how to request data deletion in compliance with GDPR and Mauritius Data Protection Act 2017.
                        </p>
                    </div>
                </div>

                {/* Data We Collect */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="text-purple-600" size={24} />
                        <h2 className="text-2xl font-bold text-gray-900">What Data We Collect via Facebook</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <p className="font-semibold text-gray-900">Public Profile Information</p>
                                <p className="text-gray-600 text-sm">Name, profile picture, and public Facebook ID</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <p className="font-semibold text-gray-900">Email Address</p>
                                <p className="text-gray-600 text-sm">Used for order confirmations and account management</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <p className="font-semibold text-gray-900">Activity Data</p>
                                <p className="text-gray-600 text-sm">Pages you've interacted with, posts you've engaged with</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How to Request Deletion */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Request Data Deletion</h2>

                    <div className="space-y-6">
                        {/* Method 1 */}
                        <div className="border-l-4 border-blue-600 pl-6 py-4 bg-blue-50 rounded-r-lg">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Method 1: Email Request</h3>
                            <ol className="space-y-3 text-gray-700">
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                    <span>Send an email to <a href="mailto:info@okasinatrading.com" className="text-blue-600 hover:underline font-semibold">info@okasinatrading.com</a></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                    <span>Subject line: <strong>"Data Deletion Request - Facebook Login"</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                    <span>Include your Facebook email address or Facebook User ID</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                                    <span>We will confirm deletion within <strong>30 days</strong></span>
                                </li>
                            </ol>
                        </div>

                        {/* Method 2 */}
                        <div className="border-l-4 border-purple-600 pl-6 py-4 bg-purple-50 rounded-r-lg">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Method 2: Revoke Facebook App Access</h3>
                            <ol className="space-y-3 text-gray-700">
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                    <span>Go to Facebook Settings → Apps and Websites</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                    <span>Find "OKASINA Trading" in the list</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                    <span>Click <strong>"Remove"</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                                    <span>Then email us at <a href="mailto:info@okasinatrading.com" className="text-purple-600 hover:underline font-semibold">info@okasinatrading.com</a> to confirm full deletion</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* What Gets Deleted */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">What Gets Deleted</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                <CheckCircle size={20} />
                                Data We Will Delete
                            </h3>
                            <ul className="space-y-2 text-green-800 text-sm">
                                <li>• Your Facebook profile information</li>
                                <li>• Email address from Facebook</li>
                                <li>• Facebook User ID</li>
                                <li>• Login activity logs</li>
                                <li>• Marketing preferences</li>
                            </ul>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                                <Shield size={20} />
                                Data We May Retain
                            </h3>
                            <ul className="space-y-2 text-yellow-800 text-sm">
                                <li>• Order history (legal requirement)</li>
                                <li>• Transaction records (7 years)</li>
                                <li>• Anonymized analytics data</li>
                                <li>• Data required for legal compliance</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Deletion Timeline</h2>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">1</div>
                            <div>
                                <p className="font-semibold text-gray-900">Request Received</p>
                                <p className="text-gray-600 text-sm">We acknowledge your request within 24 hours</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">2</div>
                            <div>
                                <p className="font-semibold text-gray-900">Verification</p>
                                <p className="text-gray-600 text-sm">We verify your identity (1-3 business days)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-600">3</div>
                            <div>
                                <p className="font-semibold text-gray-900">Deletion Complete</p>
                                <p className="text-gray-600 text-sm">Data deleted within 30 days, confirmation sent</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center gap-4 mb-4">
                        <Mail size={32} />
                        <h2 className="text-2xl font-bold">Need Help?</h2>
                    </div>
                    <p className="mb-6">
                        If you have any questions about data deletion or your privacy rights, please contact us:
                    </p>
                    <div className="space-y-2 mb-6">
                        <p><strong>Email:</strong> <a href="mailto:info@okasinatrading.com" className="underline hover:text-blue-200">info@okasinatrading.com</a></p>
                        <p><strong>Phone:</strong> +230 5755 6565</p>
                        <p><strong>Address:</strong> Morrisson Street, Souillac, Mauritius 60810</p>
                    </div>
                    <Link
                        to="/privacy-policy"
                        className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                    >
                        View Full Privacy Policy
                    </Link>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-8">
                    <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">
                        ← Back to Store
                    </Link>
                </div>
            </div>
        </div>
    );
}
