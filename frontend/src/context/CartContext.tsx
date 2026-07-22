'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  isVeg: boolean;
  customizations?: string[];
  notes?: string;
}

export interface AppliedCoupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
}

interface CartContextType {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: AppliedCoupon | null;
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  decrementQuantity: (productId: number) => void;
  clearCart: () => void;
  applyCouponCode: (code: string, backendUrl?: string) => Promise<{ success: boolean; message: string }>;
  removeCouponCode: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

import { useAuth } from './AuthContext';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const { token } = useAuth();

  // Load cart from database when logged in
  useEffect(() => {
    if (!token) return;

    const fetchDBCart = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/active-cart`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setCart(data.items);
          }
        }
      } catch (err) {
        console.error('Failed to load cart from DB:', err);
      }
    };

    fetchDBCart();
  }, [token]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('tpd_cart');
    const savedCoupon = localStorage.getItem('tpd_coupon');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    if (savedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(savedCoupon));
      } catch (e) {
        console.error('Failed to parse coupon', e);
      }
    }
  }, []);

  // Save cart to localStorage and sync with backend on changes
  useEffect(() => {
    localStorage.setItem('tpd_cart', JSON.stringify(cart));

    const token = typeof window !== 'undefined' ? localStorage.getItem('tpd_customer_token') : null;
    if (token) {
      fetch(`${API_BASE_URL}/api/orders/sync-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity }))
        })
      }).catch(err => console.log('Cart sync error:', err));
    }
  }, [cart, token]);

  // Save coupon to localStorage on changes
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('tpd_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('tpd_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  };

  const decrementQuantity = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== productId);
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    localStorage.removeItem('tpd_cart');
    localStorage.removeItem('tpd_coupon');
  };

  const applyCouponCode = async (code: string, backendUrl = API_BASE_URL) => {
    try {
      const res = await fetch(`${backendUrl}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, amount: subtotal }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to validate coupon' };
      }

      const coupon: AppliedCoupon = data.coupon;
      setAppliedCoupon(coupon);
      return { success: true, message: 'Coupon applied successfully!' };
    } catch (error) {
      console.error('Coupon error:', error);
      return { success: false, message: 'Could not connect to payment server.' };
    }
  };

  const removeCouponCode = () => {
    setAppliedCoupon(null);
  };

  // Computations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Calculate discount based on subtotal and coupon requirements
  let discount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minOrderValue) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else if (appliedCoupon.discountType === 'FIXED') {
      discount = appliedCoupon.discountValue;
    }
    // Discount cannot exceed subtotal
    discount = Math.min(discount, subtotal);
  }

  const total = subtotal - discount;

  // Auto-remove coupon if subtotal falls below minimum value
  useEffect(() => {
    if (appliedCoupon && subtotal < appliedCoupon.minOrderValue) {
      setAppliedCoupon(null);
    }
  }, [subtotal, appliedCoupon]);

  return (
    <CartContext.Provider
      value={{
        cart,
        subtotal,
        discount,
        total,
        appliedCoupon,
        addToCart,
        removeFromCart,
        decrementQuantity,
        clearCart,
        applyCouponCode,
        removeCouponCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
