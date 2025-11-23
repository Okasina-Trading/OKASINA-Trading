import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import CartPage from './pages/CartPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminMarketingPage from './pages/admin/AdminMarketingPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AlbumImportPage from './pages/admin/AlbumImportPage';
// ... existing imports remain unchanged
import StockManagerPage from './pages/StockManagerPage';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <BrowserRouter>
                    <div className="flex flex-col min-h-screen">
                        <Header />
                        <main className="flex-grow">
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/shop" element={<ShopPage />} />
                                <Route path="/product/:id" element={<ProductPage />} />
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/checkout" element={<CheckoutPage />} />
                                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                                <Route path="/login" element={<LoginPage />} />

                                {/* Protected Admin Routes */}
                                <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
                                <Route path="/admin/products" element={<ProtectedRoute><AdminProductsPage /></ProtectedRoute>} />
                                <Route path="/admin/orders" element={<ProtectedRoute><AdminOrdersPage /></ProtectedRoute>} />
                                <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalyticsPage /></ProtectedRoute>} />
                                <Route path="/admin/marketing" element={<ProtectedRoute><AdminMarketingPage /></ProtectedRoute>} />
                                <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviewsPage /></ProtectedRoute>} />
                                <Route path="/admin/media" element={<ProtectedRoute><MediaManagerPage /></ProtectedRoute>} />
                                <Route path="/admin/stock-manager" element={<ProtectedRoute><StockManagerPage /></ProtectedRoute>} />
                                {/* 🎉 New Album Import route */}
                                <Route path="/admin/album-import" element={<ProtectedRoute><AlbumImportPage /></ProtectedRoute>} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </BrowserRouter>
            </CartProvider>
        </AuthProvider>
    );
}
