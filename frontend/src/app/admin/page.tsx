'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import { 
  ShieldCheck, LayoutDashboard, ShoppingBag, Plus, Edit, Trash, 
  Users, Ticket, LogOut, Search, RefreshCw, CheckCircle, 
  XCircle, Truck, Clock, IndianRupee, AlertTriangle, Printer, ToggleLeft, ToggleRight,
  MessageSquare, Settings
} from 'lucide-react';

// Hardcoded fallback data for Admin Panel when server is offline (Starts empty per request)
const initialMockOrders: any[] = [];

const initialMockProducts = [
  { id: 186, name: 'Cheese chilli garlic paratha', price: 80, isVeg: true, isBestSeller: true, isActive: true, categoryId: 1, description: 'A mouthwatering fusion of melted cheese, spicy green chillies, and roasted garlic bits.' },
  { id: 2, name: 'Luxury Dry Fruit Paratha', price: 249, isVeg: true, isBestSeller: false, isActive: true, categoryId: 1, description: 'Sweet paratha with dry fruits, saffron and ghee.' },
  { id: 167, name: 'Classic aloo paratha', price: 60, isVeg: true, isBestSeller: true, isActive: true, categoryId: 2, description: 'Generously stuffed with spiced mashed potatoes, green chillies, and fresh coriander.' }
];

const mockCustomers: any[] = [];

const initialMockCoupons = [
  { id: 1, code: 'FIRSTORDER', discountType: 'PERCENTAGE', discountValue: 15, minOrderValue: 200, isActive: true, usesCount: 0 },
  { id: 2, code: 'FLAT50', discountType: 'FIXED', discountValue: 50, minOrderValue: 300, isActive: true, usesCount: 0 },
  { id: 3, code: 'FREESHIP', discountType: 'FIXED', discountValue: 30, minOrderValue: 150, isActive: true, usesCount: 0 }
];

export default function AdminPortal() {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'customers' | 'coupons' | 'messages' | 'settings'>('dashboard');
  const [isSimulated, setIsSimulated] = useState(false);
  const [orders, setOrders] = useState<any[]>(initialMockOrders);
  const [products, setProducts] = useState<any[]>(initialMockProducts);
  const [customers, setCustomers] = useState<any[]>(mockCustomers);
  const [coupons, setCoupons] = useState<any[]>(initialMockCoupons);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Change Credentials state
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // PWA Home Screen Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallHelpModal, setShowInstallHelpModal] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallHelpModal(true);
    }
  };
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Editing structures
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any>(null);
  
  // Product CRUD form state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('1'); // 1 = Signature, 2 = Traditional
  const [newProdVeg, setNewProdVeg] = useState(true);
  const [newProdBest, setNewProdBest] = useState(false);
  const [newProdDesc, setNewProdDesc] = useState('');

  // Coupon Form State
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENTAGE' | 'FIXED'>('FIXED');
  const [newCouponVal, setNewCouponVal] = useState('');
  const [newCouponMin, setNewCouponMin] = useState('0');

  // Check login on load
  useEffect(() => {
    const adminToken = localStorage.getItem('tpd_admin_token');
    if (adminToken) {
      setIsLoggedIn(true);
      fetchRealAdminData();
    } else {
      // For evaluation, let them login or run simulated data directly if requested
      setIsLoggedIn(false);
    }
  }, []);

  const playNewOrderChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio alert playback blocked by browser settings');
    }
  };

  const checkTokenAndFetch = async () => {
    const token = localStorage.getItem('tpd_admin_token');
    if (!token) return;

    try {
      // Verify token
      const verifyRes = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!verifyRes.ok) {
        localStorage.removeItem('tpd_admin_token');
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(true);
      fetchRealAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRealAdminData = async () => {
    const token = localStorage.getItem('tpd_admin_token');

    try {
      const prodRes = await fetch(`${API_BASE_URL}/api/products`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }

      const oRes = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(prev => {
          if (prev.length > 0 && oData.length > prev.length) {
            playNewOrderChime();
          }
          return oData;
        });

        // Auto WhatsApp notification on background delivery transitions
        try {
          const notifiedStr = localStorage.getItem('tpd_delivered_notified') || '[]';
          const notifiedList: string[] = JSON.parse(notifiedStr);
          let updatedList = [...notifiedList];
          let updated = false;

          for (const ord of oData) {
            if (ord.status === 'DELIVERED' && !notifiedList.includes(ord.orderNumber)) {
              updatedList.push(ord.orderNumber);
              updated = true;
              
              // Launch WhatsApp popup window
              handleSendDeliverySuccessWA(ord);
            }
          }

          if (updated) {
            localStorage.setItem('tpd_delivered_notified', JSON.stringify(updatedList));
          }
        } catch (err) {
          console.error('Auto delivery checker failed:', err);
        }
      }

      const custRes = await fetch(`${API_BASE_URL}/api/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData);
      }

      const cRes = await fetch(`${API_BASE_URL}/api/coupons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        setCoupons(cData);
      }

      const msgRes = await fetch(`${API_BASE_URL}/api/contact`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setContactMessages(msgData);
      }

      setIsSimulated(false);
    } catch (e) {
      console.log('Backend connection failed. Operating in offline simulated database mode.');
      setIsSimulated(true);
    }
  };

  const handleDeleteContactMessage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer message?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/contact/${id}`, { method: 'DELETE' });
      setContactMessages(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!emailInput || !passwordInput) {
      setLoginError('Please fill in both fields.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setLoginError(errData.error || 'Invalid credentials.');
        return;
      }

      const data = await res.json();
      localStorage.setItem('tpd_admin_token', data.token);
      setIsLoggedIn(true);
      fetchRealAdminData();
    } catch (err) {
      setLoginError('Could not reach backend API server. Please check your network or server status.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tpd_admin_token');
    setIsLoggedIn(false);
  };

  // Order state update
  const handleUpdateOrderStatus = async (orderId: number, status?: string, paymentStatus?: string) => {
    const token = localStorage.getItem('tpd_admin_token');
    
    const body: any = {};
    if (status !== undefined) body.status = status;
    if (paymentStatus !== undefined) body.paymentStatus = paymentStatus;

    if (paymentStatus === 'PAID' && status === undefined) {
      body.status = 'PREPARING';
    }
    if (status === 'CANCELLED' && paymentStatus === undefined) {
      body.paymentStatus = 'FAILED';
    }

    if (!isSimulated && token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          fetchRealAdminData();
          if (body.status === 'PREPARING') {
            const o = orders.find(ord => ord.id === orderId);
            if (o) {
              handleSendConfirmationWA(o);
            }
          }
          return;
        }
      } catch (err) {
        console.log('Update failed on server. Swapping update to simulation.');
      }
    }

    // Local simulation update
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: status !== undefined ? status : o.status,
          paymentStatus: paymentStatus !== undefined ? paymentStatus : o.paymentStatus
        };
      }
      return o;
    }));
    if (status === 'PREPARING') {
      const o = orders.find(ord => ord.id === orderId);
      if (o) {
        handleSendConfirmationWA(o);
      }
    }
  };

  // Product CRUD operations
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tpd_admin_token');

    const newProd = {
      name: newProdName,
      price: Number(newProdPrice),
      categoryId: Number(newProdCategory),
      isVeg: newProdVeg,
      isBestSeller: newProdBest,
      description: newProdDesc,
      image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&auto=format&fit=crop&q=80'
    };

    if (!isSimulated && token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newProd)
        });
        if (res.ok) {
          fetchRealAdminData();
          setShowAddProductModal(false);
          clearProdForm();
          return;
        }
      } catch (err) {
        console.log('Offline creation.');
      }
    }

    // Simulated CRUD
    setProducts(prev => [...prev, { ...newProd, id: prev.length + 1, isActive: true, category: { name: newProdCategory === '1' ? 'Signature' : 'Traditional', slug: newProdCategory === '1' ? 'signature' : 'traditional' } }]);
    setShowAddProductModal(false);
    clearProdForm();
  };

  const handleDeleteProduct = async (prodId: number) => {
    const token = localStorage.getItem('tpd_admin_token');

    if (!isSimulated && token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${prodId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchRealAdminData();
          return;
        }
      } catch (err) {
        console.log('Offline delete.');
      }
    }

    // Simulated delete
    setProducts(prev => prev.filter(p => p.id !== prodId));
  };

  const handleToggleProductActive = async (prodId: number, currentActive: boolean) => {
    const token = localStorage.getItem('tpd_admin_token');

    if (!isSimulated && token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${prodId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isActive: !currentActive })
        });
        if (res.ok) {
          fetchRealAdminData();
          return;
        }
      } catch (err) {
        console.log('Offline toggle.');
      }
    }

    setProducts(prev => prev.map(p => p.id === prodId ? { ...p, isActive: !p.isActive } : p));
  };

  // Coupon CRUD operations
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tpd_admin_token');
    
    const newCoupon = {
      code: newCouponCode.toUpperCase().trim(),
      discountType: newCouponType,
      discountValue: Number(newCouponVal),
      minOrderValue: Number(newCouponMin)
    };

    if (!isSimulated && token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/coupons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newCoupon)
        });
        if (res.ok) {
          fetchRealAdminData();
          setShowAddCouponModal(false);
          clearCouponForm();
          return;
        }
      } catch (err) {
        console.log('Offline coupon creation.');
      }
    }

    setCoupons(prev => [...prev, { ...newCoupon, id: prev.length + 1, isActive: true, usesCount: 0 }]);
    setShowAddCouponModal(false);
    clearCouponForm();
  };

  const handleDeleteCoupon = async (couponId: number) => {
    const token = localStorage.getItem('tpd_admin_token');

    if (!isSimulated && token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/coupons/${couponId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchRealAdminData();
          return;
        }
      } catch (err) {
        console.log('Offline coupon delete.');
      }
    }

    setCoupons(prev => prev.filter(c => c.id !== couponId));
  };

  const clearProdForm = () => {
    setNewProdName('');
    setNewProdPrice('');
    setNewProdDesc('');
    setNewProdVeg(true);
    setNewProdBest(false);
  };

  const clearCouponForm = () => {
    setNewCouponCode('');
    setNewCouponVal('');
    setNewCouponMin('0');
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    if (!settingsEmail && !settingsPassword) {
      setSettingsError('Please fill in email or password to update.');
      return;
    }

    if (settingsPassword && settingsPassword !== settingsConfirmPassword) {
      setSettingsError('Passwords do not match.');
      return;
    }

    setSettingsLoading(true);
    const token = localStorage.getItem('tpd_admin_token');

    try {
      if (!isSimulated && token) {
        const res = await fetch(`${API_BASE_URL}/api/auth/update-credentials`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: settingsEmail || undefined,
            password: settingsPassword || undefined
          })
        });

        const data = await res.json();

        if (res.ok) {
          setSettingsSuccess('Credentials updated successfully!');
          setSettingsEmail('');
          setSettingsPassword('');
          setSettingsConfirmPassword('');
        } else {
          setSettingsError(data.error || 'Failed to update credentials.');
        }
      } else {
        setSettingsSuccess('Credentials updated successfully (Simulated mode)!');
        setSettingsEmail('');
        setSettingsPassword('');
        setSettingsConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      setSettingsError('Failed to communicate with authentication server.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePrintInvoice = (order: any) => {
    setSelectedOrderForInvoice(order);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleSendConfirmationWA = (o: any) => {
    const message = `Hello ${o.customer.name},

Your order *${o.orderNumber}* at *The Paratha Duniya* has been confirmed! We are preparing your delicious, fresh, butterloaded parathas. It will be delivered hot shortly.

Thank you for ordering!`;
    const encoded = encodeURIComponent(message);
    let rawPhone = String(o.customer.phone).trim();
    if (rawPhone.length === 10) {
      rawPhone = '91' + rawPhone;
    }
    const url = `https://wa.me/${rawPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleSendCustomerGreetingWA = (cust: any) => {
    const message = `Hello ${cust.name},

Thank you for ordering from *The Paratha Duniya*! 🥘✨

We are delighted to have you as part of our culinary family. We hope you loved our fresh, golden, butterloaded stuffed parathas! 

Should you ever need anything or want to order again, you can reply directly to this message or visit us at http://localhost:3000. 

Have a wonderful day!

Best regards,
*The Paratha Duniya*`;
    const encoded = encodeURIComponent(message);
    let rawPhone = String(cust.phone).trim();
    if (rawPhone.length === 10) {
      rawPhone = '91' + rawPhone;
    }
    const url = `https://wa.me/${rawPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleSendDeliverySuccessWA = (o: any) => {
    const message = `Hello ${o.customer.name},

Your order *${o.orderNumber}* from *The Paratha Duniya* has been successfully delivered! 🛵💨

We hope you enjoyed our hot, fresh, butterloaded stuffed parathas. 

We would love to know how you liked them! Please share your rating or feedback with us here. 🌟

Thank you for choosing us!

Best regards,
*The Paratha Duniya*`;
    const encoded = encodeURIComponent(message);
    let rawPhone = String(o.customer.phone).trim();
    if (rawPhone.length === 10) {
      rawPhone = '91' + rawPhone;
    }
    const url = `https://wa.me/${rawPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Aggregated Stats Calculations
  const totalRevenue = orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + o.total, 0);

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const preparingOrders = orders.filter(o => o.status === 'PREPARING').length;
  const outForDelivery = orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length;
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;

  const codTotal = orders.filter(o => o.paymentMethod === 'COD' && o.status !== 'CANCELLED').length;
  const onlineTotal = orders.filter(o => o.paymentMethod !== 'COD' && o.status !== 'CANCELLED').length;

  // Dynamic 7-day revenue trend calculation
  const getWeeklyRevenueTrend = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayRevenue = orders
        .filter(o => {
          if (o.status === 'CANCELLED') return false;
          const orderDate = new Date(o.createdAt);
          return orderDate >= d && orderDate < nextDay;
        })
        .reduce((sum, o) => sum + o.total, 0);

      trend.push({
        day: days[d.getDay()],
        rev: dayRevenue
      });
    }

    return trend;
  };

  const weeklyTrend = getWeeklyRevenueTrend();

  // Filter orders by search query
  const searchedOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.phone.includes(q)
    );
  });

  // Login Screen if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center py-16 px-4">
        <div className="glass-panel p-8 sm:p-10 rounded-2xl w-full max-w-md space-y-6 text-left relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
          
          <div className="text-center space-y-2">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-primary">
              THE PARATHA DUNIYA
            </span>
            <h1 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">
              Secure Administration Portal
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@parathaduniya.com"
                className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#121212] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {loginError && (
              <p className="text-red-500 text-xs font-semibold">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-primary hover:bg-amber-400 text-black font-bold text-sm tracking-wide rounded-xl gold-glow transition-all"
            >
              Sign In to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col lg:flex-row print:bg-white print:text-black">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 bg-[#080808] border-r border-zinc-900 px-6 py-8 flex flex-col justify-between shrink-0 print:hidden">
        <div className="space-y-8">
          <div className="flex items-center space-x-2">
            <span className="font-serif text-lg font-bold tracking-wider text-primary">
              TPD ADMINISTRATION
            </span>
          </div>

          <nav className="flex flex-col space-y-2 text-left">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'orders', label: 'Order Manager', icon: ShoppingBag },
              { id: 'products', label: 'Product Inventory', icon: Plus },
              { id: 'customers', label: 'Customer Base', icon: Users },
              { id: 'coupons', label: 'Promo Coupons', icon: Ticket },
              { id: 'messages', label: 'Contact Messages', icon: MessageSquare },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-black font-bold shadow-md shadow-primary/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-zinc-900 flex flex-col space-y-4">
          {isSimulated && (
            <div className="flex items-center space-x-2 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-[10px] text-amber-500 font-semibold leading-tight">
                Simulated Database Offline Mode
              </span>
            </div>
          )}

          <button
            onClick={handleInstallPWA}
            className="flex items-center justify-center space-x-2 w-full py-2.5 bg-primary text-black font-bold rounded-xl text-xs hover:bg-amber-400 gold-glow transition-all"
          >
            <span>📱 Add Admin to Phone</span>
          </button>

          <button
            onClick={() => {
              playNewOrderChime();
              alert('Kitchen Bell Sound Alert Working! 🔔');
            }}
            className="flex items-center justify-center space-x-2 w-full py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black rounded-xl text-xs font-bold transition-all"
          >
            <span>Test Kitchen Bell 🔔</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 w-full py-3 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <main className="flex-grow p-6 sm:p-10 overflow-y-auto print:p-0">
        
        {/* TAB 1: DASHBOARD METRICS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10 text-left print:hidden">
            <h1 className="font-serif text-3xl font-extrabold text-white">Dashboard Overview</h1>

            {/* Quick Stat Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel p-6 rounded-2xl space-y-2">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
                <div className="flex items-center space-x-1.5">
                  <IndianRupee className="w-5 h-5 text-primary" />
                  <span className="text-3xl font-extrabold text-white">₹{totalRevenue}</span>
                </div>
                <span className="text-[10px] text-green-500 font-bold block">↑ 14% vs yesterday</span>
              </div>

              <div className="glass-panel p-6 rounded-2xl space-y-2">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Pending Orders</span>
                <span className="text-3xl font-extrabold text-primary block animate-pulse">{pendingOrders}</span>
                <span className="text-[10px] text-zinc-500 font-semibold block">Requires kitchens attention</span>
              </div>

              <div className="glass-panel p-6 rounded-2xl space-y-2">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Active Cooks</span>
                <span className="text-3xl font-extrabold text-white block">{preparingOrders + outForDelivery}</span>
                <span className="text-[10px] text-zinc-500 font-semibold block">{preparingOrders} preparing, {outForDelivery} delivery</span>
              </div>

              <div className="glass-panel p-6 rounded-2xl space-y-2">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Delivered Orders</span>
                <span className="text-3xl font-extrabold text-white block">{deliveredOrders}</span>
                <span className="text-[10px] text-zinc-500 font-semibold block">COD: {codTotal} | Online: {onlineTotal}</span>
              </div>
            </div>

            {/* Revenue Trend Visual Representation */}
            <div className="glass-panel p-8 rounded-2xl space-y-6">
              <h3 className="text-base font-bold text-white tracking-wide border-b border-zinc-900 pb-3">
                Last 7 Days Revenue Trend (INR)
              </h3>
              <div className="h-48 flex items-end justify-between gap-2 pt-6">
                {weeklyTrend.map((val, idx) => {
                  const maxVal = Math.max(...weeklyTrend.map(t => t.rev), 1000);
                  const pct = Math.min((val.rev / maxVal) * 100, 100);
                  return (
                    <div key={idx} className="flex flex-col items-center flex-grow space-y-2">
                      <span className="text-[10px] text-zinc-400 font-bold">₹{val.rev}</span>
                      <div className="w-full max-w-[40px] bg-zinc-900 rounded-t-md relative h-36 overflow-hidden">
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-amber-300 transition-all duration-1000"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 font-medium">{val.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDER MANAGER */}
        {activeTab === 'orders' && (
          <div className="space-y-8 text-left print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="font-serif text-3xl font-extrabold text-white">Order Management</h1>
              
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order ID or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-350">
                  <thead className="text-xs font-bold text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-900">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Items Summary</th>
                      <th className="px-6 py-4">Total Price</th>
                      <th className="px-6 py-4">Pay Method</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {searchedOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-zinc-900/30">
                        <td className="px-6 py-4 font-bold text-white">{o.orderNumber}</td>
                        <td className="px-6 py-4">
                          <div className="text-xs">
                            <span className="font-bold text-zinc-200 block">{o.customer.name}</span>
                            <span className="text-zinc-500 text-[10px] block">{o.customer.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-zinc-400 max-w-xs truncate">
                            {o.items.map((it: any) => `${it.product.name} (x${it.quantity})`).join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-primary">₹{o.total}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 text-left">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                o.paymentStatus === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                              }`}>
                                {o.paymentMethod} ({o.paymentStatus})
                              </span>
                              {o.paymentStatus !== 'PAID' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(o.id, undefined, 'PAID')}
                                  className="text-[9px] bg-green-500 hover:bg-green-600 text-black font-extrabold px-1.5 py-0.5 rounded transition-all active:scale-95 shrink-0"
                                  title="Mark Payment as Paid"
                                >
                                  Confirm Pay
                                </button>
                              )}
                            </div>
                            {o.paymentId && (
                              <div className="text-[10px] text-zinc-500 font-mono">
                                UTR: <strong className="text-zinc-300 select-all">{o.paymentId}</strong>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-semibold px-2 py-1 text-zinc-300 cursor-pointer focus:outline-none focus:border-primary"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="PREPARING">PREPARING</option>
                            <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end space-x-2">
                          <button
                            onClick={() => handleSendConfirmationWA(o)}
                            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-green-500 hover:text-green-500 rounded-lg transition-colors text-zinc-400"
                            title="Send WhatsApp Confirmation"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(o)}
                            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-primary hover:text-primary rounded-lg transition-colors text-zinc-400"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCT INVENTORY */}
        {activeTab === 'products' && (
          <div className="space-y-8 text-left print:hidden">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-3xl font-extrabold text-white">Product Inventory</h1>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center space-x-2 px-4.5 py-2.5 bg-primary text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition-all gold-glow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-350">
                  <thead className="text-xs font-bold text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-900">
                    <tr>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Attributes</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-900/30">
                        <td className="px-6 py-4 font-bold text-white">{p.name}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase">
                          {p.category ? p.category.name : 'Stuffed Paratha'}
                        </td>
                        <td className="px-6 py-4 font-bold text-white">₹{p.price}</td>
                        <td className="px-6 py-4 space-x-2">
                          <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-bold">VEG</span>
                          {p.isBestSeller && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">BEST</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleProductActive(p.id, p.isActive)}
                            className="flex items-center text-zinc-400 hover:text-primary transition-colors focus:outline-none"
                          >
                            {p.isActive ? (
                              <ToggleRight className="w-7 h-7 text-primary" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-zinc-700" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-zinc-650 text-zinc-500"
                            title="Delete Dish"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMERS LIST */}
        {activeTab === 'customers' && (
          <div className="space-y-8 text-left print:hidden">
            <h1 className="font-serif text-3xl font-extrabold text-white">Customer Database</h1>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-350">
                  <thead className="text-xs font-bold text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-900">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Total Orders</th>
                      <th className="px-6 py-4">Total Spend</th>
                      <th className="px-6 py-4">Last Active</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 font-semibold">
                          No customer profiles loaded yet.
                        </td>
                      </tr>
                    ) : (
                      customers.map((cust) => {
                        const lastActive = cust.lastOrder ? new Date(cust.lastOrder).toLocaleDateString('en-IN') : 'N/A';
                        return (
                          <tr key={cust.id} className="hover:bg-zinc-900/30">
                            <td className="px-6 py-4 font-bold text-white">{cust.name}</td>
                            <td className="px-6 py-4 font-mono text-zinc-400 text-xs">{cust.phone}</td>
                            <td className="px-6 py-4 text-xs text-zinc-400">{cust.email || 'N/A'}</td>
                            <td className="px-6 py-4 text-center font-semibold text-zinc-300">{cust.totalOrders}</td>
                            <td className="px-6 py-4 font-extrabold text-primary">₹{cust.totalSpending}</td>
                            <td className="px-6 py-4 text-xs text-zinc-500">{lastActive}</td>
                            <td className="px-6 py-4 text-right flex justify-end space-x-2">
                              <button
                                onClick={() => handleSendCustomerGreetingWA(cust)}
                                className="p-2 bg-zinc-900 border border-zinc-800 hover:border-green-500 hover:text-green-500 rounded-lg transition-colors text-zinc-400 flex items-center space-x-1"
                                title="Send WhatsApp Greeting"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold">Greet</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROMO COUPONS */}
        {activeTab === 'coupons' && (
          <div className="space-y-8 text-left print:hidden">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-3xl font-extrabold text-white">Coupon System</h1>
              <button
                onClick={() => setShowAddCouponModal(true)}
                className="flex items-center space-x-2 px-4.5 py-2.5 bg-primary text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition-all gold-glow"
              >
                <Plus className="w-4 h-4" />
                <span>Create Coupon</span>
              </button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-350">
                  <thead className="text-xs font-bold text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-900">
                    <tr>
                      <th className="px-6 py-4">Promo Code</th>
                      <th className="px-6 py-4">Discount Details</th>
                      <th className="px-6 py-4">Min Spend required</th>
                      <th className="px-6 py-4">Usage Counts</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-900/30">
                        <td className="px-6 py-4 font-bold text-white tracking-wider">{c.code}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-zinc-300">
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% Off` : `₹${c.discountValue} Off`}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-300">₹{c.minOrderValue}</td>
                        <td className="px-6 py-4 font-semibold text-zinc-400">{c.usesCount} uses</td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-bold uppercase">
                            ACTIVE
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-zinc-550 text-zinc-500"
                            title="Delete Promo"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS (CHANGE ADMIN CREDENTIALS) */}
        {activeTab === 'settings' && (
          <div className="space-y-8 text-left max-w-lg print:hidden">
            <h1 className="font-serif text-3xl font-extrabold text-white">Security Settings</h1>
            
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-850 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Change Admin Credentials</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Update your admin portal email address and security access password.
                </p>
              </div>

              {settingsError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3.5 rounded-xl text-xs flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">New Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. owner@parathaduniya.com"
                    value={settingsEmail}
                    onChange={(e) => setSettingsEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={settingsPassword}
                    onChange={(e) => setSettingsPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={settingsConfirmPassword}
                    onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full py-3 bg-primary text-black font-extrabold text-sm rounded-xl text-center hover:bg-amber-400 transition-all duration-300 gold-glow flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {settingsLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Update Credentials</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PRINT INVOICE LAYOUT (Only visible during print session) */}
        {selectedOrderForInvoice && (
          <div className="hidden print:block text-black p-8 text-left space-y-6">
            <div className="text-center border-b-2 border-black pb-4">
              <h1 className="font-serif text-3xl font-extrabold tracking-wider">THE PARATHA DUNIYA</h1>
              <p className="text-sm">Shop No. 5, Golden Arc Arcade, Safilguda, Hyderabad-500056</p>
              <p className="text-xs">Phone: +91 94927 60128</p>
            </div>

            <div className="flex justify-between text-sm pt-4">
              <div>
                <strong>Customer Info:</strong>
                <p>{selectedOrderForInvoice.customer.name}</p>
                <p>{selectedOrderForInvoice.customer.phone}</p>
                <p className="max-w-xs">{selectedOrderForInvoice.customer.address}</p>
              </div>
              <div className="text-right">
                <p><strong>Order Number:</strong> {selectedOrderForInvoice.orderNumber}</p>
                <p><strong>Date:</strong> {new Date(selectedOrderForInvoice.createdAt).toLocaleString()}</p>
                <p><strong>Pay Option:</strong> {selectedOrderForInvoice.paymentMethod}</p>
              </div>
            </div>

            <div className="pt-6">
              <table className="w-full text-sm border-t border-b border-black">
                <thead>
                  <tr className="border-b border-black font-bold">
                    <th className="py-2 text-left">Item Name</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrderForInvoice.items.map((it: any, i: number) => (
                    <tr key={i} className="text-xs">
                      <td className="py-2 text-left">{it.product.name}</td>
                      <td className="py-2 text-center">{it.quantity}</td>
                      <td className="py-2 text-right">₹{it.price}</td>
                      <td className="py-2 text-right">₹{it.price * it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end space-y-1.5 text-sm pt-4">
              <div className="flex justify-between w-64">
                <span>Subtotal:</span>
                <span>₹{selectedOrderForInvoice.subtotal}</span>
              </div>
              {selectedOrderForInvoice.discount > 0 && (
                <div className="flex justify-between w-64">
                  <span>Discount:</span>
                  <span>-₹{selectedOrderForInvoice.discount}</span>
                </div>
              )}
              <div className="flex justify-between w-64 font-bold border-t border-black pt-2 text-base">
                <span>Grand Total:</span>
                <span>₹{selectedOrderForInvoice.total}</span>
              </div>
            </div>

            <div className="text-center pt-12 border-t border-black text-xs">
              <p>Thank you for choosing The Paratha Duniya!</p>
              <p>Freshly baked. Lovingly served.</p>
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-6 text-left">
            <div className="glass-panel p-6 rounded-2xl border border-zinc-850 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Customer Enquiries & Feedback</h2>
                <p className="text-zinc-500 text-xs">Direct messages submitted from the "Reach Out to Us" website form.</p>
              </div>
              <span className="bg-primary/10 border border-primary/20 text-primary font-bold text-xs px-3 py-1.5 rounded-xl">
                {contactMessages.length} Messages
              </span>
            </div>

            <div className="glass-panel rounded-2xl border border-zinc-850 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-900">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Phone Number</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Message</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300">
                    {contactMessages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                          No customer messages submitted yet.
                        </td>
                      </tr>
                    ) : (
                      contactMessages.map((msg) => (
                        <tr key={msg.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">{msg.name}</td>
                          <td className="px-6 py-4 font-mono">{msg.phone}</td>
                          <td className="px-6 py-4 text-zinc-400">{msg.email || 'N/A'}</td>
                          <td className="px-6 py-4 max-w-sm leading-relaxed">{msg.message}</td>
                          <td className="px-6 py-4 text-zinc-500 text-[10px]">
                            {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end space-x-2">
                            <a
                              href={`https://wa.me/${String(msg.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${msg.name}, thank you for reaching out to The Paratha Duniya!`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-green-500/10 border border-green-500/20 hover:bg-green-500 hover:text-black rounded-lg transition-colors text-green-500"
                              title="Reply on WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteContactMessage(msg.id)}
                              className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition-colors text-red-500"
                              title="Delete Message"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* POPUP MODAL: ADD PRODUCT FORM */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 print:hidden">
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full space-y-6 text-left">
            <h3 className="text-xl font-bold text-white border-b border-zinc-900 pb-3">
              Add New Menu Item
            </h3>
            
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Dish Name</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Cheese Capsicum Paratha"
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="189"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="1">Signature Paratha</option>
                    <option value="2">Traditional Special</option>
                    <option value="3">Side Add-on</option>
                    <option value="4">Drinks & Beverage</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-6 text-xs font-bold text-zinc-300">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdVeg}
                    onChange={(e) => setNewProdVeg(e.target.checked)}
                    className="accent-primary"
                  />
                  <span>100% Vegetarian</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdBest}
                    onChange={(e) => setNewProdBest(e.target.checked)}
                    className="accent-primary"
                  />
                  <span>Set as Best Seller</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Description</label>
                <textarea
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Grated ingredients mixed with spices..."
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary h-20"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-grow py-3 bg-primary text-black font-bold rounded-lg text-xs hover:bg-amber-400 transition-colors"
                >
                  Create Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-6 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-lg text-xs hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: CREATE COUPON FORM */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 print:hidden">
          <div className="glass-panel p-8 rounded-2xl max-w-sm w-full space-y-6 text-left">
            <h3 className="text-xl font-bold text-white border-b border-zinc-900 pb-3">
              Generate Promo Code
            </h3>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Coupon Code Name</label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  placeholder="e.g. LUNCH50"
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percent (%)</option>
                    <option value="FIXED">Flat (INR)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={newCouponVal}
                    onChange={(e) => setNewCouponVal(e.target.value)}
                    placeholder="15"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Minimum Order Value</label>
                <input
                  type="number"
                  value={newCouponMin}
                  onChange={(e) => setNewCouponMin(e.target.value)}
                  placeholder="200"
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-grow py-3 bg-primary text-black font-bold rounded-lg text-xs hover:bg-amber-400 transition-colors"
                >
                  Create Promo Code
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCouponModal(false)}
                  className="px-6 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-lg text-xs hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA Mobile App Installation Instructions Modal */}
      {showInstallHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowInstallHelpModal(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-md bg-[#121212] border border-zinc-800 p-6 sm:p-8 rounded-3xl text-left space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <h3 className="font-serif text-lg font-bold text-white flex items-center space-x-2">
                <span>📱 Add Paratha Admin to Phone</span>
              </h3>
              <button
                onClick={() => setShowInstallHelpModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300">
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-2">
                <span className="text-primary font-bold block uppercase tracking-wider text-[10px]">🟢 For Android (Google Chrome):</span>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                  <li>Tap the <strong>3 dots (⋮)</strong> at top-right of Chrome.</li>
                  <li>Tap <strong>"Add to Home screen"</strong> (or <em>"Install app"</em>).</li>
                  <li>Tap <strong>Add</strong>. The icon will appear on your phone!</li>
                </ol>
              </div>

              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-2">
                <span className="text-primary font-bold block uppercase tracking-wider text-[10px]">🍎 For iPhone (Apple Safari):</span>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                  <li>Tap the <strong>Share icon [↑]</strong> at bottom center of Safari.</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong>Add</strong>. The icon will appear on your iPhone!</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowInstallHelpModal(false)}
              className="w-full py-3.5 bg-primary text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 transition-colors"
            >
              Got It, Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
