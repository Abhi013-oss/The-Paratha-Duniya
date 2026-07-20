'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ShoppingBag, MessageSquare, AlertTriangle, Printer, FileText } from 'lucide-react';
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

  const handleDownloadInvoice = () => {
    window.print();
  };

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

    const message = `Hello The Paratha Duniya,\n\nNew Order placed!\n*Order ID:* ${orderId}\n\n*Customer Details:*\n*Name:* ${customerName}\n*Phone:* ${customerPhone}\n*Delivery Address:* ${customerAddress}\n\n*Items Ordered:*\n${itemsText}\n\n*Total Amount:* ₹${orderTotal}\n*Payment Method:* ${method}\n*Special Instructions:* ${notes}\n\nPlease confirm my order. Thank you for ordering!`;

    const encodedText = encodeURIComponent(message);
    const whatsappNumber = '919492760128';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
  };



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
    <div className="min-h-[80vh] bg-[#0A0A0A] py-16 flex items-center print:bg-white print:py-0">
      <div className="max-w-xl mx-auto px-4 w-full print:max-w-none print:px-0">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl text-center space-y-8 relative overflow-hidden print:border-none print:shadow-none print:p-0 print:text-black">
          
          {/* Confetti Glow behind icon */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-green-500/10 rounded-full blur-2xl print:hidden" />

          {/* Success Icon */}
          <div className="relative w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.15)] print:hidden">
            <CheckCircle className="w-10 h-10" />
          </div>

          {/* Printable Invoice Header */}
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-extrabold tracking-wide text-white print:text-black">
              Order Successful!
            </h1>
            <p className="text-green-500 text-xs font-bold uppercase tracking-wider print:text-green-700">
              ✓ Payment Received & Order Verified by Kitchen
            </p>
          </div>

          {/* Order Meta Box & Bill */}
          <div className="bg-[#121212] border border-zinc-850 p-6 rounded-2xl text-left space-y-4 max-w-md mx-auto text-xs sm:text-sm print:bg-white print:border-black print:text-black print:max-w-none">
            <div className="flex justify-between border-b border-zinc-850 pb-3 print:border-gray-300">
              <span className="text-zinc-500 font-bold uppercase tracking-wider print:text-gray-600">Order ID</span>
              <strong className="text-white font-extrabold tracking-wider print:text-black">{orderId}</strong>
            </div>
            
            <div className="flex justify-between border-b border-zinc-850 pb-3 print:border-gray-300">
              <span className="text-zinc-500 font-bold uppercase tracking-wider print:text-gray-600">Payment Status</span>
              <strong className="text-green-500 font-bold print:text-green-700">PAID ({method})</strong>
            </div>

            <div className="flex justify-between border-b border-zinc-850 pb-3 print:border-gray-300">
              <span className="text-zinc-500 font-bold uppercase tracking-wider print:text-gray-600">Est. Delivery Time</span>
              <strong className="text-primary font-bold print:text-black">30 - 45 Mins</strong>
            </div>

            {/* Items Breakdown */}
            {order && order.items && order.items.length > 0 && (
              <div className="py-2 space-y-2">
                <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider block print:text-gray-700">Items Ordered:</span>
                {order.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs text-zinc-300 print:text-black">
                    <span>{it.product.name} (x{it.quantity})</span>
                    <span className="font-semibold">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-zinc-850 pt-3 flex justify-between items-center font-bold text-sm text-white print:border-gray-300 print:text-black">
              <span>Total Amount Paid</span>
              <span className="text-primary text-base print:text-black">₹{order ? order.total : simTotal}</span>
            </div>
          </div>

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 print:hidden">
            <button
              onClick={handleDownloadInvoice}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-primary text-black font-extrabold rounded-xl text-sm transition-all duration-300 shadow-lg gold-glow hover:bg-amber-400"
            >
              <Printer className="w-4.5 h-4.5" />
              <span>📄 Download PDF Tax Invoice</span>
            </button>
            
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
              <span>Back to Menu</span>
            </Link>
          </div>

          <div className="text-[10px] text-zinc-500 print:hidden">
            Click Download PDF Tax Invoice above to save or print your official payment receipt.
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
