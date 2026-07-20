'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { User, Shield, MapPin, ClipboardList, ArrowRight, Lock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
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

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, customer, token, updateProfile, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'settings' | 'security' | 'orders'>('settings');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Profile Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [instructions, setInstructions] = useState('');

  // Change Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Status/Feedback States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Listen to tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'orders') {
      setActiveTab('orders');
    } else if (tabParam === 'security') {
      setActiveTab('security');
    } else {
      setActiveTab('settings');
    }
  }, [searchParams]);

  // Prefill profile values when customer object loads
  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone && !customer.phone.startsWith('google-') ? customer.phone : '');
      setEmail(customer.email || '');
      setHouseNo(customer.houseNo || '');
      setAddress(customer.address || '');
      setLandmark(customer.landmark || '');
      setPincode(customer.pincode || '');
      setInstructions(customer.deliveryInstructions || '');
    }
  }, [customer]);

  // Fetch orders when tab is set to orders
  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || !token) return;

    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await fetch('${API_BASE_URL}/api/orders/my-orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        setOrdersLoading(false);
      }
    };

    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, isLoggedIn, token, authLoading]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Please fill in your name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please fill in your contact phone number.');
      return;
    }

    setSubmitting(true);
    const res = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      houseNo: houseNo.trim(),
      address: address.trim(),
      landmark: landmark.trim(),
      pincode: pincode.trim(),
      deliveryInstructions: instructions.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('${API_BASE_URL}/api/customer/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(data.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        setPasswordError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('Server is offline. Unable to connect.');
    } finally {
      setPasswordLoading(false);
    }
  };

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

  if (authLoading) {
    return (
      <div className="min-h-[70vh] bg-[#0A0A0A] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm font-semibold">Loading profile information...</p>
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
            <h1 className="font-serif text-2xl font-bold text-white">Authentication Required</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Please sign in using the profile links in the navigation bar to access your personal profile and settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-left">
          <h1 className="font-serif text-3xl font-extrabold tracking-wide text-white">
            MY <span className="text-primary">PROFILE</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Manage your account settings, addresses, and order roadmap.
          </p>
        </div>

        {/* Profile Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Left Navigation Card */}
          <div className="md:col-span-1 space-y-4">
            <div className="glass-panel p-6 rounded-2xl border border-zinc-850 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                {customer?.name[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-white text-base truncate">{customer?.name}</h3>
                <p className="text-zinc-500 text-xs mt-1 truncate">{customer?.phone}</p>
              </div>
            </div>

            <div className="glass-panel p-2 rounded-2xl border border-zinc-850 flex flex-col space-y-1">
              <button
                onClick={() => {
                  setActiveTab('settings');
                  router.push('/profile?tab=settings');
                }}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-left flex items-center space-x-3 transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-primary text-black'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Account & Delivery</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('security');
                  router.push('/profile?tab=security');
                }}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-left flex items-center space-x-3 transition-colors ${
                  activeTab === 'security'
                    ? 'bg-primary text-black'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Security & Password</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('orders');
                  router.push('/profile?tab=orders');
                }}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-left flex items-center space-x-3 transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-primary text-black'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Order History ({orders.length > 0 ? orders.length : ''})</span>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="md:col-span-3">
            
            {/* Tab 1: Account Settings Form */}
            {activeTab === 'settings' && (
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-850 space-y-6 text-left">
                <div className="border-b border-zinc-900 pb-4">
                  <h2 className="text-lg font-bold text-white tracking-wide">Account & Delivery Settings</h2>
                  <p className="text-zinc-500 text-xs">Configure your primary contact coordinates and default drop addresses.</p>
                </div>

                {/* Notifications */}
                {successMsg && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-xl flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}
                {errorMsg && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Abhinav Kulkarni"
                        className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="abhinav@example.com"
                        className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">House / Flat No.</label>
                      <input
                        type="text"
                        value={houseNo}
                        onChange={(e) => setHouseNo(e.target.value)}
                        placeholder="Flat 402, Building A"
                        className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="411001"
                        className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Delivery Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Golden Arc Residency, MG Road"
                        className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Landmark / Directions</label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="Near Golden Gym / Behind Apollo Clinic"
                        className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Special Instructions</label>
                      <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Make it extra spicy, ring doorbell..."
                        className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors h-20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-3 px-6 bg-primary text-black font-extrabold text-xs rounded-xl hover:bg-amber-400 transition-colors uppercase tracking-wide flex items-center space-x-2"
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Security & Password */}
            {activeTab === 'security' && (
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-850 space-y-6 text-left">
                <div className="border-b border-zinc-900 pb-4">
                  <h2 className="text-lg font-bold text-white tracking-wide">Security Settings</h2>
                  <p className="text-zinc-500 text-xs">Manage your passwords and account access parameters.</p>
                </div>

                {customer?.googleId && customer?.phone?.startsWith('google-') ? (
                  <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl text-center space-y-4">
                    <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white text-sm">Linked with Google Account</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto">
                      Your account authentication is managed securely via Google OAuth. A local password setup is not required.
                    </p>
                    <span className="text-[10px] text-zinc-500 font-mono block">Google ID: {customer.googleId}</span>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                    {passwordSuccess && (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-xl flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}
                    {passwordError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Current Password</label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">New Password</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="py-3 px-6 bg-primary text-black font-extrabold text-xs rounded-xl hover:bg-amber-400 transition-colors uppercase tracking-wide flex items-center space-x-2"
                    >
                      {passwordLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin animate-infinite" />
                      ) : (
                        <span>Update Password</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Tab 2: Orders History */}
            {activeTab === 'orders' && (
              <div className="space-y-6 text-left">
                {ordersLoading ? (
                  <div className="glass-panel p-16 text-center rounded-2xl border border-zinc-850">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400 text-xs">Loading order roadmap history...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="glass-panel p-16 text-center rounded-2xl space-y-4 border border-zinc-850">
                    <span className="text-3xl">🥘</span>
                    <h3 className="text-lg font-bold text-white">No Orders Found</h3>
                    <p className="text-zinc-500 text-xs max-w-xs mx-auto leading-relaxed">
                      You haven't ordered any delicious butterloaded parathas yet!
                    </p>
                    <Link
                      href="/menu"
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-primary hover:underline pt-2"
                    >
                      <span>Browse Menu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => {
                      const status = getStatusDetails(o.status);
                      const orderDate = new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div
                          key={o.id}
                          className="glass-panel p-5 sm:p-6 rounded-2xl border border-zinc-850 hover:border-zinc-800 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2.5">
                              <span className="font-serif text-sm font-extrabold text-white">
                                {o.orderNumber}
                              </span>
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${status.bg}`}>
                                {status.label}
                              </span>
                            </div>
                            <p className="text-zinc-500 text-[10px] font-medium">{orderDate}</p>
                            
                            {/* Items snippet */}
                            <p className="text-zinc-300 text-xs font-semibold">
                              {o.items.map((it) => `${it.quantity}x ${it.product.name}`).join(', ')}
                            </p>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t border-zinc-900 sm:border-0 pt-3 sm:pt-0">
                            <span className="font-serif font-extrabold text-white text-base">
                              ₹{o.total}
                            </span>
                            
                            <Link
                              href={`/track?orderId=${o.orderNumber}`}
                              className="mt-2 text-primary bg-primary/5 hover:bg-primary hover:text-black border border-primary/20 hover:border-transparent transition-all duration-300 py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center space-x-1"
                            >
                              <span>Track Live</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] bg-[#0A0A0A] flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-zinc-400 text-sm font-semibold">Loading profile view...</p>
          </div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
