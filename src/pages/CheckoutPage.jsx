import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Truck, Home, CreditCard, Smartphone, Gift, Check } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { LoyaltyService } from '../services/LoyaltyService';

export default function CheckoutPage() {
    const { cart, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [shippingMethod, setShippingMethod] = useState('postage');
    const [paymentMethod, setPaymentMethod] = useState('juice');

    // Loyalty State
    const [loyaltyProfile, setLoyaltyProfile] = useState(null);
    const [redeemPoints, setRedeemPoints] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        notes: ''
    });

    useEffect(() => {
        if (user) {
            loadLoyaltyProfile();
        }
    }, [user]);

    const loadLoyaltyProfile = async () => {
        const profile = await LoyaltyService.getProfile(user.id);
        setLoyaltyProfile(profile);
    };

    const SHIPPING_RATES = { postage: 100, door: 150 };

    // Calculations
    const subtotal = cart.reduce((sum, item) => {
        const price = item.price_mur || item.price || 0;
        return sum + (price * item.quantity);
    }, 0);

    const shippingCost = SHIPPING_RATES[shippingMethod];

    // Loyalty Logic
    const pointsAvailable = loyaltyProfile?.points_balance || 0;
    const maxDiscount = LoyaltyService.calculateDiscount(pointsAvailable);
    // Don't allow discount > subtotal
    const appliedDiscount = redeemPoints ? Math.min(maxDiscount, subtotal) : 0;
    const pointsToRedeem = redeemPoints ? Math.ceil(appliedDiscount / 1) : 0; // 1 Point = 1 Rs (as per service)

    const total = subtotal + shippingCost - appliedDiscount;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create Order in Supabase
            // Prepare items JSON
            const orderItems = cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price_mur || item.price,
                quantity: item.quantity,
                image: item.image_url || item.image,
                selectedSize: item.selectedSize,
                color: item.selectedColor
            }));

            const orderData = {
                user_id: user?.id || null, // Allow guest checkout if RLS allows (or user is null)
                customer_name: formData.fullName,
                customer_email: formData.email,
                customer_phone: formData.phone,
                shipping_address: `${formData.address}${formData.city ? ', ' + formData.city : ''}`,
                shipping_method: shippingMethod,
                payment_method: paymentMethod,
                order_notes: formData.notes,
                items: orderItems, // stored as JSONB
                total_amount: total,
                total: total, // LEGACY/COMPATIBILITY: DB has 'total' column as NOT NULL
                subtotal_amount: subtotal,
                shipping_cost: shippingCost,
                status: 'pending',
                // Loyalty Fields
                points_redeemed: pointsToRedeem,
                discount_amount: appliedDiscount
            };


            // Helper to insert order with fallback for missing columns
            const insertOrderSpy = async (data) => {
                try {
                    return await supabase.from('orders').insert([data]).select().single();
                } catch (err) {
                    // Ref: Postgres error 42703 = Undefined Column
                    // Supabase JS often returns message "pgrst: ..." or error object
                    // We check if error relates to "points_redeemed" or "discount_amount"
                    if (err.message && (err.message.includes('points_redeemed') || err.message.includes('discount_amount'))) {
                        console.warn('Loyalty columns missing in DB. Retrying without loyalty data...');
                        // Strip loyalty fields
                        const { points_redeemed, discount_amount, ...safeData } = data;
                        return await supabase.from('orders').insert([safeData]).select().single();
                    }
                    throw err;
                }
            };

            const { data: order, error } = await insertOrderSpy(orderData);

            if (error) throw error;

            console.log('Order created:', order.id);

            // 2. Send Email (using existing API)
            await sendConfirmationEmail(order.id);

            // 3. Success
            clearCart();
            addToast('Order placed successfully! Check your email.', 'success');

            // Redirect to Orders or Success page
            if (user) {
                navigate('/orders');
            } else {
                navigate('/');
            }

        } catch (error) {
            console.error('Checkout Error:', error);
            if (error.message && (error.message.includes('check_stock') || error.message.includes('stock_qty'))) {
                addToast('Order failed: One or more items are out of stock.', 'error');
            } else {
                addToast(`Failed to place order: ${error.message}`, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const sendConfirmationEmail = async (orderId) => {
        // ... (Keep existing email logic)
        try {
            const itemsHtml = cart.map(item => `
                <tr>
                    <td style="padding: 10px;">${item.name}</td>
                    <td style="padding: 10px;">x${item.quantity}</td>
                    <td style="padding: 10px;">Rs ${((item.price_mur || item.price) * item.quantity).toLocaleString()}</td>
                </tr>
            `).join('');

            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px;">
                    <h1>Order Received!</h1>
                    <p>Hi ${formData.fullName}, thanks for your order #${orderId.slice(0, 8)}.</p>
                    <table style="width: 100%;">${itemsHtml}</table>
                    <p><strong>Total: Rs ${total.toLocaleString()}</strong></p>
                    ${appliedDiscount > 0 ? `<p style="color: green;">(Includes Rs ${appliedDiscount} Loyalty Discount)</p>` : ''}
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
        } catch (e) { console.error('Email failed but order created'); }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen pt-32 pb-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
                <button onClick={() => navigate('/shop')} className="text-blue-600 underline">Continue Shopping</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-20 pb-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Left: Form */}
                    <div>
                        <form onSubmit={handlePlaceOrder} className="space-y-8">
                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b pb-2">1. Contact Info</h2>
                                <div className="space-y-4">
                                    <input type="text" name="fullName" placeholder="Full Name" required className="w-full border p-3" value={formData.fullName} onChange={handleChange} />
                                    <input type="email" name="email" placeholder="Email" required className="w-full border p-3" value={formData.email} onChange={handleChange} />
                                    <input type="tel" name="phone" placeholder="Phone Number" required className="w-full border p-3" value={formData.phone} onChange={handleChange} />
                                    <input type="text" name="address" placeholder="Delivery Address" required={shippingMethod === 'door'} className="w-full border p-3" value={formData.address} onChange={handleChange} />
                                    <input type="text" name="city" placeholder="City / Town" className="w-full border p-3" value={formData.city} onChange={handleChange} />
                                </div>
                            </section>

                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b pb-2">2. Shipping</h2>
                                <div className="space-y-3">
                                    <label className={`flex p-4 border cursor-pointer ${shippingMethod === 'postage' ? 'bg-gray-50 border-black' : ''}`}>
                                        <input type="radio" onChange={() => setShippingMethod('postage')} checked={shippingMethod === 'postage'} className="mr-3" />
                                        <div className="flex-1"><span className="font-bold block">Standard Postage</span>Rs 100 via Mauritius Post</div>
                                    </label>
                                    <label className={`flex p-4 border cursor-pointer ${shippingMethod === 'door' ? 'bg-gray-50 border-black' : ''}`}>
                                        <input type="radio" onChange={() => setShippingMethod('door')} checked={shippingMethod === 'door'} className="mr-3" />
                                        <div className="flex-1"><span className="font-bold block">Door Delivery</span>Rs 150 courier service</div>
                                    </label>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-lg font-bold uppercase tracking-widest mb-6 border-b pb-2">3. Payment</h2>
                                <div className="space-y-3">
                                    <label className={`flex p-4 border cursor-pointer ${paymentMethod === 'juice' ? 'bg-gray-50 border-black' : ''}`}>
                                        <input type="radio" onChange={() => setPaymentMethod('juice')} checked={paymentMethod === 'juice'} className="mr-3" />
                                        <div className="flex-1">
                                            <span className="font-bold block">Juice by MCB / Bank Transfer</span>
                                            {paymentMethod === 'juice' && (
                                                <div className="text-sm text-gray-600 mt-2 bg-white p-3 border rounded shadow-sm">
                                                    <p className="font-bold">OKASINA Trading Co. Ltd</p>
                                                    <p>BRN: C12112347</p>
                                                    <p>MCB Account: <strong>000020126824</strong></p>
                                                    <p className="text-xs text-gray-500 mt-1">(Ref: {formData.fullName})</p>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </section>

                            <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 font-bold hover:bg-gray-800 disabled:opacity-50">
                                {loading ? 'Processing...' : `Place Order (Rs ${total.toLocaleString()})`}
                            </button>
                        </form>
                    </div>

                    {/* Right: Summary */}
                    <div className="bg-gray-50 p-8 h-fit sticky top-24 rounded-lg">
                        <h2 className="text-lg font-bold uppercase tracking-widest mb-6">Order Summary</h2>
                        <div className="max-h-60 overflow-y-auto mb-6 space-y-4 pr-2">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <img src={item.image_url || item.image} alt={item.name} className="w-16 h-20 object-cover bg-white" />
                                    <div>
                                        <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        <p className="font-bold text-sm">Rs {((item.price_mur || item.price) * item.quantity).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Loyalty Redemption */}
                        {user && loyaltyProfile && loyaltyProfile.points_balance > 0 && (
                            <div className="mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Gift size={18} className="text-yellow-600" />
                                    <h3 className="font-bold text-yellow-800">Use Loyalty Points</h3>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-3">
                                    <span>Available Balance:</span>
                                    <span className="font-bold">{loyaltyProfile.points_balance} pts</span>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={redeemPoints}
                                        onChange={(e) => setRedeemPoints(e.target.checked)}
                                        className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                                    />
                                    <span className="font-medium">Redeem for Rs {Math.min(maxDiscount, subtotal).toLocaleString()} off</span>
                                </label>
                            </div>
                        )}

                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>Rs {subtotal.toLocaleString()}</span></div>
                            <div className="flex justify-between text-gray-600"><span>Shipping</span><span>Rs {shippingCost}</span></div>
                            {redeemPoints && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Loyalty Discount</span>
                                    <span>- Rs {appliedDiscount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold pt-4 border-t mt-4">
                                <span>Total</span>
                                <span>Rs {total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div >
            </div >
        </div >
    );
}
