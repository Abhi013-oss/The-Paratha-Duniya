'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ShoppingBag, MessageSquare, PhoneCall, AlertTriangle, Clock } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const method = searchParams.get('method') || 'COD';
  const simulated = searchParams.get('simulated') === 'true';

  // Details if simulated offline
  const simName = searchParams.get('name') || 'Valued Customer';
  const simPhone = searchParams.get('phone') || '';
  const simAddress = searchParams.get('address') || '';
  const simTotal = searchParams.get('total') || '0';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!simulated);
  const [error, setError] = useState('');

  // Fetch real order details if not simulated
  useEffect(() => {
    if (simulated || !orderId) return;

    const fetchOrderDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/track/${orderId}`);
        if (!res.ok) {
          throw new Error('Failed to load order from database.');
        }
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Connected to mock details due to server offline status.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, simulated]);

  // Construct WhatsApp Redirect Message
  const handleWhatsAppRedirect = () => {
    let customerName = simName;
    let customerPhone = simPhone;
    let customerAddress = simAddress;
    let orderTotal = simTotal;
    let itemsText = '- Assorted Premium Parathas (Fresh Choice)';
    let notes = 'N/A';

    if (order) {
      customerName = order.customer.name;
      customerPhone = order.customer.phone;
      customerAddress = `${order.customer.houseNo ? order.customer.houseNo + ', ' : ''}${order.customer.address}, ${order.customer.landmark ? order.customer.landmark + ', ' : ''}${order.customer.pincode}`;
      orderTotal = order.total;
      notes = order.specialInstructions || 'N/A';
      itemsText = order.items
        .map((it: any) => `- ${it.product.name} (x${it.quantity}) - ₹${it.price * it.quantity}`)
        .join('\n');
    }

    const message = `Hello The Paratha Duniya,

New Order placed!
*Order ID:* ${orderId}

*Customer Details:*
*Name:* ${customerName}
*Phone:* ${customerPhone}
*Delivery Address:* ${customerAddress}

*Items Ordered:*
${itemsText}

*Total Amount:* ₹${orderTotal}
*Payment Method:* ${method}
*Special Instructions:* ${notes}

Please confirm my order. Thank you for ordering!`;

    const encodedText = encodeURIComponent(message);
    const whatsappNumber = '919492760128'; // Configurable restaurant owner number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedText}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
  };

  // Trigger WhatsApp automatically on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      handleWhatsAppRedirect();
    }, 1500);
    return () => clearTimeout(timer);
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#0A0A0A]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm font-semibold">Generating Your Royal Invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-[#0A0A0A] py-16 flex items-center">
      <div className="max-w-xl mx-auto px-4 w-full">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl text-center space-y-8 relative overflow-hidden">
          
          {/* Confetti Glow behind icon */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-green-500/10 rounded-full blur-2xl" />

          {/* Success Icon */}
          <div className="relative w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.15)]">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-3xl font-extrabold tracking-wide text-white">
              Order Successful!
            </h1>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
              Your order has been sent to the royal kitchens of The Paratha Duniya. Sizzling hot flatbreads will arrive shortly.
            </p>
          </div>

          {/* Order Meta Box */}
          <div className="bg-[#121212] border border-zinc-850 p-6 rounded-2xl text-left space-y-4 max-w-sm mx-auto text-xs sm:text-sm">
            <div className="flex justify-between border-b border-zinc-900 pb-3">
              <span className="text-zinc-500 font-bold uppercase tracking-wider">Order ID</span>
              <strong className="text-white font-extrabold tracking-wider">{orderId}</strong>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-3">
              <span className="text-zinc-500 font-bold uppercase tracking-wider">Est. Delivery</span>
              <strong className="text-primary font-bold">30 - 45 Mins</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-bold uppercase tracking-wider">Payment Mode</span>
              <span className="text-zinc-300 font-semibold">{method}</span>
            </div>
          </div>

          {simulated && (
            <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/25 p-3.5 rounded-xl max-w-sm mx-auto text-left">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-500 font-medium">
                <strong>Simulated Order Flow:</strong> The database API is offline, using mock parameters. End-to-end routing is functional!
              </p>
            </div>
          )}

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href={`/track?orderId=${orderId}`}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-primary text-black font-extrabold rounded-xl text-sm transition-all duration-300 shadow-lg gold-glow"
            >
              <Clock className="w-4 h-4" />
              <span>Track Your Order</span>
            </Link>
            <button
              onClick={handleWhatsAppRedirect}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-green-500/10"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Kitchen</span>
            </button>
            <Link
              href="/menu"
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-sm border border-zinc-800 hover:border-zinc-700 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Menu</span>
            </Link>
          </div>

          <div className="text-[10px] text-zinc-500">
            A WhatsApp chat will automatically open with the kitchen to process your order.
          </div>

        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center bg-[#0A0A0A]">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-zinc-400 text-sm font-semibold">Loading Invoice details...</p>
          </div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
