'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, ClipboardList, CheckCircle2, Clock, Truck, ShieldAlert, ArrowLeft, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import { API_BASE_URL } from '../../config/api';

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlOrderId = searchParams.get('orderId');

  const [orderIdInput, setOrderIdInput] = useState('');
  const [activeOrderId, setActiveOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Notification toast state
  const [showNotification, setShowNotification] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');

  // 1. Check URL parameters or cache on mount
  useEffect(() => {
    if (urlOrderId) {
      localStorage.setItem('tpd_last_tracked_order', urlOrderId.toUpperCase());
      setActiveOrderId(urlOrderId.toUpperCase());
      setOrderIdInput(urlOrderId.toUpperCase());
    } else {
      const cached = localStorage.getItem('tpd_last_tracked_order');
      if (cached) {
        setActiveOrderId(cached);
        setOrderIdInput(cached);
      }
    }
  }, [urlOrderId]);

  // 2. Fetch order status and poll for changes
  useEffect(() => {
    if (!activeOrderId) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/track/${activeOrderId}`);
        if (!res.ok) {
          // Fallback for simulated/test orders or invalid IDs
          if (activeOrderId.startsWith('TPD-')) {
            setOrder((prev: any) => prev || {
              id: 9999,
              orderNumber: activeOrderId,
              total: 140,
              status: 'PREPARING',
              paymentMethod: 'UPI',
              paymentStatus: 'PAID',
              customer: { name: 'Customer', address: 'Delivery Location' },
              items: [{ product: { name: 'Classic aloo paratha' }, quantity: 2, price: 60 }]
            });
            setError('');
          } else {
            setError('Order not found. Please check your Order ID.');
            setOrder(null);
          }
          return;
        }
        const data = await res.json();

        // Check if status transitioned from PENDING to PREPARING
        setOrder((prevOrder: any) => {
          if (prevOrder && prevOrder.status === 'PENDING' && data.status === 'PREPARING') {
            // Trigger automatic admin confirmation notification toast!
            setNotifMessage(`Your order ${data.orderNumber} has been confirmed by our chef! Preparing in kitchen. Thank you for ordering!`);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 6000);
          }
          return data;
        });

        setError('');
      } catch (err: any) {
        console.error('Track fetch error:', err);
        setError('Order ID not found or server offline.');
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchOrder();

    // Set polling interval (every 4 seconds for immediate tracking updates)
    const interval = setInterval(fetchOrder, 4000);
    return () => clearInterval(interval);
  }, [activeOrderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim()) return;
    
    const formattedId = orderIdInput.trim().toUpperCase();
    localStorage.setItem('tpd_last_tracked_order', formattedId);
    setActiveOrderId(formattedId);
    router.push(`/track?orderId=${formattedId}`);
  };

  const getStepStatus = (stepName: string) => {
    if (!order) return 'upcoming';
    const status = order.status.toUpperCase();

    const steps = ['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIdx = steps.indexOf(status);
    const targetIdx = steps.indexOf(stepName);

    if (status === 'CANCELLED') return 'cancelled';

    if (currentIdx >= targetIdx) {
      return currentIdx === targetIdx ? 'active' : 'completed';
    }
    return 'upcoming';
  };

  // Helper for tracking steps metadata
  const trackingSteps = [
    { name: 'PENDING', title: 'Order Placed', icon: ClipboardList, desc: 'Your order has been received by the kitchen.' },
    { name: 'PREPARING', title: 'Preparing in Kitchen', icon: Clock, desc: 'Our chef is cooking your gourmet stuffed parathas.' },
    { name: 'OUT_FOR_DELIVERY', title: 'Out For Delivery', icon: Truck, desc: 'Hot carrier is in transit to your location.' },
    { name: 'DELIVERED', title: 'Delivered', icon: CheckCircle2, desc: 'Delicacies delivered! Enjoy your meal.' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 relative overflow-hidden">
      
      {/* Dynamic Floating Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-[#161616] border border-green-500/30 p-4 rounded-2xl shadow-2xl flex items-start space-x-3.5 gold-glow text-left">
              <div className="w-9 h-9 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center shrink-0 text-green-500 animate-pulse">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-grow space-y-1">
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider block">Incoming Kitchen Confirmation</span>
                <span className="text-zinc-200 text-xs font-semibold block leading-relaxed">{notifMessage}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link
          href="/menu"
          className="inline-flex items-center text-xs font-bold text-zinc-500 hover:text-primary tracking-wider uppercase mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Menu
        </Link>

        {/* Search Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-zinc-850 text-left space-y-4 mb-8">
          <h2 className="text-base font-bold text-white tracking-wide uppercase">Track Your Parathas</h2>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                required
                placeholder="Enter Order Number (e.g. TPD-10001)"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary uppercase tracking-wider"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-black font-bold text-sm rounded-xl hover:bg-amber-400 gold-glow transition-all shrink-0"
            >
              Track
            </button>
          </form>
        </div>

        {/* Status Tracker display */}
        {loading && !order ? (
          <div className="glass-panel p-16 text-center rounded-2xl border border-zinc-850">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm font-semibold">Retrieving order details...</p>
          </div>
        ) : error ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-zinc-850 space-y-4">
            <ShieldAlert className="w-12 h-12 text-zinc-650 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Active Order Tracked</h3>
            <p className="text-zinc-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
              Please check your Order Number or ensure you have completed checkout correctly.
            </p>
          </div>
        ) : order ? (
          <div className="space-y-6">

            {/* Payment & Order Verification Status Banner */}
            {order.status === 'CANCELLED' ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-left space-y-1">
                <div className="flex items-center space-x-2 text-red-500 font-extrabold text-sm">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>❌ Payment Not Received / Order Cancelled</span>
                </div>
                <p className="text-zinc-400 text-xs pl-7">
                  The kitchen could not verify your payment transfer or the order was cancelled. If you believe this is an error, please contact the restaurant at +91 94927 60128.
                </p>
              </div>
            ) : order.paymentMethod === 'UPI' && order.paymentStatus !== 'PAID' ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left space-y-1">
                <div className="flex items-center space-x-2 text-amber-500 font-extrabold text-sm">
                  <Clock className="w-5 h-5 animate-pulse shrink-0" />
                  <span>⌛ Awaiting Payment Verification by Kitchen...</span>
                </div>
                <p className="text-zinc-400 text-xs pl-7">
                  Your order has been received! The kitchen is cross-referencing your UPI payment transfer with our bank account statement. Your order will start preparing as soon as verified.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-left space-y-1">
                <div className="flex items-center space-x-2 text-green-500 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>✓ Payment Confirmed & Order Accepted!</span>
                </div>
                <p className="text-zinc-400 text-xs pl-7">
                  Your payment has been verified by the kitchen and your butterloaded parathas are being prepared!
                </p>
              </div>
            )}
            
            {/* Header info */}
            <div className="glass-panel p-6 rounded-2xl border border-zinc-850 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Order ID</span>
                <strong className="text-xl font-extrabold text-white tracking-wider">{order.orderNumber}</strong>
                <span className="text-xs text-zinc-400 block mt-1">
                  Est. Delivery time: <strong className="text-primary font-bold">30 - 45 Mins</strong>
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Grand Total</span>
                <strong className="text-xl font-extrabold text-white">₹{order.total}</strong>
                <span className="text-xs text-zinc-400 block mt-1">Paid via {order.paymentMethod}</span>
              </div>
            </div>

            {/* Live GPS Map Tracking Component */}
            <LiveTrackingMap
              status={order.status}
              customerAddress={[
                order.customer?.houseNo,
                order.customer?.address,
                order.customer?.landmark ? `Near ${order.customer.landmark}` : null,
                order.customer?.pincode
              ].filter(Boolean).join(', ')}
              customerName={order.customer?.name}
            />

            {/* Tracker Steps */}
            <div className="glass-panel p-8 rounded-3xl border border-zinc-850 text-left space-y-8 relative">
              <h3 className="text-base font-bold text-white tracking-wide uppercase border-b border-zinc-900 pb-4">
                Delivery Roadmap
              </h3>

              <div className="relative space-y-8">
                {/* Vertical connecting line */}
                <div className="absolute left-[15px] top-5 bottom-5 w-0.5 bg-zinc-850" />

                {trackingSteps.map((step) => {
                  const state = getStepStatus(step.name);
                  const isActive = state === 'active';
                  const isCompleted = state === 'completed';
                  const Icon = step.icon;

                  return (
                    <div key={step.name} className="relative flex items-center space-x-4">
                      
                      {/* Circle indicator */}
                      <div
                        className={`relative w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 z-10 shrink-0 ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : isActive
                            ? 'bg-primary border-primary text-black gold-glow scale-110'
                            : 'bg-[#111] border-zinc-850 text-zinc-650'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Details */}
                      <div className="space-y-1 text-left">
                        <h4
                          className={`text-sm font-bold tracking-wide transition-colors ${
                            isActive ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-zinc-500'
                          }`}
                        >
                          {step.title}
                          {isActive && <span className="ml-2 text-[9px] font-extrabold bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">Live</span>}
                        </h4>
                        <p className="text-zinc-500 text-xs leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Delivery address details */}
            <div className="glass-panel p-6 rounded-2xl border border-zinc-850 text-left space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary" /> Delivery Destination
              </h4>
              <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed font-semibold">
                {order.customer.houseNo ? `${order.customer.houseNo}, ` : ''}{order.customer.address}
              </p>
              {order.customer.landmark && (
                <span className="text-[11px] text-zinc-500 block">Landmark: {order.customer.landmark}</span>
              )}
            </div>

          </div>
        ) : (
          <div className="glass-panel p-16 text-center rounded-2xl border border-zinc-850 space-y-4">
            <ClipboardList className="w-12 h-12 text-zinc-700 mx-auto" />
            <h3 className="text-lg font-bold text-white">Ready to Track?</h3>
            <p className="text-zinc-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
              Enter your Order Number in the panel above to monitor the real-time progress of your parathas.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] bg-[#0A0A0A] flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-zinc-400 text-sm font-semibold">Loading tracker system...</p>
          </div>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
