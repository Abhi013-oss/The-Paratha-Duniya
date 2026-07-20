'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Clock, Receipt, MapPin, Truck, ChevronRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    name: string;
    image: string;
  };
}

interface Order {
  id: number;
  orderNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { isLoggedIn, token, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      setError('Please sign in to view your orders.');
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/orders/my-orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to retrieve your order history.');
        }

        const data = await res.json();
        setOrders(data);
      } catch (err: any) {
        console.error('Fetch orders error:', err);
        setError('Connected to mock server. Running offline mode.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isLoggedIn, token, authLoading]);

  // Helper for status badge styling
  const getStatusDetails = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return { label: 'Placed', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case 'PREPARING':
        return { label: 'Preparing', bg: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse' };
      case 'OUT_FOR_DELIVERY':
        return { label: 'Out for Delivery', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'DELIVERED':
        return { label: 'Delivered', bg: 'bg-green-500/10 text-green-500 border-green-500/20' };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: 'bg-red-500/10 text-red-500 border-red-500/20' };
      default:
        return { label: status, bg: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] bg-[#0A0A0A] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm font-semibold">Retrieving your gourmet logs...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] bg-[#0A0A0A] py-16 flex items-center">
        <div className="max-w-md mx-auto px-4 w-full">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl text-center space-y-6">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 text-primary rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-white">Access Denied</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Please sign in using the profile links in the navigation bar to access your order history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
          <div>
            <h1 className="font-serif text-3xl font-extrabold tracking-wide text-white">
              MY <span className="text-primary">ORDERS</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Review and track all your culinary transactions.
            </p>
          </div>

          <Link
            href="/menu"
            className="inline-flex items-center space-x-2 text-xs font-bold text-primary border-b border-primary/20 hover:border-primary pb-0.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order More Delicacies</span>
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="glass-panel p-16 text-center rounded-2xl space-y-6 border border-zinc-850">
            <div className="w-16 h-16 bg-zinc-900/50 border border-zinc-850 rounded-full flex items-center justify-center mx-auto text-3xl">
              🥘
            </div>
            <h2 className="text-xl font-bold text-white">No Orders Placed Yet</h2>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
              You haven't ordered any delicious stuffed parathas yet. Let's get started on your first feast!
            </p>
            <Link
              href="/menu"
              className="inline-block px-8 py-3.5 bg-primary text-black font-bold text-sm rounded-xl hover:bg-amber-400 gold-glow transition-all"
            >
              Explore Royal Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => {
              const status = getStatusDetails(order.status);
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="glass-panel rounded-2xl overflow-hidden border border-zinc-850 hover:border-zinc-800 transition-all text-left"
                >
                  {/* Top Bar */}
                  <div className="bg-[#121212]/50 border-b border-zinc-900/80 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Order ID</span>
                      <strong className="text-sm font-extrabold text-white tracking-wider">{order.orderNumber}</strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Date */}
                      <span className="text-zinc-400 text-xs flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                        {formattedDate}
                      </span>
                      
                      {/* Status */}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${status.bg}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Items List */}
                    <div className="md:col-span-8 space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 text-xs">
                          {/* Image preview */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                            <img
                              src={item.product.image || '/images/default_paratha.jpg'}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-zinc-200 block">
                              {item.product.name} <span className="text-zinc-500">x{item.quantity}</span>
                            </span>
                            <span className="text-[10px] text-zinc-500">₹{item.price} each</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order summary totals & track action */}
                    <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-zinc-900 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between h-full space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Amount</span>
                        <strong className="text-lg font-black text-primary">₹{order.total}</strong>
                        <span className="text-[10px] text-zinc-400 block font-medium">
                          Paid via {order.paymentMethod}
                        </span>
                      </div>

                      <button
                        onClick={() => router.push(`/track?orderId=${order.orderNumber}`)}
                        className="w-full py-2.5 bg-zinc-900 hover:bg-primary border border-zinc-800 hover:border-primary text-primary hover:text-black font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all duration-300"
                      >
                        <span>Track Order</span>
                        <ChevronRight className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
