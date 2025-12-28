import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShoppingCart, Package, CreditCard, RefreshCw, AlertTriangle, Scale, Mail, Phone, MapPin } from 'lucide-react';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Scale className="text-white" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-gray-900">Terms of Service</h1>
                            <p className="text-gray-600 mt-1">Last Updated: November 22, 2025</p>
                        </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                        Welcome to OKASINA Trading. These Terms of Service ("Terms") govern your use of our website and the purchase of products
                        from our online store. By accessing our website or making a purchase, you agree to be bound by these Terms.
                    </p>
                </div>

                {/* Company Information */}
                <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">About OKASINA Trading</h2>
                    <div className="space-y-3 text-gray-700">
                        <p><strong>Business Name:</strong> OKASINA Trading Co. Ltd</p>
                        <p><strong>BRN:</strong> C12112347</p>
                        <p><strong>Business Type:</strong> Women's & Children's Fashion Retailer</p>
                        <div className="flex items-start gap-3 mt-4">
                            <MapPin className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <p className="font-medium">Physical Store Address:</p>
                                <p>Morrisson Street, Souillac (near Souillac Hospital)</p>
                                <p>Savanne District, Mauritius 60810</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <p className="font-medium">Contact Number:</p>
                                <p>+230 5755 6565</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <p className="font-medium">Email:</p>
                                <p>info@okasinatrading.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legal Framework */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8 border border-purple-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="text-purple-600" size={20} />
                        Legal Framework
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                        These Terms comply with the <strong>Consumer Protection Act 2018</strong>, <strong>Electronic Transactions Act 2000</strong>,
                        and other applicable laws of Mauritius. All transactions are governed by Mauritian law, and disputes shall be subject to
                        the exclusive jurisdiction of the courts of Mauritius.
                    </p>
                </div>

                {/* Main Content Sections */}
                <div className="space-y-8">
                    {/* Section 1 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">1</span>
                            </div>
                            Acceptance of Terms
                        </h2>

                        <p className="text-gray-700 mb-4">
                            By accessing and using the OKASINA Trading website or making a purchase, you acknowledge that you have read,
                            understood, and agree to be bound by these Terms of Service and our Privacy Policy.
                        </p>

                        <p className="text-gray-700">
                            If you do not agree with any part of these Terms, you must not use our website or services.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">2</span>
                            </div>
                            Product Information and Availability
                        </h2>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2.1 Product Descriptions</h3>
                        <p className="text-gray-700 mb-4">
                            We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions,
                            colors, or other content are accurate, complete, or error-free. Colors may vary slightly due to screen settings.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2.2 Stock Availability</h3>
                        <p className="text-gray-700 mb-4">
                            All products are subject to availability. We update our inventory in real-time, but occasionally items may be out of stock.
                            If an item you ordered is unavailable, we will notify you promptly and offer a refund or alternative product.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2.3 Product Categories</h3>
                        <p className="text-gray-700">
                            OKASINA Trading specializes in women's and children's fashion wear, including:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
                            <li>Sarees (Indian, Pakistani, Turkish designs)</li>
                            <li>Suits and Salwar Kameez</li>
                            <li>Kurtis (long and short)</li>
                            <li>Lehengas and Shararas</li>
                            <li>Abayas and ethnic wear</li>
                            <li>Casual dresses and sets</li>
                            <li>Children's clothing</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">3</span>
                            </div>
                            Pricing and Payment
                        </h2>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3.1 Pricing</h3>
                        <div className="space-y-3 text-gray-700">
                            <p className="flex gap-2">
                                <span className="text-purple-600">•</span>
                                <span>All prices are displayed in <strong>Mauritian Rupees (MUR)</strong> unless otherwise stated</span>
                            </p>
                            <p className="flex gap-2">
                                <span className="text-purple-600">•</span>
                                <span>Prices include <strong>Value Added Tax (VAT)</strong> where applicable</span>
                            </p>
                            <p className="flex gap-2">
                                <span className="text-purple-600">•</span>
                                <span>Shipping and handling fees are calculated at checkout and added to the total</span>
                            </p>
                            <p className="flex gap-2">
                                <span className="text-purple-600">•</span>
                                <span>We reserve the right to change prices at any time, but changes will not affect orders already placed</span>
                            </p>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3.2 Payment Methods</h3>
                        <p className="text-gray-700 mb-3">We accept the following payment methods:</p>
                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                                <CreditCard className="text-purple-600" size={24} />
                                <span className="text-gray-700">Credit/Debit Cards (Visa, Mastercard)</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                                <ShoppingCart className="text-purple-600" size={24} />
                                <span className="text-gray-700">Mobile Payment (MCB Juice, my.t money)</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                                <Package className="text-purple-600" size={24} />
                                <span className="text-gray-700">Cash on Delivery (Mauritius only)</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                                <CreditCard className="text-purple-600" size={24} />
                                <span className="text-gray-700">Bank Transfer</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3.3 Payment Security</h3>
                        <p className="text-gray-700">
                            All online payments are processed through secure, encrypted payment gateways. We do not store your complete credit card
                            information on our servers. Your payment information is protected in accordance with PCI DSS standards.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">4</span>
                            </div>
                            Orders and Confirmation
                        </h2>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4.1 Order Process</h3>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                            <li>Add items to your shopping cart</li>
                            <li>Proceed to checkout and provide delivery information</li>
                            <li>Review your order and select payment method</li>
                            <li>Complete payment</li>
                            <li>Receive order confirmation via email</li>
                        </ol>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4.2 Order Confirmation</h3>
                        <p className="text-gray-700 mb-4">
                            Once your order is placed, you will receive an email confirmation with your order details and a unique order number.
                            This email does not constitute acceptance of your order. We reserve the right to refuse or cancel any order for any reason.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4.3 Order Acceptance</h3>
                        <p className="text-gray-700">
                            A contract between you and OKASINA Trading is formed only when we dispatch your order and send you a shipping confirmation email.
                            We may refuse or cancel orders due to product unavailability, pricing errors, suspected fraud, or other legitimate reasons.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">5</span>
                            </div>
                            Shipping and Delivery
                        </h2>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5.1 Delivery Areas</h3>
                        <div className="space-y-3 text-gray-700">
                            <p className="flex gap-2">
                                <span className="text-purple-600">•</span>
                                <span><strong>Mauritius:</strong> We deliver to all regions of Mauritius</span>
                            </p>
                            <p className="flex gap-2">
                                <span className="text-purple-600">•</span>
                                <span><strong>International:</strong> International shipping available on request (contact us for rates)</span>
                            </p>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5.2 Delivery Times</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-gray-700">
                            <p><strong>Souillac and surrounding areas:</strong> 1-2 business days</p>
                            <p><strong>Other Mauritius regions:</strong> 2-5 business days</p>
                            <p><strong>International orders:</strong> 7-21 business days (depending on destination)</p>
                        </div>
                        <p className="text-gray-700 mt-3 text-sm">
                            *Delivery times are estimates and may vary due to unforeseen circumstances, public holidays, or force majeure events.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5.3 Shipping Costs</h3>
                        <p className="text-gray-700 mb-3">Shipping costs are calculated based on:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                            <li>Delivery location</li>
                            <li>Order weight and size</li>
                            <li>Shipping method selected</li>
                        </ul>
                        <p className="text-gray-700 mt-3">
                            <strong>Free shipping</strong> is available for orders over MUR 2,500 within Mauritius.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5.4 Delivery Responsibility</h3>
                        <p className="text-gray-700">
                            You are responsible for providing accurate delivery information. We are not liable for delays or non-delivery caused by
                            incorrect addresses. Risk of loss and title for items pass to you upon delivery to the carrier.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">6</span>
                            </div>
                            Returns, Refunds, and Exchanges
                        </h2>

                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6 border border-purple-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <RefreshCw className="text-purple-600" size={20} />
                                Consumer Rights (Consumer Protection Act 2018)
                            </h3>
                            <p className="text-gray-700">
                                Under the Consumer Protection Act 2018 of Mauritius, you have the right to return defective products and receive
                                a refund, exchange, or repair at no additional cost.
                            </p>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6.1 Return Policy</h3>
                        <p className="text-gray-700 mb-3">
                            <strong>Goods once sold cannot be returned.</strong> We offer a strict <strong>48-hour return policy</strong> for exchanges or defective items only.
                        </p>
                        <p className="text-gray-700 mb-3">You may initiate a return within <strong>48 hours</strong> of delivery if:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>The product is defective or damaged upon arrival</li>
                            <li>The product does not match the description</li>
                            <li>You received the wrong item</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6.2 Return Conditions</h3>
                        <p className="text-gray-700 mb-3">To be eligible for a return:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Items must be unworn, unwashed, and in original condition</li>
                            <li>Original tags and packaging must be intact</li>
                            <li>Proof of purchase (receipt or order confirmation) must be provided</li>
                            <li>Items must not be from our final sale or clearance section (unless defective)</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6.3 Non-Returnable Items</h3>
                        <p className="text-gray-700 mb-3">For hygiene and safety reasons, the following items cannot be returned unless defective:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                            <li>Intimate apparel and undergarments</li>
                            <li>Items marked as "Final Sale"</li>
                            <li>Customized or personalized items</li>
                            <li>Items without original tags</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6.4 Refund Process</h3>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                            <li>Contact us at +230 5755 6565 or info@okasinatrading.com to initiate a return</li>
                            <li>We will provide return instructions and authorization</li>
                            <li>Ship the item back to us or return to our Souillac store</li>
                            <li>Once received and inspected, we will process your refund within 7-10 business days</li>
                            <li>Refunds will be issued to the original payment method</li>
                        </ol>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6.5 Exchanges</h3>
                        <p className="text-gray-700">
                            If you wish to exchange an item for a different size or color, please contact us. Exchanges are subject to availability.
                            You may also return the item for a refund and place a new order.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">6.6 Return Shipping Costs</h3>
                        <p className="text-gray-700">
                            If the return is due to our error (defective product, wrong item), we will cover return shipping costs.
                            For other returns, customers are responsible for return shipping fees.
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">7</span>
                            </div>
                            Warranty and Product Quality
                        </h2>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">7.1 Quality Assurance</h3>
                        <p className="text-gray-700 mb-4">
                            We carefully select and inspect all products to ensure they meet our quality standards. All garments are sourced from
                            reputable suppliers specializing in Indian, Pakistani, and Turkish fashion.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">7.2 Warranty</h3>
                        <p className="text-gray-700 mb-4">
                            Products are covered against manufacturing defects for 30 days from the date of purchase. This warranty does not cover:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                            <li>Normal wear and tear</li>
                            <li>Damage from improper care or washing</li>
                            <li>Alterations made by third parties</li>
                            <li>Damage from misuse or accidents</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">7.3 Care Instructions</h3>
                        <p className="text-gray-700">
                            Each product comes with care instructions. Following these instructions is essential to maintain product quality and
                            is a condition of our warranty. Failure to follow care instructions may void the warranty.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">8</span>
                            </div>
                            User Accounts
                        </h2>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.1 Account Creation</h3>
                        <p className="text-gray-700 mb-4">
                            You may create an account to enjoy benefits such as faster checkout, order tracking, and exclusive offers.
                            You are responsible for maintaining the confidentiality of your account credentials.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.2 Account Security</h3>
                        <p className="text-gray-700 mb-4">
                            You must notify us immediately of any unauthorized use of your account. We are not liable for losses arising from
                            unauthorized account access if you have failed to protect your credentials.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.3 Account Termination</h3>
                        <p className="text-gray-700">
                            We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">9</span>
                            </div>
                            Intellectual Property
                        </h2>

                        <p className="text-gray-700 mb-4">
                            All content on this website, including text, images, logos, graphics, and software, is the property of OKASINA Trading
                            or our licensors and is protected by Mauritian and international copyright and trademark laws.
                        </p>

                        <p className="text-gray-700">
                            You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">10</span>
                            </div>
                            Limitation of Liability
                        </h2>

                        <p className="text-gray-700 mb-4">
                            To the fullest extent permitted by law, OKASINA Trading shall not be liable for:
                        </p>

                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Indirect, incidental, special, or consequential damages</li>
                            <li>Loss of profits, revenue, or data</li>
                            <li>Damages arising from website downtime or technical issues</li>
                            <li>Damages caused by third-party services (shipping, payment processors)</li>
                        </ul>

                        <p className="text-gray-700 mt-4">
                            Our total liability for any claim arising from your use of our website or purchase of products shall not exceed
                            the amount you paid for the product in question.
                        </p>
                    </section>

                    {/* Section 11 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">11</span>
                            </div>
                            Force Majeure
                        </h2>

                        <p className="text-gray-700">
                            We shall not be liable for any failure to perform our obligations due to circumstances beyond our reasonable control,
                            including but not limited to natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities,
                            fire, floods, accidents, pandemics, strikes, or shortages of transportation, fuel, energy, labor, or materials.
                        </p>
                    </section>

                    {/* Section 12 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">12</span>
                            </div>
                            Dispute Resolution
                        </h2>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">12.1 Customer Complaints</h3>
                        <p className="text-gray-700 mb-4">
                            If you have a complaint, please contact us first at:
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-gray-700">
                            <p><strong>Email:</strong> info@okasinatrading.com</p>
                            <p><strong>Phone:</strong> +230 5755 6565</p>
                            <p><strong>Address:</strong> Morrisson Street, Souillac, Mauritius 60810</p>
                        </div>
                        <p className="text-gray-700 mt-4">
                            We will make every effort to resolve your complaint within 14 days.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">12.2 Governing Law</h3>
                        <p className="text-gray-700 mb-4">
                            These Terms are governed by the laws of Mauritius. Any disputes arising from these Terms or your use of our website
                            shall be subject to the exclusive jurisdiction of the courts of Mauritius.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">12.3 Consumer Protection</h3>
                        <p className="text-gray-700">
                            Nothing in these Terms affects your statutory rights as a consumer under the Consumer Protection Act 2018 of Mauritius.
                        </p>
                    </section>

                    {/* Section 13 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">13</span>
                            </div>
                            Privacy and Data Protection
                        </h2>

                        <p className="text-gray-700">
                            Your use of our website is also governed by our Privacy Policy, which complies with the Data Protection Act 2017 of Mauritius.
                            Please review our <Link to="/privacy-policy" className="text-purple-600 hover:underline font-medium">Privacy Policy</Link> to
                            understand how we collect, use, and protect your personal information.
                        </p>
                    </section>

                    {/* Section 14 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">14</span>
                            </div>
                            Modifications to Terms
                        </h2>

                        <p className="text-gray-700">
                            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to our website.
                            Your continued use of our website after changes are posted constitutes your acceptance of the modified Terms.
                            We encourage you to review these Terms periodically.
                        </p>
                    </section>

                    {/* Section 15 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">15</span>
                            </div>
                            Severability
                        </h2>

                        <p className="text-gray-700">
                            If any provision of these Terms is found to be invalid or unenforceable by a court of law, such provision shall be
                            severed from these Terms, and the remaining provisions shall continue in full force and effect.
                        </p>
                    </section>

                    {/* Section 16 */}
                    <section className="bg-white rounded-xl shadow-sm p-8">
                        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold">16</span>
                            </div>
                            Entire Agreement
                        </h2>

                        <p className="text-gray-700">
                            These Terms, together with our Privacy Policy, constitute the entire agreement between you and OKASINA Trading regarding
                            your use of our website and supersede all prior agreements and understandings.
                        </p>
                    </section>

                    {/* Contact Section */}
                    <section className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg p-8 text-white">
                        <h2 className="text-2xl font-serif font-bold mb-4">Contact Information</h2>
                        <p className="mb-6">
                            If you have any questions about these Terms of Service, please contact us:
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Mail size={20} />
                                <a href="mailto:info@okasinatrading.com" className="hover:underline">info@okasinatrading.com</a>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={20} />
                                <a href="tel:+2305755656" className="hover:underline">+230 5755 6565</a>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin size={20} className="mt-1 flex-shrink-0" />
                                <div>
                                    <p>OKASINA Trading</p>
                                    <p>Morrisson Street, Souillac (near Souillac Hospital)</p>
                                    <p>Savanne District, Mauritius 60810</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/20">
                            <p className="text-sm">
                                <strong>Business Hours:</strong><br />
                                Monday - Saturday: 9:00 AM - 6:00 PM<br />
                                Sunday: 9:00 AM - 1:00 PM<br />
                                Public Holidays: Closed
                            </p>
                        </div>
                    </section>
                </div>

                {/* Back to Home */}
                <div className="mt-8 text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
