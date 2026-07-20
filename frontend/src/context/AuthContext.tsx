'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CustomerProfile {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  houseNo: string | null;
  address: string | null;
  landmark: string | null;
  pincode: string | null;
  deliveryInstructions: string | null;
  googleId?: string | null;
}

interface AuthContextType {
  customer: CustomerProfile | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  login: (loginId: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, phone: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  googleLogin: (googleId: string, email: string, name: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfileState: (updatedFields: Partial<CustomerProfile>) => void;
  updateProfile: (fields: Partial<CustomerProfile>) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('tpd_customer_token');
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (authToken: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/customer/auth/verify', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (err) {
      console.error('Verify token failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginId: string, password: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('tpd_customer_token', data.token);
        setToken(data.token);
        setCustomer(data.customer);
        return { success: true, message: 'Logged in successfully!' };
      } else {
        return { success: false, message: data.error || 'Failed to login.' };
      }
    } catch (err) {
      console.error('Login request failed:', err);
      return { success: false, message: 'Server is offline. Unable to connect.' };
    }
  };

  const signup = async (name: string, phone: string, email: string, password: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/customer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('tpd_customer_token', data.token);
        setToken(data.token);
        setCustomer(data.customer);
        return { success: true, message: 'Account created successfully!' };
      } else {
        return { success: false, message: data.error || 'Failed to create account.' };
      }
    } catch (err) {
      console.error('Register request failed:', err);
      return { success: false, message: 'Server is offline. Unable to connect.' };
    }
  };

  const googleLogin = async (googleId: string, email: string, name: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/customer/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleId, email, name }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('tpd_customer_token', data.token);
        setToken(data.token);
        setCustomer(data.customer);
        return { success: true, message: 'Signed in with Google successfully!' };
      } else {
        return { success: false, message: data.error || 'Failed Google Login.' };
      }
    } catch (err) {
      console.error('Google Login request failed:', err);
      return { success: false, message: 'Server is offline. Unable to connect.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('tpd_customer_token');
    setToken(null);
    setCustomer(null);
  };

  const updateProfileState = (updatedFields: Partial<CustomerProfile>) => {
    if (customer) {
      setCustomer((prev) => (prev ? { ...prev, ...updatedFields } : null));
    }
  };

  const updateProfile = async (fields: Partial<CustomerProfile>) => {
    try {
      const res = await fetch('http://localhost:5000/api/customer/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      });

      const data = await res.json();

      if (res.ok) {
        setCustomer(data.customer);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to update profile.' };
      }
    } catch (err) {
      console.error('Update profile failed:', err);
      return { success: false, message: 'Server is offline. Unable to connect.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        isLoggedIn: !!customer,
        loading,
        isAuthOpen,
        setIsAuthOpen,
        login,
        signup,
        googleLogin,
        logout,
        updateProfileState,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
