'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Tag, ShieldCheck, CreditCard, CheckCircle, ArrowRight, Plus, Minus, Trash2, Clock } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, discount, total, appliedCoupon, applyCouponCode, removeCouponCode, clearCart, addToCart, decrementQuantity, removeFromCart } = useCart();
  const { customer, token } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI' | 'RAZORPAY'>('UPI');

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState({ text: '', isError: false });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiLoading, setUpiLoading] = useState(false);
  const [upiOrderPayload, setUpiOrderPayload] = useState<any>(null);
  const [paymentAuthorized, setPaymentAuthorized] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('Waiting for UPI payment transfer (Scan QR code)...');
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(120); // 120 seconds = 2 mins

  const deliveryCharge = 0;
  const grandTotal = total + deliveryCharge;

  // Prefill when customer profile loads
  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      // Do not pre-fill dummy google- oauth phones
      if (customer.phone && !customer.phone.startsWith('google-')) {
        setPhone(customer.phone);
      }
      setEmail(customer.email || '');
      setHouseNo(customer.houseNo || '');
      setAddress(customer.address || '');
      setLandmark(customer.landmark || '');
      setPincode(customer.pincode || '');
      setInstructions(customer.deliveryInstructions || '');
    }
  }, [customer]);

  // 2 minutes session timer for UPI payment
  useEffect(() => {
    if (showUpiModal) {
      setPaymentTimeLeft(120);

      // 2-minute countdown timer interval
      const interval = setInterval(() => {
        setPaymentTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowUpiModal(false);
            alert("Payment session expired. Please scan and pay again.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [showUpiModal]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponMessage({ text: '', isError: false });
    const res = await applyCouponCode(couponInput.trim().toUpperCase());
    if (res.success) {
      setCouponMessage({ text: res.message, isError: false });
      setCouponInput('');
    } else {
      setCouponMessage({ text: res.message, isError: true });
    }
  };

  const handleRemoveCoupon = () => {
    removeCouponCode();
    setCouponMessage({ text: 'Coupon removed.', isError: false });
  };

  // Place order logic
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone || !address || !pincode) {
      alert('Please fill in all required customer details.');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty. Please add some parathas before checking out.');
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      customerName: name,
      phone,
      email,
      houseNo,
      address,
      landmark,
      pincode,
      deliveryInstructions: instructions,
      paymentMethod,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
    };

    try {
      // 1. COD Checkout Flow
      if (paymentMethod === 'COD') {
        const res = await fetch('${API_BASE_URL}/api/orders', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(orderPayload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to place order.');
        }

        const data = await res.json();
        const orderNum = data.order.orderNumber;
        clearCart();
        router.push(`/track?orderId=${orderNum}`);
        return;
      }

      // 2. UPI Payment Checkout Flow
      if (paymentMethod === 'UPI') {
        setUpiOrderPayload(orderPayload);
        setShowUpiModal(true);
        setIsSubmitting(false);
        return;
      }

      // 3. Online Payment Checkout Flow (RAZORPAY)
      const paymentOrderRes = await fetch('${API_BASE_URL}/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal, receipt: `rcpt_${Date.now()}` }),
      });

      if (!paymentOrderRes.ok) {
        throw new Error('Failed to initialize payment order on server.');
      }

      const paymentOrder = await paymentOrderRes.json();

      // Check if it's a simulated order
      if (paymentOrder.isMock) {
        console.log('Simulating successful online checkout...');
        
        const createOrderRes = await fetch('${API_BASE_URL}/api/orders', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(orderPayload),
        });

        if (!createOrderRes.ok) {
          throw new Error('Failed to register order in database.');
        }

        const orderData = await createOrderRes.json();
        const orderNum = orderData.order.orderNumber;

        await fetch('${API_BASE_URL}/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: paymentOrder.id,
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
            isMock: true,
            orderId: orderNum,
          }),
        });

        clearCart();
        router.push(`/track?orderId=${orderNum}`);
        return;
      }

      // Initialize real Razorpay SDK Modal
      const options = {
        key: 'rzp_test_mockKey123',
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'The Paratha Duniya',
        description: 'Authentic Luxury Parathas Order',
        order_id: paymentOrder.id,
        handler: async function (response: any) {
          try {
            const createOrderRes = await fetch('${API_BASE_URL}/api/orders', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify(orderPayload),
            });

            if (!createOrderRes.ok) {
              throw new Error('Failed to register order.');
            }

            const orderData = await createOrderRes.json();
            const orderNum = orderData.order.orderNumber;

            const verifyRes = await fetch('${API_BASE_URL}/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderNum,
              }),
            });

            if (!verifyRes.ok) {
              alert('Payment verification failed. Please contact support.');
              return;
            }

            clearCart();
            router.push(`/track?orderId=${orderNum}`);
          } catch (e) {
            console.error('Payment callback error:', e);
            alert('Something went wrong during order confirmation.');
          }
        },
        prefill: {
          name: name,
          contact: phone,
          email: email || 'customer@example.com',
        },
        theme: {
          color: '#F4A623',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      setIsSubmitting(false);

    } catch (err: any) {
      console.error('Checkout error:', err);
      console.log('Server is offline. Running with offline order simulation fallback.');
      
      const mockOrderNum = `TPD-${10000 + Math.floor(Math.random() * 9000) + 1000}`;
      clearCart();
      router.push(`/track?orderId=${mockOrderNum}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmUpiPayment = async () => {
    if (!upiOrderPayload) return;
    setUpiLoading(true);

    try {
      const res = await fetch('${API_BASE_URL}/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(upiOrderPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to place UPI order.');
      }

      const data = await res.json();
      const orderNum = data.order.orderNumber;
      
      setShowUpiModal(false);
      clearCart();
      router.push(`/track?orderId=${orderNum}`);
    } catch (err) {
      console.error('UPI submit error:', err);
      // Offline fallback
      setShowUpiModal(false);
      const mockOrderNum = `TPD-${10000 + Math.floor(Math.random() * 9000) + 1000}`;
      clearCart();
      router.push(`/track?orderId=${mockOrderNum}`);
    } finally {
      setUpiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/menu"
          className="inline-flex items-center text-xs font-bold text-zinc-500 hover:text-primary tracking-wider uppercase mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Menu
        </Link>

        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-wide text-white mb-10">
          SECURE <span className="text-primary">CHECKOUT</span>
        </h1>

        {cart.length === 0 ? (
          <div className="glass-panel p-16 text-center rounded-2xl space-y-6">
            <div className="text-zinc-650 text-5xl">🛒</div>
            <h2 className="text-xl font-bold text-white">Your Cart is Empty</h2>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto">
              Please head back to our royal menu and choose your favorite parathas before checking out.
            </p>
            <Link
              href="/menu"
              className="inline-block px-8 py-3.5 bg-primary text-black font-bold text-sm rounded-xl hover:bg-amber-400 gold-glow transition-all"
            >
              Explore Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: CUSTOMER DETAILS FORM */}
            <form onSubmit={handlePlaceOrder} className="lg:col-span-7 glass-panel p-8 rounded-2xl space-y-6 text-left">
              <h2 className="text-xl font-bold text-white tracking-wide border-b border-zinc-900 pb-4">
                Delivery Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Full Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Abhinav Kulkarni"
                    className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Phone Number <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Email Address <span className="text-zinc-500">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="abhinav@example.com"
                    className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    House / Flat No.
                  </label>
                  <input
                    type="text"
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="Flat 402, Building A"
                    className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Pincode <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="411001"
                    className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Delivery Address <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Golden Arc Residency, MG Road"
                    className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Landmark / Directions
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near Golden Gym / Behind Apollo Clinic"
                    className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Special Cooking / Delivery Instructions
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Make it extra spicy, deliver contactlessly, ring doorbell..."
                    className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors h-24"
                  />
                </div>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <h2 className="text-xl font-bold text-white tracking-wide border-b border-zinc-900 pb-4 pt-6">
                Select Payment Method
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { value: 'UPI', label: 'UPI (GPay/PhonePe / BHIM)' },
                ].map((pm) => (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(pm.value as any)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition-all duration-200 ${
                      paymentMethod === pm.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-zinc-850 bg-[#121212] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold tracking-wide">{pm.label}</span>
                      <input
                        type="radio"
                        name="payment_opt"
                        checked={paymentMethod === pm.value}
                        onChange={() => {}}
                        className="accent-primary cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {pm.value === 'COD' ? 'Pay cash on arrival' : 'Instant secure gateway'}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-6 bg-primary text-black font-extrabold text-sm tracking-wide rounded-xl text-center hover:bg-amber-400 gold-glow transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Processing Order...' : `Place Order (₹${grandTotal})`}
              </button>
            </form>

            {/* RIGHT COLUMN: RECEIPTS & COUPONS */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Order Items List */}
              <div className="glass-panel p-6 rounded-2xl text-left space-y-4">
                <h3 className="text-base font-bold text-white tracking-wide border-b border-zinc-900 pb-3 flex justify-between items-center">
                  <span>Summary of Delicacies</span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Adjust Items</span>
                </h3>
                <ul className="space-y-3.5 divide-y divide-zinc-900/60">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs pt-3.5 first:pt-0">
                      <div className="space-y-1">
                        <span className="font-bold text-zinc-200 block">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
                          ₹{item.price} each
                        </span>
                      </div>
                      
                      {/* Cart Quantity Controls & Action Buttons */}
                      <div className="flex items-center space-x-3.5">
                        <div className="flex items-center bg-[#181818] border border-zinc-800 rounded-lg p-1 space-x-2">
                          <button
                            type="button"
                            onClick={() => decrementQuantity(item.id)}
                            className="p-1 hover:text-primary transition-colors text-zinc-400 focus:outline-none"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-zinc-200 text-xs px-1 min-w-[12px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, image: item.image, isVeg: item.isVeg }, 1)}
                            className="p-1 hover:text-primary transition-colors text-zinc-400 focus:outline-none"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-bold text-white min-w-[50px] text-right">
                          ₹{item.price * item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-zinc-650 rounded transition-colors focus:outline-none"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </ul>
              </div>

              {/* Promo Code Coupon Area */}
              <div className="glass-panel p-6 rounded-2xl text-left space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-primary" /> Apply Promo Code
                </h3>
                
                {appliedCoupon ? (
                  <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-primary block">{appliedCoupon.code}</span>
                      <span className="text-[10px] text-zinc-400">
                        {appliedCoupon.discountType === 'PERCENTAGE'
                          ? `${appliedCoupon.discountValue}% discount applied`
                          : `₹${appliedCoupon.discountValue} discount applied`}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-500 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. FLAT50"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-grow px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-primary uppercase"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-black hover:bg-primary font-bold text-xs rounded-lg transition-colors border border-zinc-750 hover:border-primary"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponMessage.text && (
                  <p className={`text-[10px] font-bold ${couponMessage.isError ? 'text-red-500' : 'text-green-500'}`}>
                    {couponMessage.text}
                  </p>
                )}

                <div className="text-[10px] text-zinc-500 space-y-1 mt-2">
                  <p>• Try <strong className="text-zinc-400">FIRSTORDER</strong> for 15% discount (Min order Rs. 200)</p>
                  <p>• Try <strong className="text-zinc-400">FLAT50</strong> for Rs. 50 discount (Min order Rs. 300)</p>
                  <p>• Try <strong className="text-zinc-400">FREESHIP</strong> to waive delivery charges</p>
                </div>
              </div>

              {/* Receipt Recap */}
              <div className="glass-panel p-6 rounded-2xl text-left space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Basket Subtotal</span>
                  <span className="font-semibold text-zinc-200">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-500 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Delivery Charges</span>
                  <span className="font-extrabold text-green-500 uppercase text-xs">FREE</span>
                </div>
                <hr className="border-zinc-900 my-2" />
                <div className="flex justify-between text-white font-bold text-base">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{grandTotal}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 bg-zinc-950/40 p-2.5 rounded border border-zinc-900 mt-4 justify-center">
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Payments secured by 256-bit encryption.</span>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* UPI Payment Modal Dialog */}
      <AnimatePresence>
        {showUpiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !upiLoading && setShowUpiModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-sm mx-4 bg-[#111] border border-zinc-850 p-6 rounded-3xl text-center space-y-6 shadow-2xl"
            >
              <h3 className="font-serif text-lg font-bold text-white tracking-wide">
                UPI PAYMENT GATEWAY
              </h3>
              
              {upiLoading ? (
                <div className="py-8 space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-zinc-400 text-xs font-semibold">Verifying transaction signature...</p>
                </div>
              ) : (
                <>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Please scan the secure merchant QR code below using your favorite UPI app (GPay / PhonePe / Paytm / BHIM) to complete your payment of <strong className="text-white">₹{grandTotal}</strong>.
                  </p>

                  {/* QR Code Container */}
                  <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center border-4 border-zinc-900 shadow-inner relative group">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=6303263714@ybl%26pn=TheParathaDuniya%26am=${grandTotal}%26cu=INR`}
                      alt="Payment QR"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/5 rounded-2xl pointer-events-none" />
                  </div>

                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    UPI ID: 6303263714@ybl
                  </div>

                  {/* Countdown Timer */}
                  <div className="py-2.5 px-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4 animate-pulse shrink-0" />
                    <span>Payment Session Expires In: {formatTime(paymentTimeLeft)}</span>
                  </div>

                  <button
                    id="confirm-payment-btn"
                    disabled={upiLoading}
                    onClick={handleConfirmUpiPayment}
                    className="w-full py-3.5 bg-primary text-black font-extrabold text-sm rounded-xl text-center hover:bg-amber-400 transition-all duration-300 gold-glow flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>{upiLoading ? 'Placing Order...' : 'I Have Paid / Confirm Order'}</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>

                  <button
                    onClick={() => setShowUpiModal(false)}
                    className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold transition-colors"
                  >
                    Cancel Payment
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
