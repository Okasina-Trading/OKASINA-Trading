import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Truck, Home, CreditCard, Smartphone } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function CheckoutPage() {
    const { cart, clearCart } = useCart();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [shippingMethod, setShippingMethod] = useState('postage'); // 'postage' or 'door'
    const [paymentMethod, setPaymentMethod] = useState('juice'); // 'juice' or 'card'

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        notes: ''
    });

    const SHIPPING_RATES = {
        postage: 100,
        door: 150
    };

    // Calculate subtotal using correct price
    const subtotal = cart.reduce((sum, item) => {
        const price = item.price_mur || item.price;
        return sum + (price * item.quantity);
    }, 0);

    const shippingCost = SHIPPING_RATES[shippingMethod];
    const total = subtotal + shippingCost;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const sendConfirmationEmail = async (orderId) => {
        try {
            const itemsHtml = cart.map(item => `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">x${item.quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">Rs ${((item.price_mur || item.price) * item.quantity).toLocaleString()}</td>
                </tr>
            `).join('');

            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #000;">Order Confirmed!</h1>
                    <p>Hi ${formData.fullName},</p>
                    <p>Thank you for your order. We have received it and will begin processing shortly.</p>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Order #${orderId.slice(0, 8).toUpperCase()}</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            ${itemsHtml}
                        </table>
                        <div style="margin-top: 20px; text-align: right; font-weight: bold;">
                            Total: Rs ${total.toLocaleString()}
                        </div>
                    </div>

                    ${paymentMethod === 'juice' ? `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeeba; color: #856404;">
                        <strong>Payment Required (Juice):</strong><br/>
                        Please transfer <strong>Rs ${total.toLocaleString()}</strong> to:<br/>
                        <strong>A-ONE GLOBAL RESOUR LTD</strong><br/>
                        MCB Account: <strong>000449347214</strong><br/>
                        IBAN: <strong>MU39MCBL0901000449347214000MUR</strong><br/>
                        Reference: Order #${orderId.slice(0, 8).toUpperCase()}
                    </div>
                    ` : ''}

                    <p>We will notify you when your order ships!</p>
                    <p>Best,<br/>Okasina Fashion Team</p>
                </div>
            `;

            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: formData.email,
                    subject: `Order Confirmation #${orderId.slice(0, 8).toUpperCase()}`,
                    html: emailHtml
                })
            });
        } catch (error) {
            console.error('Failed to send email:', error);
        }
    };
    return (
        <div className="min-h-screen bg-white pt-20 pb-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Left Column: Forms */}
                    <div>
                        <form onSubmit={(e) => { e.preventDefault(); sendConfirmationEmail('ORD-' + Math.random().toString(36).substr(2, 9)); }} className="space-y-8">

                            {/* 1. Contact Information */}
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b pb-2">1. Contact Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            required
                                            className="w-full border-gray-300 border p-3 focus:ring-black focus:border-black transition-colors"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="w-full border-gray-300 border p-3 focus:ring-black focus:border-black transition-colors"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            className="w-full border-gray-300 border p-3 focus:ring-black focus:border-black transition-colors"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* 2. Shipping Method */}
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b pb-2">2. Shipping Method</h2>
                                <div className="space-y-4">
                                    <label className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${shippingMethod === 'postage' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name="shipping"
                                                checked={shippingMethod === 'postage'}
                                                onChange={() => setShippingMethod('postage')}
                                                className="text-black focus:ring-black mr-3"
                                            />
                                            <div className="flex items-center">
                                                <Truck size={18} className="mr-2 text-gray-500" />
                                                <span className="font-medium">Standard Postage</span>
                                            </div>
                                        </div>
                                        <span className="font-bold">Rs 100</span>
                                    </label>

                                    <label className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${shippingMethod === 'door' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name="shipping"
                                                checked={shippingMethod === 'door'}
                                                onChange={() => setShippingMethod('door')}
                                                className="text-black focus:ring-black mr-3"
                                            />
                                            <div className="flex items-center">
                                                <Home size={18} className="mr-2 text-gray-500" />
                                                <span className="font-medium">Door Delivery</span>
                                            </div>
                                        </div>
                                        <span className="font-bold">Rs 150</span>
                                    </label>
                                </div>
                            </section>

                            {/* 3. Payment Method */}
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b pb-2">3. Payment Method</h2>
                                <div className="space-y-4">
                                    {/* Juice Payment */}
                                    <label className={`block p-4 border cursor-pointer transition-all ${paymentMethod === 'juice' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                        <div className="flex items-center mb-2">
                                            <input
                                                type="radio"
                                                name="payment"
                                                checked={paymentMethod === 'juice'}
                                                onChange={() => setPaymentMethod('juice')}
                                                className="text-black focus:ring-black mr-3"
                                            />
                                            <div className="flex items-center">
                                                <Smartphone size={18} className="mr-2 text-gray-500" />
                                                <span className="font-bold">Juice by MCB</span>
                                            </div>
                                        </div>
                                        {paymentMethod === 'juice' && (
                                            <div className="ml-7 mt-2 text-sm text-gray-600 bg-white p-3 border border-gray-200 rounded">
                                                <p className="font-medium text-black mb-1">Instructions:</p>
                                                <p>1. Open Juice App</p>
                                                <p>2. Pay to: <strong>A-ONE GLOBAL RESOUR LTD</strong></p>
                                                <p>   MCB Account: <strong>000449347214</strong></p>
                                                <p>   IBAN: <strong>MU39MCBL0901000449347214000MUR</strong></p>
                                                <p>3. Use your Name as reference</p>
                                                <p className="mt-2 text-xs text-gray-500">* Order will be processed after payment confirmation.</p>
                                            </div>
                                        )}
                                    </label>

                                    {/* Card Payment */}
                                    <label className={`block p-4 border cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name="payment"
                                                checked={paymentMethod === 'card'}
                                                onChange={() => setPaymentMethod('card')}
                                                className="text-black focus:ring-black mr-3"
                                            />
                                            <div className="flex items-center">
                                                <CreditCard size={18} className="mr-2 text-gray-500" />
                                                <span className="font-bold">Credit / Debit Card</span>
                                            </div>
                                        </div>
                                        {paymentMethod === 'card' && (
                                            <div className="ml-7 mt-2">
                                                <div className="flex gap-2 mb-2">
                                                    <div className="h-6 w-10 bg-gray-200 rounded"></div>
                                                    <div className="h-6 w-10 bg-gray-200 rounded"></div>
                                                    <div className="h-6 w-10 bg-gray-200 rounded"></div>
                                                </div>
                                                <p className="text-xs text-gray-500">Secure payment via Stripe (Demo Mode)</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </section>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (Optional)</label>
                                <textarea
                                    name="notes"
                                    rows="4"
                                    className="w-full border-gray-300 border p-3 focus:ring-black focus:border-black transition-colors"
                                    value={formData.notes}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                {loading ? 'Processing...' : `Place Order (Rs ${total.toLocaleString()})`}
                            </button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 p-8 h-fit sticky top-24">
                        <h2 className="text-lg font-bold uppercase tracking-widest mb-8">Your Order</h2>
                        <div className="space-y-6 mb-8">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-16 h-20 bg-white flex-shrink-0">
                                        <img
                                            src={item.image_url || item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-serif font-medium text-gray-900">{item.name}</h3>
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            Rs {((item.price_mur || Number(item.price)) * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Promo Code Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Promo Code</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter code"
                                    className="flex-1 border-gray-300 border p-2 text-sm focus:ring-black focus:border-black"
                                />
                                <button
                                    type="button"
                                    className="bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-black transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6 space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>Rs {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping</span>
                                <span>Rs {shippingCost}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                                <span>Total</span>
                                <span>Rs {total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
