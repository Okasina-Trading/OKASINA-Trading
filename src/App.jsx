import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import NewArrivalsPage from './pages/NewArrivalsPage';
import FeedbackPage from './pages/FeedbackPage';
import WishlistPage from './pages/WishlistPage';
import MyAccountPage from './pages/MyAccountPage';
import AdminMarketingPage from './pages/admin/AdminMarketingPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AlbumImportPage from './pages/admin/AlbumImportPage';
import MediaManagerPage from './pages/admin/MediaManagerPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminAutomationPage from './pages/admin/AdminAutomationPage';
import AdminAiEmployeesPage from './pages/admin/AdminAiEmployeesPage';
import StockManagerPage from './pages/StockManagerPage';
import ComparePage from './pages/ComparePage';
import AdminSocialMediaPage from './pages/admin/AdminSocialMediaPage';
import HeaderNew from './components/HeaderNew';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { WishlistProvider } from './contexts/WishlistContext';
import Breadcrumbs from './components/common/Breadcrumbs';
import ProductComparisonBar from './components/product/ProductComparisonBar';
import { HelmetProvider } from 'react-helmet-async';

const StylistChatWidget = React.lazy(() => import('./components/ai/StylistChatWidget'));

export default function App() {
    return (
        <ErrorBoundary>
            <HelmetProvider>
                <AuthProvider>
                    <CartProvider>
                        <ToastProvider>
                            <ComparisonProvider>
                                <WishlistProvider>
                                    <CurrencyProvider>
                                        <BrowserRouter>
                                            <div className="flex flex-col min-h-screen">
                                                <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded-md">
                                                    Skip to content
                                                </a>
                                                <HeaderNew />
                                                <main id="main-content" className="flex-grow">
                                                    <Breadcrumbs />
                                                    <Routes>
                                                        <Route path="/" element={<HomePage />} />
                                                        <Route path="/shop" element={<ShopPage />} />
                                                        <Route path="/product/:id" element={<ProductPage />} />
                                                        <Route path="/cart" element={<CartPage />} />
                                                        <Route path="/checkout" element={<CheckoutPage />} />
                                                        <Route path="/orders" element={<OrdersPage />} />
                                                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                                                        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                                                        <Route path="/login" element={<LoginPage />} />
                                                        <Route path="/new-arrivals" element={<NewArrivalsPage />} />
                                                        <Route path="/feedback" element={<FeedbackPage />} />
                                                        <Route path="/wishlist" element={<WishlistPage />} />
                                                        <Route path="/account" element={<MyAccountPage />} />
                                                        <Route path="/compare" element={<ComparePage />} />

                                                        {/* Protected Admin Routes */}
                                                        <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
                                                        <Route path="/admin/products" element={<ProtectedRoute><AdminProductsPage /></ProtectedRoute>} />
                                                        <Route path="/admin/orders" element={<ProtectedRoute><AdminOrdersPage /></ProtectedRoute>} />
                                                        <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalyticsPage /></ProtectedRoute>} />
                                                        <Route path="/admin/marketing" element={<ProtectedRoute><AdminMarketingPage /></ProtectedRoute>} />
                                                        <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviewsPage /></ProtectedRoute>} />
                                                        <Route path="/admin/media" element={<ProtectedRoute><MediaManagerPage /></ProtectedRoute>} />
                                                        <Route path="/admin/stock-manager" element={<ProtectedRoute><StockManagerPage /></ProtectedRoute>} />
                                                        <Route path="/admin/coupons" element={<ProtectedRoute><AdminCouponsPage /></ProtectedRoute>} />
                                                        <Route path="/admin/automation" element={<ProtectedRoute><AdminAutomationPage /></ProtectedRoute>} />
                                                        <Route path="/admin/ai-employees" element={<ProtectedRoute><AdminAiEmployeesPage /></ProtectedRoute>} />
                                                        <Route path="/admin/album-import" element={<ProtectedRoute><AlbumImportPage /></ProtectedRoute>} />
                                                        <Route path="/admin/social-media" element={<ProtectedRoute><AdminSocialMediaPage /></ProtectedRoute>} />
                                                    </Routes>
                                                </main>
                                                <ProductComparisonBar />
                                                <React.Suspense fallback={null}>
                                                    <StylistChatWidget />
                                                </React.Suspense>
                                                <Footer />
                                            </div>
                                        </BrowserRouter>
                                    </CurrencyProvider>
                                </WishlistProvider>
                            </ComparisonProvider>
                        </ToastProvider>
                    </CartProvider>
                </AuthProvider>
            </HelmetProvider>
        </ErrorBoundary>
    );
}
